# app-tracker# app-tracker

NestJS API on AWS App Runner + React (Vite) UI on AWS Amplify • DynamoDB storage • Terraform IaC
A simple job-application tracker to showcase end-to-end skills: polished React UI, typed NestJS API, AWS infra with least-privilege IAM, and a clean Terraform setup.

Stack -
Frontend: React (Vite) + Tailwind
Backend: NestJS (TypeScript)
Data: DynamoDB (PAY_PER_REQUEST)
Infra / IaC: Terraform (S3 remote state + DynamoDB lock)
Runtime: App Runner (API) + Amplify Hosting (UI)
Registry: ECR (Docker image)

.
├── backend/ # NestJS API (Dockerized)
├── frontend/ # Vite + React UI
└── infra/ # Terraform (DDB, ECR, App Runner, etc.)

Local Dev --
Backend:
cd backend
cp .env.sample .env
npm i
npm run build
npm run start:dev # http://localhost:3000

Frontend:
cd frontend
npm i
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev # http://localhost:5173

App URL -
https://main.d1254hg2ms7oxk.amplifyapp.com/
