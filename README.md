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

## Tài liệu chi tiết

| Tài liệu | Đường dẫn | Mô tả |
|-----------|-----------|-------|
| Mô tả dự án | [mô tả dự án.txt](PeriodIQ.Backend/docs/mô%20tả%20dự%20án.txt) | Tổng quan 7 tầng kiến trúc và luồng xử lý |
| Phân tích dự án | [phân tích dự án.html](PeriodIQ.Backend/docs/phân%20tích%20dự%20án.html) | Báo cáo toàn diện với sơ đồ Mermaid tương tác |
| Giải thích kiến trúc | [Architecture_Explanation.txt](PeriodIQ.Backend/docs/Architecture_Explanation.txt) | Lý do dùng Monolithic Lambda + Clean Architecture |
| Hướng dẫn DynamoDB | [DynamoDB_Schema_Setup_Guide.md](PeriodIQ.Backend/docs/DynamoDB_Schema_Setup_Guide.md) | Hướng dẫn từng bước tạo 8 bảng, seed data, FAQ |
| Kiến trúc AWS (drawio) | [AWS_architecture.drawio.xml](PeriodIQ.Backend/docs/AWS_architecture.drawio%20(1).xml) | Sơ đồ kiến trúc AWS (mở bằng draw.io) |
