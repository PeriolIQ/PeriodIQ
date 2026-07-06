#!/usr/bin/env bash
# ============================================================================
# verify-waf.sh - Kiem tra sau khi deploy: WAF da gan dung vao CloudFront chua
# va co dang chan tan cong (SQLi/XSS/rate limit) khong.
#
# Dung: ./verify-waf.sh
# Bien moi truong ghi de duoc: WAF_STACK, MAIN_STACK, MAIN_REGION
# ============================================================================
set -euo pipefail

WAF_STACK="${WAF_STACK:-periodiq-waf-cloudfront-dev}"
MAIN_STACK="${MAIN_STACK:-periodiq-dev}"
WAF_REGION="us-east-1"                       # CLOUDFRONT scope luon o us-east-1
MAIN_REGION="${MAIN_REGION:-ap-southeast-1}"
WAF_NAME="periodiq-cf-waf-dev"               # Name trong waf-cloudfront.yml

echo "==================================================================="
echo " 1) Lay WAF ARN (stack $WAF_STACK @ $WAF_REGION)"
echo "==================================================================="
WAF_ARN=$(aws cloudformation describe-stacks --stack-name "$WAF_STACK" --region "$WAF_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebAclArn'].OutputValue" --output text)
echo "   WAF_ARN = $WAF_ARN"

echo
echo "==================================================================="
echo " 2) CloudFront distribution + domain (stack $MAIN_STACK @ $MAIN_REGION)"
echo "==================================================================="
DIST_ID=$(aws cloudformation describe-stack-resources --stack-name "$MAIN_STACK" --region "$MAIN_REGION" \
  --query "StackResources[?ResourceType=='AWS::CloudFront::Distribution'].PhysicalResourceId" --output text)
CF_DOMAIN=$(aws cloudformation describe-stacks --stack-name "$MAIN_STACK" --region "$MAIN_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text)
echo "   DIST_ID   = $DIST_ID"
echo "   CF_DOMAIN = $CF_DOMAIN"

echo
echo "==================================================================="
echo " 3) [KIEM TRA CHINH] WebACLId dang gan tren CloudFront co khop khong"
echo "==================================================================="
ATTACHED=$(aws cloudfront get-distribution-config --id "$DIST_ID" \
  --query "DistributionConfig.WebACLId" --output text)
echo "   Dang gan = $ATTACHED"
if [ "$ATTACHED" = "$WAF_ARN" ]; then
  echo "   [OK] WAF da gan DUNG vao CloudFront."
else
  echo "   [LOI] CloudFront chua gan dung WAF ARN (deploy lai voi WafWebAclArn dung)."
fi

echo
echo "==================================================================="
echo " 4) Ban thu request tan cong qua CloudFront de kich hoat WAF"
echo "    (LUU Y: CustomErrorResponses 403->200 co the che status code,"
echo "     nen buoc 5 - CloudWatch metric - moi la bang chung dang tin)"
echo "==================================================================="
base="https://$CF_DOMAIN"
echo -n "   Request thuong     -> HTTP "; curl -s -o /dev/null -w "%{http_code}\n" "$base/"
echo -n "   XSS <script>       -> HTTP "; curl -s -o /dev/null -w "%{http_code}\n" "$base/?q=<script>alert(1)</script>"
echo -n "   SQLi UNION SELECT  -> HTTP "; curl -s -o /dev/null -w "%{http_code}\n" "$base/?id=1%20OR%201=1--%20UNION%20SELECT%20pw"

echo
echo "==================================================================="
echo " 5) [BANG CHUNG] WAF co that su CHAN khong - ban tan cong + sampled requests"
echo "==================================================================="
echo "   Ban 25 XSS + 25 SQLi qua CloudFront de kich hoat WAF..."
for i in $(seq 1 25); do
  curl -s -o /dev/null "$base/?q=<script>alert($i)</script>"
  curl -s -o /dev/null "$base/?id=$i%20OR%201=1--%20UNION%20SELECT%20password%20FROM%20users"
done
echo "   Da ban 50 request tan cong."

START=$(( $(date +%s) - 900 )); END=$(date +%s)
echo "   Sampled requests khop CommonRuleSet (XSS/SQLi) trong 15 phut qua:"
aws wafv2 get-sampled-requests --web-acl-arn "$WAF_ARN" \
  --rule-metric-name CommonRuleSetMetric --scope CLOUDFRONT --region "$WAF_REGION" \
  --time-window StartTime=$START,EndTime=$END --max-items 100 \
  --query "SampledRequests[].{Action:Action,Rule:RuleNameWithinRuleGroup,URI:Request.URI}" \
  --output table || true

echo
echo "   -> Thay Action=BLOCK: WAF DANG CHAN dung (status HTTP 200 o buoc 4 chi la"
echo "      do CustomErrorResponses 403->200 cua SPA che di, khong phai WAF khong chay)."
echo "   -> Rong? Doi ~1-2 phut cho sampled requests xuat hien roi chay lai, hoac xem"
echo "      Console: WAF & Shield > Web ACLs (Global/CloudFront) > $WAF_NAME > 'Sampled requests'."
