# PeriodIQ

**Serverless Periodization Engine** — Hệ thống tự động hóa việc lên giáo án tập gym theo chu kỳ (Periodization), chạy hoàn toàn trên AWS Serverless.

PeriodIQ hoạt động như một "huấn luyện viên tự động": người dùng nhập chỉ số cá nhân và mục tiêu, hệ thống chạy Rule Engine trên AWS Lambda để xuất ra giáo án 4 tuần chuẩn khoa học — giúp tránh chấn thương do kiệt sức thần kinh (CNS) và phân bổ tạ hợp lý.

---

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Luồng xử lý chính](#luồng-xử-lý-chính)
- [Database Schema (DynamoDB)](#database-schema-dynamodb)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)
- [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
- [CI/CD Pipeline](#cicd-pipeline)
- [Phân công theo thành viên](#phân-công-theo-thành-viên)
- [Tài liệu chi tiết](#tài-liệu-chi-tiết)

---

## Tính năng chính

### Dành cho User (Người tập gym)
- **Tạo giáo án tự động** — Nhập chỉ số cá nhân (cân nặng, trình độ, mục tiêu), hệ thống sinh giáo án 4 tuần với trọng lượng cụ thể (kg) dựa trên Personal Record.
- **Theo dõi Personal Record (PR)** — Ghi nhận mức tạ nặng nhất từng nâng cho từng bài tập, Rule Engine dùng dữ liệu này để tính %1RM.
- **Check-in CNS hàng ngày** — Nhập giấc ngủ, mức stress, đau cơ; hệ thống tính Readiness Score để quyết định có cần giảm tải (deload) không.
- **Nhật ký buổi tập** — Ghi lại kết quả thực tế (set/rep/kg), Rule Engine phân tích để điều chỉnh plan cho tuần tiếp theo.
- **Nhận email giáo án & nhắc lịch tập** — Tác vụ gửi bất đồng bộ qua SQS → Worker → SES/SNS.

### Dành cho Admin
- **Quản lý bài tập (Exercise)** — CRUD danh sách bài tập với chỉ số CNS Stress Score.
- **Quản lý Workout Template** — Tạo/sửa mẫu lịch tập (Push/Pull/Legs, Upper/Lower...) với số set/rep mục tiêu.
- **Quản lý Rule Definition** — Bật/tắt, chỉnh tham số các quy tắc của Rule Engine (Volume, Conflict, Progression, Deload).
- **Xem thống kê** — Dashboard quản trị thông qua Admin API.

### Rule Engine — Bộ luật khoa học
Rule Engine chạy 3 bước tuần tự để sinh giáo án:

| Bước | Rule | Mô tả |
|------|------|-------|
| 1 | **Volume Filter** | Giới hạn tổng volume mỗi nhóm cơ/tuần (ví dụ: không quá 20 set/tuần cho 1 nhóm cơ) |
| 2 | **Conflict Resolution** | Tránh xếp 2 bài tập CNS cao liền nhau, phân bổ đều stress thần kinh |
| 3 | **Progression Builder** | Tăng tải dần qua các tuần (progressive overload), tự động chèn tuần deload khi cần |

---

## Kiến trúc hệ thống

Hệ thống triển khai hoàn toàn **Serverless** trên AWS, chia thành 7 tầng chức năng với 3 nhóm actor: **User**, **Admin**, **Developer**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AWS Cloud · Region ap-southeast-1                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. EDGE & SECURITY                                          │   │
│  │    User/Admin ──→ WAF ──→ CloudFront ──┬→ S3 (React+Vite)  │   │
│  │                                        └→ API Gateway       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. AUTH LAYER                                                │   │
│  │    Cognito (JWT) ──→ JWT Authorizer trên API Gateway        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. API LAYER                                                 │   │
│  │    API Gateway (HTTP) ──┬→ Lambda · API Handler (User)      │   │
│  │                         └→ Lambda · Admin API (Admin)       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 4. CORE ENGINE LAYER (Lambda)                                │   │
│  │    API Handler ──→ Rule Engine ──→ DynamoDB (Save plan)     │   │
│  │    Admin API ──→ DynamoDB (Manage data)                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 5. DATA LAYER                                                │   │
│  │    DynamoDB (on-demand + TTL cache) — 8 bảng                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 6. ASYNC / MESSAGING LAYER                                   │   │
│  │    API Handler ──→ SQS ──→ Lambda Worker ──→ SNS/SES       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 7. MONITORING LAYER                                          │   │
│  │    CloudWatch: Logs + Metrics + Alarm                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 8. CI/CD LAYER                                               │   │
│  │    CodePipeline ──→ CodeBuild ──→ CloudFormation/SAM        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Chi tiết từng tầng

| Tầng | Dịch vụ AWS | Vai trò |
|------|-------------|---------|
| Edge & Security | WAF, CloudFront, S3 | Chặn tấn công (SQL Injection, XSS, bot), phân phối web tĩnh, định tuyến `/api` |
| Auth | Cognito | Xác thực User & Admin, cấp JWT Token |
| API | API Gateway (HTTP) | Nhận request, xác minh JWT, invoke Lambda tương ứng |
| Core Engine | Lambda (API Handler, Rule Engine, Admin API) | Xử lý logic nghiệp vụ, chạy bộ luật khoa học |
| Data | DynamoDB (on-demand + TTL cache) | Lưu trữ NoSQL duy nhất, tự co giãn throughput |
| Async/Messaging | SQS, Lambda Worker, SNS/SES | Tách tác vụ chậm (email, nhắc lịch) khỏi luồng chính |
| Monitoring | CloudWatch (Logs, Metrics, Alarm) | Giám sát hiệu năng, phát hiện lỗi, cảnh báo |
| CI/CD | CodePipeline, CodeBuild, CloudFormation/SAM | Build, test, deploy tự động — zero-downtime |

---

## Cấu trúc dự án

```
PeriodIQ/
├── PeriodIQ.Backend/                # .NET 9 — Clean Architecture
│   ├── PeriodIQ.Api/                # Entry point — ASP.NET Web API
│   │   ├── Controllers/
│   │   │   ├── ExercisesController.cs
│   │   │   ├── WorkoutTemplatesController.cs
│   │   │   ├── RuleDefinitionsController.cs
│   │   │   ├── UserProfilesController.cs
│   │   │   ├── PersonalRecordHistoriesController.cs
│   │   │   ├── DailyCnsStatusesController.cs
│   │   │   ├── WorkoutPlansController.cs
│   │   │   ├── WorkoutSessionLogsController.cs
│   │   │   └── HealthController.cs
│   │   └── Program.cs
│   │
│   ├── PeriodIQ.Core/               # Business logic & services
│   │   ├── Interfaces/
│   │   │   ├── Repositories/        # IGenericRepository, IRepositories
│   │   │   └── Services/            # IExternalServices
│   │   └── Services/
│   │       ├── RuleEngineService.cs          # Rule Engine chính
│   │       ├── ProgressionAnalyticsService.cs
│   │       ├── ExerciseService.cs
│   │       ├── WorkoutPlanService.cs
│   │       ├── WorkoutTemplateService.cs
│   │       ├── UserProfileService.cs
│   │       ├── PersonalRecordHistoryService.cs
│   │       ├── DailyCnsStatusService.cs
│   │       ├── RuleDefinitionService.cs
│   │       └── WorkoutSessionLogService.cs
│   │
│   ├── PeriodIQ.Domain/             # Entities & domain models
│   │   ├── Common/
│   │   │   └── BaseEntity.cs        # Id, CreatedAt, UpdatedAt
│   │   └── Entities/
│   │       ├── Exercise.cs
│   │       ├── WorkoutTemplate.cs
│   │       ├── RuleDefinition.cs
│   │       ├── UserProfile.cs
│   │       ├── PersonalRecordHistory.cs
│   │       ├── DailyCnsStatus.cs
│   │       ├── WorkoutPlan.cs
│   │       └── WorkoutSessionLog.cs
│   │
│   ├── PeriodIQ.Infrastructure/     # External concerns
│   │   ├── Data/
│   │   │   ├── DynamoDbRepository.cs     # DynamoDB implementation
│   │   │   ├── InMemoryRepository.cs     # In-memory cho dev/test
│   │   │   ├── Repositories.cs
│   │   │   └── InMemoryRepositories.cs
│   │   └── Messaging/
│   │       └── SqsMessageQueueService.cs # SQS integration
│   │
│   ├── PeriodIQ.Share/              # Shared utilities & DTOs
│   ├── PeriodIQ.sln
│   └── docs/                        # Tài liệu thiết kế
│
├── PeriodIQ.Frontend/               # React 19 + Vite 8 SPA
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/ui/
│   │   ├── services/
│   │   │   └── axiosConfig.js
│   │   ├── assets/
│   │   └── lib/utils.js
│   └── package.json
│
├── buildspec-backend.yml            # CodeBuild spec cho backend
├── buildspec-frontend.yml           # CodeBuild spec cho frontend
├── template.yaml                    # SAM template (IaC)
└── samconfig.toml                   # SAM config
```

### Chiến lược "Monolithic Lambda"

Mặc dù kiến trúc AWS có 4 Lambda riêng biệt (API Handler, Admin API, Rule Engine, Worker), trong code .NET chỉ dùng **1 project API duy nhất** (`PeriodIQ.Api`) nhờ thư viện `Amazon.Lambda.AspNetCoreServer.Hosting`. Các Controller bên trong tự phân luồng request.

Logic Rule Engine và Worker được gọi trực tiếp từ bên trong API (qua service layer), không cần tách Lambda riêng. Nhờ Clean Architecture, nếu sau này cần tách thành nhiều Lambda, chỉ cần tạo project mới tham chiếu `PeriodIQ.Core` — không phải viết lại logic.

---

## Luồng xử lý chính

### Luồng 1: Tạo giáo án (Generate Workout Plan)

```
User ──→ WAF ──→ CloudFront ──→ API Gateway ──→ JWT Authorizer (Cognito)
                                                        │
                                                        ▼
                                              Lambda · API Handler
                                                        │
                                            ┌───────────┴───────────┐
                                            ▼                       ▼
                                      Rule Engine              SQS (email job)
                                            │                       │
                                    ┌───────┴───────┐               ▼
                                    ▼       ▼       ▼         Lambda Worker
                                 Volume  Conflict Progression       │
                                 Filter  Resolve  Builder           ▼
                                    │       │       │          SNS/SES
                                    └───────┴───────┘               │
                                            │                       ▼
                                            ▼                  Email → User
                                     DynamoDB (Save plan)
                                            │
                                            ▼
                                     Response → User
```

**Chi tiết từng bước:**

1. User truy cập web (React SPA), gửi request tạo giáo án
2. Request đi qua WAF (chặn tấn công) → CloudFront (CDN)
3. CloudFront route `/api` → API Gateway
4. API Gateway xác minh JWT (Cognito Authorizer), invoke Lambda
5. **Lambda API Handler** nhận form data, gọi **Rule Engine Service**:
   - **Volume Filter**: Giới hạn tổng volume/tuần cho mỗi nhóm cơ
   - **Conflict Resolution**: Tránh xếp bài tập CNS cao liền nhau
   - **Progression Builder**: Tăng tải dần, chèn deload khi cần
6. Rule Engine ghi giáo án 4 tuần (với kg cụ thể) vào **DynamoDB**
7. API Handler đẩy job gửi email vào **SQS** (bất đồng bộ)
8. **Lambda Worker** trigger từ SQS, gửi email giáo án qua **SNS/SES**
9. Trả response giáo án cho User ngay lập tức (không chờ email)

### Luồng 2: Check-in CNS hàng ngày

```
User nhập: giờ ngủ, mức stress, đau cơ
    │
    ▼
API Handler ──→ DailyCnsStatusService ──→ Tính ReadinessScore ──→ DynamoDB
    │
    ▼
Rule Engine đọc 7 ngày gần nhất ──→ Quyết định deload hay tiếp tục tăng tải
```

### Luồng 3: Ghi nhật ký buổi tập

```
User ghi: bài tập, set/rep thực tế, kg thực tế, RPE
    │
    ▼
API Handler ──→ WorkoutSessionLogService ──→ DynamoDB
    │
    ▼
Rule Engine phân tích kết quả ──→ Điều chỉnh plan tuần tiếp theo
    │
    ▼
Nếu lập PR mới ──→ Cập nhật PersonalRecordHistory
```

---

## Database Schema (DynamoDB)

8 bảng DynamoDB, chia thành 3 nhóm. Tất cả dùng `PAY_PER_REQUEST` billing mode.

### Master Data (Admin quản lý)

| Bảng | Partition Key | GSI | Mô tả |
|------|--------------|-----|-------|
| **Exercise** | `Id` (UUID) | — | Danh sách bài tập + CNS Stress Score (1-10) |
| **WorkoutTemplate** | `Id` (UUID) | — | Mẫu lịch tập (Push/Pull/Legs...) với set/rep mục tiêu |
| **RuleDefinition** | `Id` (UUID) | — | Quy tắc Rule Engine (Volume, Conflict, Progression, Deload) |

### User Profiles & Tracking

| Bảng | Partition Key | GSI | Mô tả |
|------|--------------|-----|-------|
| **UserProfile** | `Id` (Cognito User ID) | `Email-index` | Hồ sơ người dùng + fitness baseline |
| **PersonalRecordHistory** | `Id` (UUID) | `UserId-ExerciseId-index` | Lịch sử PR cho từng bài tập |
| **DailyCnsStatus** | `Id` (UUID) | `UserId-DateLog-index` | Check-in hàng ngày (ngủ, stress, đau cơ) |

### Generated Workout Plans

| Bảng | Partition Key | GSI | Mô tả |
|------|--------------|-----|-------|
| **WorkoutPlan** | `Id` (UUID) | `UserId-StartDate-index` | Giáo án 4-8 tuần với kg cụ thể (nested: Weeks → Days → Exercises) |
| **WorkoutSessionLog** | `Id` (UUID) | `UserId-CompletedAt-index` | Nhật ký buổi tập thực tế |

### Quy ước chung

Tất cả bảng đều có 3 trường base: `Id` (String, Partition Key), `CreatedAt` (ISO 8601), `UpdatedAt` (ISO 8601).

> Xem chi tiết schema từng bảng, cấu trúc nested, và lệnh tạo bảng tại [DynamoDB_Schema_Setup_Guide.md](PeriodIQ.Backend/docs/DynamoDB_Schema_Setup_Guide.md)

### Sơ đồ quan hệ giữa các bảng

```
                    ┌─────────────┐
                    │  Exercise   │
                    │  (Master)   │
                    └──────┬──────┘
                           │ ExerciseId
              ┌────────────┼────────────────┐
              ▼            ▼                ▼
┌─────────────────┐ ┌────────────────┐ ┌────────────────────┐
│WorkoutTemplate  │ │PersonalRecord  │ │ WorkoutSessionLog  │
│(Mẫu lịch tập)  │ │History (PR)    │ │ (Nhật ký buổi tập) │
└────────┬────────┘ └───────┬────────┘ └─────────┬──────────┘
         │TemplateId        │UserId              │WorkoutPlanId
         ▼                  ▼                    ▼
┌─────────────────┐ ┌──────────────┐   ┌─────────────────┐
│  WorkoutPlan    │ │ UserProfile  │   │  WorkoutPlan    │
│ (Lịch tập user) │ │ (Hồ sơ user) │   │ (Lịch tập user) │
└────────┬────────┘ └──────┬───────┘   └─────────────────┘
         │UserId           │Id
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ UserProfile  │   │DailyCnsStatus│
└──────────────┘   └──────────────┘

   ┌────────────────┐
   │ RuleDefinition │ ← Rule Engine đọc để tạo WorkoutPlan
   └────────────────┘
```

---

## API Endpoints

### User APIs

| Method | Endpoint | Controller | Mô tả |
|--------|----------|------------|-------|
| CRUD | `/api/exercises` | ExercisesController | Xem danh sách bài tập |
| CRUD | `/api/userprofiles` | UserProfilesController | Quản lý hồ sơ cá nhân |
| CRUD | `/api/personalrecordhistories` | PersonalRecordHistoriesController | Ghi nhận & xem PR |
| CRUD | `/api/dailycnsstatuses` | DailyCnsStatusesController | Check-in CNS hàng ngày |
| CRUD | `/api/workoutplans` | WorkoutPlansController | Xem/tạo giáo án |
| CRUD | `/api/workoutsessionlogs` | WorkoutSessionLogsController | Ghi nhật ký buổi tập |
| GET | `/api/health` | HealthController | Health check |

### Admin APIs

| Method | Endpoint | Controller | Mô tả |
|--------|----------|------------|-------|
| CRUD | `/api/workouttemplates` | WorkoutTemplatesController | Quản lý mẫu lịch tập |
| CRUD | `/api/ruledefinitions` | RuleDefinitionsController | Quản lý quy tắc Rule Engine |

---

## Tech Stack

### Backend
| Thành phần | Công nghệ |
|-----------|-----------|
| Runtime | .NET 9 |
| Framework | ASP.NET Core Web API |
| Architecture | Clean Architecture (5 projects) |
| Database | Amazon DynamoDB |
| Message Queue | Amazon SQS |
| Lambda Hosting | `Amazon.Lambda.AspNetCoreServer.Hosting` |
| Logging | Serilog (Console, File, Debug sinks) |
| API Docs | Swagger (Swashbuckle) + Scalar |
| IaC | AWS SAM / CloudFormation |

### Frontend
| Thành phần | Công nghệ |
|-----------|-----------|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 + Mantine 9 |
| State/Data | TanStack React Query 5 |
| HTTP Client | Axios |
| Routing | React Router 7 |
| Icons | Tabler Icons + Lucide |
| Linting | oxlint |

### AWS Services (16 dịch vụ)
| # | Dịch vụ | Tầng | Vai trò |
|---|---------|------|---------|
| 1 | AWS WAF | Edge & Security | Tường lửa ứng dụng web |
| 2 | CloudFront | Edge & Security | CDN + định tuyến |
| 3 | S3 | Edge & Security | Hosting frontend SPA |
| 4 | Cognito | Auth | Xác thực, cấp JWT |
| 5 | API Gateway (HTTP) | API | Nhận request, xác minh JWT |
| 6 | Lambda · API Handler | Core Engine | Xử lý request User |
| 7 | Lambda · Rule Engine | Core Engine | Sinh giáo án 4 tuần |
| 8 | Lambda · Admin API | Core Engine | Xử lý thao tác Admin |
| 9 | DynamoDB | Data | Lưu trữ + TTL cache |
| 10 | SQS | Async | Hàng đợi tác vụ bất đồng bộ |
| 11 | Lambda · Worker | Async | Xử lý message từ SQS |
| 12 | SNS / SES | Async | Gửi email & notification |
| 13 | CloudWatch | Monitoring | Logs + Metrics + Alarm |
| 14 | CodePipeline | CI/CD | Orchestrate pipeline |
| 15 | CodeBuild | CI/CD | Build & test |
| 16 | CloudFormation / SAM | CI/CD | Infrastructure as Code |

---

## Hướng dẫn cài đặt

### Yêu cầu

- .NET 9 SDK
- Node.js 18+
- AWS CLI v2 (đã cấu hình credentials)
- AWS SAM CLI

### Backend

```bash
cd PeriodIQ.Backend
dotnet restore
dotnet build
dotnet run --project PeriodIQ.Api
```

Backend chạy tại `https://localhost:5001` (hoặc port được cấu hình). Swagger UI tại `/swagger`.

### Frontend

```bash
cd PeriodIQ.Frontend
npm install
npm run dev
```

Frontend dev server chạy tại `http://localhost:5173`.

### Cấu hình AWS

1. Cài đặt AWS CLI và cấu hình credentials:
   ```bash
   aws configure
   # Access Key ID, Secret Access Key, Region: us-east-1, Output: json
   ```

2. Tạo 8 bảng DynamoDB — xem hướng dẫn chi tiết tại [DynamoDB_Schema_Setup_Guide.md](PeriodIQ.Backend/docs/DynamoDB_Schema_Setup_Guide.md)

3. Deploy bằng SAM:
   ```bash
   sam build
   sam deploy --guided
   ```

---

## CI/CD Pipeline

```
Developer push code
       │
       ▼
  CodePipeline
       │
       ├──→ buildspec-backend.yml   ──→ Build & test .NET ──→ SAM package ──→ Deploy Lambda
       │
       └──→ buildspec-frontend.yml  ──→ Build React+Vite ──→ Deploy to S3 + CloudFront invalidation
```

- **Backend**: `buildspec-backend.yml` — restore, build, test (với test report + CodeBuild report), đóng gói artifact, deploy qua CloudFormation/SAM.
- **Frontend**: `buildspec-frontend.yml` — npm install, security scan, build, sync lên S3.
- Zero-downtime deployment cho cả backend và frontend.

---

## Phân công theo thành viên

> Mỗi người phụ trách **3-4 dịch vụ AWS** + nhiệm vụ **Backend (BE)** và **Frontend (FE)** tương ứng.

---

### Người 1 — Auth & User Profile (3 dịch vụ)

| Dịch vụ AWS | Vai trò |
|-------------|---------|
| **Amazon Cognito** | Setup User Pool, cấu hình JWT cho User + Admin |
| **AWS WAF** | Cấu hình rule chặn bot, SQL Injection, XSS |
| **Amazon CloudFront** | Setup CDN, phân luồng static → S3 và /api → API Gateway |

#### Backend

- **Cognito User Pool setup**:
  - Tạo User Pool với các attribute: email (required), name
  - Cấu hình App Client (cho frontend SPA — no secret)
  - Setup hosted UI hoặc custom auth flow
  - Cấu hình password policy, MFA (tùy chọn)
  - Tạo User Pool Groups: `Users`, `Admins`

- **Cognito integration trong .NET**:
  - Cấu hình JWT Bearer Authentication trong `Program.cs`
  - Validate JWT token từ Cognito (issuer, audience)
  - Middleware extract `CognitoUserId` từ JWT claims → map với `UserProfile.Id`
  - Phân quyền `[Authorize]` trên Controller, `[Authorize(Roles = "Admins")]` cho admin endpoints

- **WAF rules**:
  - Tạo Web ACL gắn vào CloudFront distribution
  - Bật AWS Managed Rules: `AWSManagedRulesCommonRuleSet` (SQL injection, XSS)
  - Bật `AWSManagedRulesBotControlRuleSet` (chặn bot)
  - Rate limiting rule (ví dụ: 2000 requests/5 phút per IP)

- **CloudFront distribution**:
  - Origin 1: S3 bucket (frontend) — default behavior `/*`
  - Origin 2: API Gateway — behavior `/api/*` (forward headers, cookies)
  - Cấu hình OAC (Origin Access Control) cho S3
  - Gắn WAF Web ACL vào distribution
  - Setup custom domain + SSL certificate (ACM) nếu có

- **DynamoDB table `UserProfile`**:
  - Tạo bảng theo schema (xem [DynamoDB guide](PeriodIQ.Backend/docs/DynamoDB_Schema_Setup_Guide.md#64-bảng-userprofile--hồ-sơ-người-dùng))
  - `UserProfilesController`: CRUD endpoints
  - `UserProfileService`: Business logic
    - `POST /api/userprofiles` — Tạo profile sau khi đăng ký Cognito (Id = Cognito User ID)
    - `GET /api/userprofiles/{id}` — Lấy profile (chỉ được xem profile của chính mình)
    - `PUT /api/userprofiles/{id}` — Cập nhật chỉ số (BodyWeightKg, FitnessLevel, PrimaryGoal, AvailableDaysPerWeek)
  - Đảm bảo `Id` trong UserProfile = `sub` claim từ Cognito JWT

#### Frontend

- **Trang Login** (`/login`):
  - Form đăng nhập: email + password
  - Gọi Cognito `InitiateAuth` (hoặc dùng Amplify/aws-jwt-verify)
  - Lưu JWT token (access + refresh) vào memory/httpOnly cookie
  - Redirect về dashboard sau khi login thành công
  - Hiển thị lỗi: sai mật khẩu, tài khoản chưa xác minh

- **Trang Register** (`/register`):
  - Form đăng ký: email, password, họ tên
  - Gọi Cognito `SignUp`
  - Trang xác minh OTP (Cognito gửi email verification code)
  - Sau khi verify → tự động gọi `POST /api/userprofiles` tạo profile

- **Trang Forgot Password** (`/forgot-password`):
  - Nhập email → Cognito gửi reset code
  - Nhập code + mật khẩu mới → Cognito `ConfirmForgotPassword`

- **Trang Profile** (`/profile`):
  - Hiển thị thông tin cá nhân từ `GET /api/userprofiles/{id}`
  - Form chỉnh sửa: cân nặng (kg), trình độ (dropdown: Beginner/Intermediate/Advanced), mục tiêu (Strength/Hypertrophy), số ngày tập/tuần
  - Gọi `PUT /api/userprofiles/{id}` khi save

- **Quản lý JWT token**:
  - Tạo Axios interceptor (trong `axiosConfig.js`): tự động gắn `Authorization: Bearer <token>` vào mọi request
  - Auto refresh token khi access token hết hạn
  - Redirect về `/login` khi refresh token cũng hết hạn (401)
  - Protected route HOC/component: check token trước khi render trang

---

### Người 2 — Rule Engine & Sinh giáo án (3 dịch vụ)

| Dịch vụ AWS | Vai trò |
|-------------|---------|
| **Lambda · API Handler** | Điểm vào chính, nhận form data từ User |
| **Lambda · Rule Engine** | Chạy 3 bộ luật: Volume → Conflict → Progression |
| **Amazon S3** | Hosting file tĩnh React + Vite (SPA) |

#### Backend

- **`RuleEngineService.cs`** — Logic core của hệ thống:
  - **Input**: `UserId`, `TemplateId` (hoặc auto-select dựa trên goal + fitness level)
  - **Output**: `WorkoutPlan` hoàn chỉnh (4 tuần, với kg cụ thể)
  - **Bước 1 — Load data**:
    - Đọc `UserProfile` (FitnessLevel, BodyWeightKg, PrimaryGoal, AvailableDaysPerWeek)
    - Đọc `WorkoutTemplate` phù hợp
    - Đọc `PersonalRecordHistory` của user (để tính %1RM)
    - Đọc `DailyCnsStatus` 7 ngày gần nhất (để đánh giá readiness)
    - Đọc tất cả `RuleDefinition` đang active (`IsActive = true`), sort theo `PriorityOrder`
  - **Bước 2 — Volume Filter**:
    - Áp dụng `VolumeRule`: giới hạn tổng set/tuần cho mỗi nhóm cơ (ví dụ: max 20 set/tuần cho Chest)
    - Nếu template vượt quá → cắt bớt set ở bài tập có CNS Stress Score thấp nhất
  - **Bước 3 — Conflict Resolution**:
    - Áp dụng `CnsConflictRule`: không xếp 2 bài tập có `CnsStressScore >= 8` trong cùng 1 ngày
    - Nếu conflict → swap bài tập sang ngày khác hoặc thay bằng bài tập alternative (cùng PrimaryMuscleGroup, CNS thấp hơn)
  - **Bước 4 — Progression Builder**:
    - Tuần 1: Tính `TargetWeightKg` = PR × `TargetIntensityPercentage` (ví dụ: PR 100kg × 75% = 75kg)
    - Tuần 2: +2.5% weight hoặc +1 rep (tùy `ProgressionRule`)
    - Tuần 3: +5% weight hoặc +1 set
    - Tuần 4: **Deload** — giảm volume 40% (theo `DeloadRule`)
    - Nếu user chưa có PR → dùng estimate dựa trên BodyWeightKg + FitnessLevel
  - **Bước 5 — Save**:
    - Tạo `WorkoutPlan` object với nested `Weeks → Days → Exercises` (kèm kg cụ thể)
    - Ghi vào DynamoDB bảng `WorkoutPlan`
    - Set `Status = "Active"`, đánh dấu plan cũ thành `"Completed"` hoặc `"Abandoned"`

- **`WorkoutPlansController.cs`**:
  - `POST /api/workoutplans/generate` — Gọi RuleEngineService để sinh plan mới
  - `GET /api/workoutplans?userId={id}` — Lấy danh sách plan (sort theo StartDate desc)
  - `GET /api/workoutplans/{id}` — Lấy chi tiết 1 plan (kèm toàn bộ Weeks/Days/Exercises)
  - `PATCH /api/workoutplans/{id}/status` — Cập nhật status (Active/Completed/Abandoned)

- **`ExercisesController.cs`**:
  - `GET /api/exercises` — Lấy danh sách bài tập (filter theo MuscleGroup, EquipmentType)
  - `GET /api/exercises/{id}` — Chi tiết bài tập

- **S3 bucket hosting**:
  - Tạo S3 bucket cho frontend (block public access, dùng OAC qua CloudFront)
  - Cấu hình static website hosting
  - Upload build output (`npm run build` → thư mục `dist/`) lên S3

#### Frontend

- **Scaffold dự án React + Vite**:
  - Cấu hình project structure: `pages/`, `components/`, `services/`, `hooks/`
  - Setup React Router: routes cho login, register, profile, dashboard, plan...
  - Setup TanStack React Query: `QueryClient`, `QueryClientProvider`
  - Cấu hình Axios base URL (trỏ đến API Gateway hoặc localhost khi dev)

- **Form nhập thông số tập** (`/generate`):
  - Dropdown chọn mục tiêu: Strength / Hypertrophy
  - Dropdown chọn trình độ: Beginner / Intermediate / Advanced
  - Input số ngày tập/tuần (3-6)
  - Dropdown/search chọn WorkoutTemplate (hoặc auto-suggest)
  - Nút "Tạo giáo án" → gọi `POST /api/workoutplans/generate`
  - Loading state trong khi Rule Engine xử lý

- **Trang hiển thị giáo án 4 tuần** (`/plans/{id}`):
  - **Tab/Accordion theo tuần**: Tuần 1, Tuần 2, Tuần 3, Tuần 4 (Deload)
  - Mỗi tuần hiển thị **bảng theo ngày**:
    - Cột: Ngày (Monday, Tuesday...) | Focus Area | Bài tập
    - Mỗi bài tập hiển thị: Tên | Sets × Reps | Target Weight (kg) | Rest Time
  - Highlight tuần deload (màu khác, badge "Deload Week")
  - Nút "Bắt đầu tập" cho ngày hiện tại → navigate đến trang log buổi tập

- **Trang danh sách plan** (`/plans`):
  - Danh sách các plan đã tạo (Active, Completed, Abandoned)
  - Badge status với màu khác nhau
  - Sort theo ngày bắt đầu
  - Click vào plan → xem chi tiết

- **Deploy lên S3**:
  - Script `npm run build` → upload `dist/` lên S3 bucket
  - Invalidate CloudFront cache sau khi deploy

---

### Người 3 — Tiến trình & Async Notification (3 dịch vụ)

| Dịch vụ AWS | Vai trò |
|-------------|---------|
| **Amazon SQS** | Hàng đợi tác vụ bất đồng bộ |
| **Lambda · Worker** | Xử lý message từ SQS |
| **Amazon SNS / SES** | Gửi email giáo án & workout reminder |

#### Backend

- **SQS queue setup**:
  - Tạo SQS Standard Queue: `periodiq-notification-queue`
  - Cấu hình Dead Letter Queue (DLQ) cho message thất bại (maxReceiveCount = 3)
  - Cấu hình visibility timeout phù hợp (ví dụ: 30 giây)
  - `SqsMessageQueueService.cs` đã có sẵn — cần implement:
    - `SendMessageAsync(type, payload)` — đẩy message vào queue
    - Message types: `SEND_PLAN_EMAIL`, `WORKOUT_REMINDER`, `PR_CONGRATULATION`

- **Lambda Worker** (trigger từ SQS):
  - Parse message body → switch theo type
  - `SEND_PLAN_EMAIL`: Đọc WorkoutPlan từ DynamoDB, format thành email HTML, gửi qua SES
  - `WORKOUT_REMINDER`: Gửi push notification/email nhắc lịch tập hôm nay
  - `PR_CONGRATULATION`: Gửi email chúc mừng khi user lập PR mới
  - Error handling: message lỗi → retry 3 lần → vào DLQ

- **SNS / SES setup**:
  - SES: Verify domain/email sender, tạo email template cho:
    - Template "workout-plan": Bảng giáo án 4 tuần (HTML table)
    - Template "workout-reminder": Nhắc bài tập hôm nay (tên bài, set/rep/kg)
    - Template "pr-congrats": Chúc mừng PR mới (tên bài, kg cũ → kg mới)
  - SNS: Topic cho alarm notification (optional, Người 5 có thể dùng)

- **`WorkoutSessionLogsController.cs`** — Nhật ký buổi tập:
  - `POST /api/workoutsessionlogs` — Ghi log buổi tập
    - Validate: userId, workoutPlanId, weekNumber, day
    - Lưu `PerformedExercises` (ExerciseId, ActualSets, ActualReps, ActualWeightKg, FailedRep)
    - Tính `OverallSessionRpe` (trung bình RPE các bài hoặc user tự nhập)
    - **Check PR**: So sánh `ActualWeightKg` với `PersonalRecordHistory` → nếu cao hơn:
      - Tạo record mới trong `PersonalRecordHistory`
      - Đẩy message `PR_CONGRATULATION` vào SQS
  - `GET /api/workoutsessionlogs?userId={id}` — Lịch sử buổi tập (sort theo CompletedAt)
  - `GET /api/workoutsessionlogs/{id}` — Chi tiết 1 buổi tập

- **`ProgressionAnalyticsService.cs`** — Phân tích tiến trình:
  - `GetProgressionData(userId, exerciseId, dateRange)` — Trả về data cho biểu đồ tăng tạ theo thời gian
  - `GetVolumeByWeek(userId, planId)` — Tổng volume mỗi tuần (để so sánh planned vs actual)
  - `GetStreakData(userId)` — Tính chuỗi ngày tập liên tiếp (streak)

#### Frontend

- **Dashboard chính** (`/dashboard`):
  - **Card XP / Level**: Tính XP từ số buổi tập hoàn thành (ví dụ: 10 XP/buổi), hiển thị level
  - **Streak counter**: Chuỗi ngày tập liên tiếp (icon lửa + số ngày)
  - **Card "Hôm nay tập gì"**: Hiển thị bài tập hôm nay từ plan đang Active (nếu có)
  - **Biểu đồ tăng tạ**: Line chart (dùng Recharts hoặc Chart.js) — trục X: thời gian, trục Y: kg — cho bài tập chính (Bench, Squat, Deadlift)

- **Form log buổi tập** (`/log`):
  - Auto-fill từ plan hôm nay: danh sách bài tập, target set/rep/kg
  - User chỉnh sửa: actual set, actual rep, actual kg cho từng bài
  - Checkbox "Failed Rep" cho từng bài
  - Input RPE chung cả buổi (slider 1-10)
  - Nút "Hoàn thành buổi tập" → `POST /api/workoutsessionlogs`
  - Hiển thị popup chúc mừng nếu lập PR mới

- **Trang lịch sử tập** (`/history`):
  - Danh sách các buổi tập đã hoàn thành (card/list)
  - Mỗi buổi hiển thị: ngày, focus area, tổng volume, RPE
  - Click vào → xem chi tiết từng bài tập (actual vs planned)

- **Trang cài đặt thông báo** (`/settings/notifications`):
  - Toggle bật/tắt email reminder
  - Chọn thời gian nhận reminder (ví dụ: 7:00 AM ngày tập)
  - Toggle bật/tắt email chúc mừng PR

---

### Người 4 — Admin Panel & Data (3 dịch vụ)

| Dịch vụ AWS | Vai trò |
|-------------|---------|
| **Lambda · Admin API** | Xử lý thao tác quản trị |
| **Amazon DynamoDB** | Thiết kế toàn bộ schema, quản lý tables |
| **API Gateway (HTTP)** | Cấu hình routes, gắn JWT Authorizer |

#### Backend

- **Lambda Admin API** — CRUD bộ luật, template, thống kê:

  - **`RuleDefinitionsController.cs`**:
    - `GET /api/ruledefinitions` — Danh sách tất cả rules (filter theo Category, IsActive)
    - `GET /api/ruledefinitions/{id}` — Chi tiết 1 rule
    - `POST /api/ruledefinitions` — Tạo rule mới
      - Validate: Category phải là 1 trong (VolumeRule, CnsConflictRule, ProgressionRule, DeloadRule)
      - `RuleParametersJson` phải là valid JSON
      - `PriorityOrder` không được trùng với rule cùng Category
    - `PUT /api/ruledefinitions/{id}` — Cập nhật rule (thay đổi tham số, priority)
    - `PATCH /api/ruledefinitions/{id}/toggle` — Bật/tắt `IsActive`
    - `DELETE /api/ruledefinitions/{id}` — Xóa rule

  - **`WorkoutTemplatesController.cs`**:
    - `GET /api/workouttemplates` — Danh sách templates (filter theo Goal, SuitableFitnessLevel)
    - `GET /api/workouttemplates/{id}` — Chi tiết template (kèm Days → Exercises)
    - `POST /api/workouttemplates` — Tạo template mới
      - Validate nested structure: Days phải có DaySequence unique, mỗi Day phải có ít nhất 1 Exercise
      - ExerciseId phải tồn tại trong bảng Exercise
    - `PUT /api/workouttemplates/{id}` — Cập nhật template
    - `DELETE /api/workouttemplates/{id}` — Xóa template

  - **`ExercisesController.cs`** (Admin CRUD):
    - `POST /api/exercises` — Thêm bài tập mới (Admin only)
      - Validate: CnsStressScore 1-10, PrimaryMuscleGroup không rỗng
    - `PUT /api/exercises/{id}` — Sửa bài tập
    - `DELETE /api/exercises/{id}` — Xóa bài tập (check không có template nào đang reference)

- **Thiết kế DynamoDB schema cho toàn bộ hệ thống**:
  - Tạo đủ 8 bảng theo [DynamoDB_Schema_Setup_Guide.md](PeriodIQ.Backend/docs/DynamoDB_Schema_Setup_Guide.md)
  - Setup GSI cho các bảng cần query phức tạp (UserProfile, PersonalRecordHistory, DailyCnsStatus, WorkoutPlan, WorkoutSessionLog)
  - Implement `DynamoDbRepository.cs`:
    - Generic CRUD operations (GetById, GetAll, Create, Update, Delete)
    - Query by GSI (QueryByPartitionKey, QueryByCompositeKey)
    - Batch operations nếu cần (BatchWriteItem cho seed data)
  - Seed data mẫu: 10+ exercises, 2-3 templates, 4-5 rules

- **API Gateway setup**:
  - Tạo HTTP API trên API Gateway
  - Cấu hình routes: `ANY /api/{proxy+}` → Lambda function
  - Gắn JWT Authorizer (Cognito User Pool) lên tất cả routes `/api/*`
  - Cấu hình CORS: allow origin từ CloudFront domain + localhost (dev)
  - Stage: `$default` (auto-deploy)

- **Thống kê cho Admin**:
  - `GET /api/admin/stats` — Tổng số users, plans đã tạo, active plans, buổi tập hoàn thành
  - `GET /api/admin/stats/popular-exercises` — Top 10 bài tập được dùng nhiều nhất
  - `GET /api/admin/stats/user-activity` — Số user active theo tuần/tháng

#### Frontend

- **Trang Admin Dashboard** (`/admin`):
  - Require role `Admins` (redirect nếu không phải admin)
  - Cards thống kê: Tổng users | Active plans | Buổi tập hôm nay | Templates
  - Bảng thống kê & báo cáo tổng quan

- **Trang quản lý bộ luật** (`/admin/rules`):
  - Bảng danh sách rules: Category | Name | Priority | Active (toggle switch)
  - Nút "Thêm rule mới" → Modal/form:
    - Dropdown Category (VolumeRule, CnsConflictRule, ProgressionRule, DeloadRule)
    - Input: RuleName, Description
    - JSON editor cho RuleParametersJson (có validate)
    - Input PriorityOrder (number)
  - Click row → Edit form (pre-fill data)
  - Nút Delete (confirm dialog)

- **Trang quản lý template giáo án** (`/admin/templates`):
  - Bảng danh sách: Template Name | Goal | Fitness Level | Số ngày/tuần
  - Nút "Tạo template" → Form phức tạp:
    - Input tên, chọn goal, chọn fitness level
    - **Dynamic form cho Days**: Nút "Thêm ngày" → mỗi ngày có:
      - DaySequence (auto-increment)
      - FocusArea (text input)
      - **Danh sách bài tập**: Search/dropdown chọn Exercise + input TargetSets, TargetRepRange, TargetIntensityPercentage
  - Preview template trước khi save

- **Trang quản lý bài tập** (`/admin/exercises`):
  - Bảng: Name | Muscle Group | Equipment | CNS Score | PR Eligible
  - Filter theo MuscleGroup, EquipmentType
  - CRUD modal/form
  - Import bulk exercises (CSV upload — optional)

- **Shared components & layout chung**:
  - Sidebar navigation (cho cả user và admin)
  - Header: user info, logout button
  - Layout wrapper: `UserLayout`, `AdminLayout`
  - Reusable components: DataTable, Modal, ConfirmDialog, Badge, StatusTag

---

### Người 5 — CI/CD & Monitoring (4 dịch vụ)

| Dịch vụ AWS | Vai trò |
|-------------|---------|
| **AWS CodePipeline** | Orchestrate pipeline triển khai |
| **AWS CodeBuild** | Build & test mã nguồn |
| **CloudFormation / SAM** | Infrastructure as Code, đóng gói & deploy |
| **Amazon CloudWatch** | Logs + Metrics + Alarm |

#### Backend

- **SAM template** (`template.yaml`):
  - Định nghĩa toàn bộ infrastructure as code:
    - `AWS::Serverless::Function` — Lambda function (runtime: dotnet9, handler, memory, timeout)
    - `AWS::Serverless::HttpApi` — API Gateway HTTP API
    - `AWS::DynamoDB::Table` — 8 bảng DynamoDB (hoặc reference nếu tạo riêng)
    - `AWS::S3::Bucket` — Frontend hosting bucket
    - `AWS::SQS::Queue` — Notification queue + DLQ
    - `AWS::SNS::Topic` — Alarm notification topic
  - Environment variables cho Lambda: DynamoDB table names, SQS queue URL, Cognito config
  - IAM Role/Policy: Lambda execution role với quyền DynamoDB, SQS, SES, CloudWatch

- **CodePipeline + CodeBuild** (`buildspec-backend.yml`):
  - **Source stage**: GitHub webhook (trigger on push to `main`)
  - **Build stage** (CodeBuild):
    - `install`: Setup .NET 9 SDK
    - `pre_build`: `dotnet restore`
    - `build`: `dotnet build --configuration Release`
    - `post_build`:
      - `dotnet test` — chạy unit tests, xuất report (JUnit format cho CodeBuild report)
      - `sam package` — đóng gói artifact
  - **Deploy stage**: `sam deploy` hoặc CloudFormation changeset
  - Artifact versioning: tag build với commit hash

- **CodeBuild cho Frontend** (`buildspec-frontend.yml`):
  - `install`: Setup Node.js
  - `pre_build`: `npm ci`
  - `build`:
    - Security scan: `npm audit` hoặc tool tương đương
    - `npm run build`
  - `post_build`: `aws s3 sync dist/ s3://<bucket>` + CloudFront invalidation

- **CloudWatch setup**:
  - **Log groups**: Tạo log group cho mỗi Lambda function, retention 14 ngày
  - **Metric filters**: Parse log để tạo custom metrics:
    - `RuleEngineExecutionTime` — thời gian Rule Engine chạy
    - `PlanGenerationCount` — số plan được tạo
    - `ErrorCount` — số lỗi 5xx
  - **Alarms**:
    - Lambda Error Rate > 5% trong 5 phút → SNS alert
    - Lambda Duration > 10 giây (p95) → SNS alert
    - DynamoDB ThrottledRequests > 0 → SNS alert
    - Lambda ConcurrentExecutions > 80% limit → SNS alert
  - **Dashboard**: Tạo CloudWatch dashboard tổng hợp:
    - Widget: Lambda invocations, duration, errors (theo function)
    - Widget: DynamoDB read/write capacity, throttled requests
    - Widget: API Gateway request count, latency, 4xx/5xx

- **`HealthController.cs`** — Health check endpoint:
  - `GET /api/health` — Kiểm tra:
    - API status: OK
    - DynamoDB connectivity: ping 1 bảng
    - Timestamp, version (từ assembly)
  - Dùng cho: ALB health check, uptime monitoring, pipeline smoke test

#### Frontend

- **Trang Monitoring Dashboard** (`/admin/monitoring`):
  - **Health status card**: Gọi `GET /api/health` hiển thị status (xanh/đỏ), response time, last checked
  - **Uptime indicator**: Hiển thị uptime % (tính từ health check history)
  - **System info**: API version, Lambda memory, region

- **Trang Deploy Log** (`/admin/deploys`):
  - Gọi AWS SDK / API để lấy pipeline execution history
  - Bảng: Commit | Status (Succeeded/Failed/InProgress) | Duration | Timestamp
  - Click vào → xem chi tiết build log (từ CodeBuild)
  - Badge màu theo status: xanh (success), đỏ (failed), vàng (in progress)

- **Shared components & layout chung cho cả nhóm**:
  - Base layout, sidebar, header — phối hợp với Người 4
  - Theme setup (Tailwind + Mantine): color palette, typography, spacing
  - Loading states, error boundaries, toast notifications
  - Responsive design: mobile-friendly cho trang user (người tập hay dùng điện thoại)

---

## Tài liệu chi tiết

| Tài liệu | Đường dẫn | Mô tả |
|-----------|-----------|-------|
| Mô tả dự án | [mô tả dự án.txt](PeriodIQ.Backend/docs/mô%20tả%20dự%20án.txt) | Tổng quan 7 tầng kiến trúc và luồng xử lý |
| Phân tích dự án | [phân tích dự án.html](PeriodIQ.Backend/docs/phân%20tích%20dự%20án.html) | Báo cáo toàn diện với sơ đồ Mermaid tương tác |
| Giải thích kiến trúc | [Architecture_Explanation.txt](PeriodIQ.Backend/docs/Architecture_Explanation.txt) | Lý do dùng Monolithic Lambda + Clean Architecture |
| Hướng dẫn DynamoDB | [DynamoDB_Schema_Setup_Guide.md](PeriodIQ.Backend/docs/DynamoDB_Schema_Setup_Guide.md) | Hướng dẫn từng bước tạo 8 bảng, seed data, FAQ |
| Kiến trúc AWS (drawio) | [AWS_architecture.drawio.xml](PeriodIQ.Backend/docs/AWS_architecture.drawio%20(1).xml) | Sơ đồ kiến trúc AWS (mở bằng draw.io) |
