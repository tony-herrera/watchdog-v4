# 1. The Price Sentinel Table
# This stores current prices and the "Freshness" thresholds for our cache.
resource "aws_dynamodb_table" "price_sentinel" {
  name         = "watchdog-price-sentinel"
  billing_mode = "PAY_PER_REQUEST" # Pay only for what users search
  hash_key     = "Ticker"         # Our "Partition Key" (the unique ID)

  attribute {
    name = "Ticker"
    type = "S" # S stands for String (e.g., "NVDA")
  }

  # This allows the table to be reachable via our private VPC Endpoint
  tags = {
    Name = "watchdog-price-sentinel"
    Environment = "production"
  }
}

//new db