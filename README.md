# app-tracker# app-tracker

Frontend: React (Vite) + Tailwind (polished UI, add/edit/delete, status counters)
Backend: NestJS + AWS SDK v3 (DynamoDB)

Deploy:
Backend → AWS App Runner (Docker image)
Frontend → AWS Amplify Hosting

Infra bits included: CloudFormation for DynamoDB table + IAM policy JSON for App Runner
