# 1. The High-Speed "Directory Bucket"
# S3 Express is built for speed, so it skips some standard features like Tags.
resource "aws_s3_directory_bucket" "charts_fast" {
  bucket = "watchdog-v4-charts--usw2-az1--x-s3"
  location {
    name = "usw2-az1" # This is us-west-2a
    type = "AvailabilityZone"
  }
  # TAGS REMOVED FROM HERE
}

# 2. The Standard Bucket (For long-term history)
resource "aws_s3_bucket" "charts_history" {
  bucket = "watchdog-v4-history-${data.aws_caller_identity.current.account_id}"
  # Standard buckets DO support tags, but we'll leave them out for now to keep it simple.
}

# Helper to get your account ID
data "aws_caller_identity" "current" {}