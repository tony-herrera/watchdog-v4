# 1. Task Execution Role (The Keycard to pull images & write logs)
resource "aws_iam_role" "ecs_execution_role" {
  name = "watchdog-v4-ecs-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_exec_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# 2. The Task Definition (The Instruction Manual)
resource "aws_ecs_task_definition" "app" {
  family                   = "watchdog-v4-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256" # 0.25 vCPU (Cheap & efficient)
  memory                   = "512" # 0.5 GB RAM
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  # We use a public test image to verify the network plumbing first!
  container_definitions = jsonencode([{
    name      = "watchdog-app"
    image     = "nginxdemos/hello:latest"
    essential = true
    portMappings = [{
      containerPort = 80
      hostPort      = 80
    }]
  }])
}

# 3. The ECS Service (The Manager)
resource "aws_ecs_service" "app_service" {
  name            = "watchdog-v4-service"
  cluster         = aws_ecs_cluster.watchdog_cluster.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2 # Multi-AZ Redundancy! One in AZ-A, one in AZ-B.
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_a.id, aws_subnet.private_b.id] # Placed in the Private Vault
    security_groups  = [aws_security_group.fargate_sg.id]
    assign_public_ip = false # Ultimate Security: No public IP address
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "watchdog-app"
    container_port   = 80
  }
}