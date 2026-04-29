# 1. The Main VPC
resource "aws_vpc" "watchdog_v4" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "watchdog-v4-vpc"
  }
}

# 2. Public Subnet (For your Load Balancer)
resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.watchdog_v4.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"
  map_public_ip_on_launch = true

  tags = { Name = "watchdog-public-a" }
}

# 3. Private Subnet (For your AI Lambda/Fargate)
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.watchdog_v4.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-west-2a"

  tags = { Name = "watchdog-private-a" }
}

# 4. The Internet Gateway (The "Front Door")
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.watchdog_v4.id
  tags   = { Name = "watchdog-igw" }
}