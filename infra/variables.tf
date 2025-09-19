variable "cors_origin" {
  description = "Allowed CORS origin for the API (e.g., your Amplify domain or localhost)."
  type        = string
  default     = "http://localhost:5173"
}
