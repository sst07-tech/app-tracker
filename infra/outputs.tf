output "ddb_table_name" {
  value = aws_dynamodb_table.applytrackr.name
}

output "ecr_repo_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "apprunner_service_url" {
  description = "Public URL of the App Runner service"
  value       = aws_apprunner_service.backend.service_url
}
