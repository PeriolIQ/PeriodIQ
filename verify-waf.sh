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
echo " 5) [BANG CHUNG] CloudWatch WAF BlockedRequests (1 gio qua)"
echo "==================================================================="
echo "   Cac dimension metric co san cua WebACL nay:"
aws cloudwatch list-metrics --namespace AWS/WAFV2 --region "$WAF_REGION" \
  --metric-name BlockedRequests \
  --query "Metrics[?Dimensions[?Value=='$WAF_NAME']].Dimensions" --output json || true

echo
echo "   Tong so request bi WAF CHAN (Rule=ALL):"
aws cloudwatch get-metric-statistics --region "$WAF_REGION" \
  --namespace AWS/WAFV2 --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value="$WAF_NAME" Name=Region,Value=CloudFront Name=Rule,Value=ALL \
  --start-time "$(date -u -d '-1 hour' +%FT%TZ 2>/dev/null || date -u -v-1H +%FT%TZ)" \
  --end-time "$(date -u +%FT%TZ)" \
  --period 300 --statistics Sum \
  --query "Datapoints[].Sum" --output text || true

echo
echo "   -> Neu so nay > 0 sau khi ban request tan cong: WAF DANG CHAN dung."
echo "   -> Neu rong/loi dimension: xem output buoc tren de lay dung Name/Value,"
echo "      hoac vao Console: WAF & Shield > Web ACLs (Global/CloudFront) >"
echo "      $WAF_NAME > tab 'Sampled requests'."
