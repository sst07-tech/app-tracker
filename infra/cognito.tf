# Adjust provider alias/region to match where your App Runner runs (often us-east-1)
# If you already have aliased providers, you can add `provider = aws.use1` to each resource.

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_cognito_user_pool" "applytrackr" {
  name = "applytrackr-users"

  # Email-based login
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Basic schema (email required)
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }
  lifecycle {
    ignore_changes = [ schema ]  # ensures TF won’t try to modify/remove attributes
    prevent_destroy = true       # optional safety
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "applytrackr-web"
  user_pool_id = aws_cognito_user_pool.applytrackr.id

  generate_secret = false
  supported_identity_providers = ["COGNITO"]

  # OAuth (Hosted UI)
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows  = ["code"]
  allowed_oauth_scopes = ["openid", "email", "profile"]

  # Replace with your actual URLs (Amplify & local dev). You can update later.
  callback_urls = [
    "http://localhost:5173",
    "https://main.d1254hg2ms7oxk.amplifyapp.com"
  ]
  logout_urls = [
    "http://localhost:5173",
    "https://main.d1254hg2ms7oxk.amplifyapp.com"
  ]
}

resource "aws_cognito_user_pool_domain" "domain" {
  domain       = "applytrackr-${random_id.suffix.hex}"
  user_pool_id = aws_cognito_user_pool.applytrackr.id
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.applytrackr.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "cognito_domain" {
  value = aws_cognito_user_pool_domain.domain.domain
}
