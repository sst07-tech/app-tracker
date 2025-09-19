terraform {
  required_version = ">= 1.6.0"

  backend "s3" {
    bucket         = "sst-tfstate-bucket-dev-us-east"
    key            = "envs/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-state-locks"
    encrypt        = true
    # kms_key_id   = "arn:aws:kms:..." # optional
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.56"
    }
  }
}
