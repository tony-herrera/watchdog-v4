# 1. The Main VPC
resource "aws_vpc" "watchdog_v4" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "watchdog-v4-vpc" }
}

# 2. Public Subnets (Multi-AZ)
resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.watchdog_v4.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"
  map_public_ip_on_launch = true
  tags = { Name = "watchdog-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.watchdog_v4.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2b"
  map_public_ip_on_launch = true
  tags = { Name = "watchdog-public-b" }
}

# 3. Private Subnets (Multi-AZ)
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.watchdog_v4.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-west-2a"
  tags = { Name = "watchdog-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.watchdog_v4.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-west-2b"
  tags = { Name = "watchdog-private-b" }
}

# 4. Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.watchdog_v4.id
  tags   = { Name = "watchdog-igw" }
}

# 5. NAT Gateway & Elastic IP
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "watchdog-nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id
  tags          = { Name = "watchdog-nat-gw" }
  depends_on    = [aws_internet_gateway.igw]
}

# 6. Public Routing
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.watchdog_v4.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id  # Added .id
  }
  tags = { Name = "watchdog-public-rt" }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# 7. Private Routing
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.watchdog_v4.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id  # Added .id
  }
  tags = { Name = "watchdog-private-rt" }
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

# 8. Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "watchdog-endpoints-sg"
  description = "Allow private traffic to AWS services"
  vpc_id      = aws_vpc.watchdog_v4.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.watchdog_v4.cidr_block] # Only allow traffic from inside our VPC
  }

  tags = { Name = "watchdog-endpoints-sg" }
}

# 9. S3 Gateway Endpoint (Free & Highly Recommended)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.watchdog_v4.id
  service_name = "com.amazonaws.us-west-2.s3"
  route_table_ids = [
    aws_route_table.public.id,
    aws_route_table.private.id
  ]
  tags = { Name = "watchdog-s3-endpoint" }
}

# 10. DynamoDB Gateway Endpoint (Free)
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.watchdog_v4.id
  service_name = "com.amazonaws.us-west-2.dynamodb"
  route_table_ids = [
    aws_route_table.public.id,
    aws_route_table.private.id
  ]
  tags = { Name = "watchdog-dynamodb-endpoint" }
}

# 11. Bedrock Runtime Interface Endpoint
# This keeps your AI prompts off the public internet.
resource "aws_vpc_endpoint" "bedrock_runtime" {
  vpc_id             = aws_vpc.watchdog_v4.id
  service_name       = "com.amazonaws.us-west-2.bedrock-runtime"
  vpc_endpoint_type  = "Interface"
  security_group_ids = [aws_security_group.vpc_endpoints.id]
  subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  private_dns_enabled = true

  tags = { Name = "watchdog-bedrock-endpoint" }
}