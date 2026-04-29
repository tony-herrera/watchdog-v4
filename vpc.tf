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

# 6. Public Route Table (Traffic goes to the Internet)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.watchdog_v4.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw
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

# 7. Private Route Table (Traffic goes through the NAT Gateway)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.watchdog_v4.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat
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