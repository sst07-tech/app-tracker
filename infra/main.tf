############################
# Locals / Inputs
############################
locals {
  app_name          = "applytrackr"
  ddb_table_name    = "ApplyTrackrTable"
  container_port    = 3000
  cors_origin       = var.cors_origin
  aws_region        = "us-east-1"
}

############################
# DynamoDB (data store)
############################
resource "aws_dynamodb_table" "applytrackr" {
  name         = local.ddb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }

  tags = {
    app = local.app_name
  }
}

############################
# ECR (image registry)
############################
resource "aws_ecr_repository" "backend" {
  name                 = "${local.app_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    app = local.app_name
  }
}

# Helper: full ECR image URI for :latest tag you’ll push
locals {
  image_uri_latest = "${aws_ecr_repository.backend.repository_url}:latest"
}

############################
# IAM: App Runner roles
############################

# Role used by App Runner to pull private images from ECR
resource "aws_iam_role" "apprunner_service_ecr_role" {
  name               = "${local.app_name}-apprunner-ecr-role"
  assume_role_policy = data.aws_iam_policy_document.apprunner_service_assume.json
  tags = { app = local.app_name }
}

data "aws_iam_policy_document" "apprunner_service_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }
  }
}

# Attach AWS managed policy for ECR access
resource "aws_iam_role_policy_attachment" "apprunner_service_ecr_access" {
  role       = aws_iam_role.apprunner_service_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# Instance role: what the running container can do (DynamoDB CRUD)
resource "aws_iam_role" "apprunner_instance_role" {
  name               = "${local.app_name}-apprunner-instance-role"
  assume_role_policy = data.aws_iam_policy_document.apprunner_instance_assume.json
  tags = { app = local.app_name }
}

data "aws_iam_policy_document" "apprunner_instance_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

# Least-privilege DDB policy
data "aws_iam_policy_document" "ddb_policy" {
  statement {
    sid     = "DynamoCrud"
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [aws_dynamodb_table.applytrackr.arn]
  }
}

resource "aws_iam_policy" "ddb_policy" {
  name   = "${local.app_name}-ddb-policy"
  policy = data.aws_iam_policy_document.ddb_policy.json
  tags   = { app = local.app_name }
}

resource "aws_iam_role_policy_attachment" "instance_ddb_attach" {
  role       = aws_iam_role.apprunner_instance_role.name
  policy_arn = aws_iam_policy.ddb_policy.arn
}

############################
# App Runner service (API)
############################
resource "aws_apprunner_service" "backend" {
  service_name = "${local.app_name}-backend"

  source_configuration {
    auto_deployments_enabled = true

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_service_ecr_role.arn
    }

    image_repository {
      image_repository_type = "ECR"
      image_identifier      = local.image_uri_latest

      image_configuration {
        port = tostring(local.container_port)

        runtime_environment_variables = {
          AWS_REGION  = local.aws_region
          DDB_TABLE   = local.ddb_table_name
          CORS_ORIGIN = local.cors_origin
        }
      }
    }
  }

  instance_configuration {
    cpu               = "1 vCPU"
    memory            = "2 GB"
    instance_role_arn = aws_iam_role.apprunner_instance_role.arn
  }

  tags = {
    app = local.app_name
  }

  depends_on = [
    aws_iam_role_policy_attachment.apprunner_service_ecr_access,
    aws_iam_role_policy_attachment.instance_ddb_attach
  ]
}
