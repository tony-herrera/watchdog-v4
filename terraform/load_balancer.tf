# 1. Security Group for the Load Balancer (The Outer Guard)
resource "aws_security_group" "alb_sg" {
  name        = "watchdog-alb-sg"
  description = "Allow public web traffic"
  vpc_id      = aws_vpc.watchdog_v4.id

  # Allow HTTP traffic from anywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow the ALB to talk to our Fargate engines
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "watchdog-alb-sg" }
}

# 2. The Application Load Balancer (The Receptionist)
resource "aws_lb" "main" {
  name               = "watchdog-v4-alb"
  internal           = false # This makes it public
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = { Name = "watchdog-v4-alb" }
}

# 3. The Target Group (The "Roster")
resource "aws_lb_target_group" "app" {
  name        = "watchdog-v4-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.watchdog_v4.id
  target_type = "ip" # Required for Fargate

  health_check {
    path                = "/"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}

# 4. The Listener (The "Ear" of the Receptionist)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# 5. Security Group for Fargate (The Inner Guard)
resource "aws_security_group" "fargate_sg" {
  name        = "watchdog-fargate-sg"
  description = "Only allow traffic from the ALB"
  vpc_id      = aws_vpc.watchdog_v4.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id] # Only the ALB can get in!
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "watchdog-fargate-sg" }
}