# 1. The High-Speed "Directory Bucket"
# Note: S3 Express names must end with --azid--x-s3 (e.g., usw2-az1--x-s3)
resource "aws_s3_directory_bucket" "charts_fast" {
  bucket = "watchdog-v4-charts--usw2-az1--x-s3"
  location {
    name = "usw2-az1" # This is us-west-2a
    type = "AvailabilityZone"
  }

  tags = {
    Name = "watchdog-v4-charts-express"
  }
}

# 2. The Standard Bucket (For long-term history/backups)
resource "aws_s3_bucket" "charts_history" {
  bucket = "watchdog-v4-history-${data.aws_caller_identity.current.account_id}"
}

# Helper to get your account ID for a unique bucket name
data "aws_caller_identity" "current" {}