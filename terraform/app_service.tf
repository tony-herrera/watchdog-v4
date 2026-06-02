# 1. Task Execution Role (The Delivery Driver: Pulls images & writes logs)
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

# 2. The Task Role (The Employee Badge: Lets the running app talk to AWS)
resource "aws_iam_role" "ecs_task_role" {
  name = "watchdog-v4-ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

# 3. Granting the App permission to talk to the AI (Amazon Bedrock)
resource "aws_iam_role_policy" "bedrock_access" {
  name = "watchdog-bedrock-invoke"
  role = aws_iam_role.ecs_task_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action   = ["bedrock:InvokeAgent"],
      Effect   = "Allow",
      Resource = "*" 
    }]
  })
}

# 4. The Task Definition (The Instruction Manual)
resource "aws_ecs_task_definition" "app" {
  family                   = "watchdog-v4-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  
  # Both Badges attached!
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn 

  container_definitions = jsonencode([{
    name      = "watchdog-app"
    image     = "${aws_ecr_repository.watchdog_app.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 80
      hostPort      = 80
    }],
    # --- NEW: Injecting the Valkey State Engine URL ---
    environment = [
      {
        name  = "REDIS_URL"
        value = "rediss://watchdog-session-cache-ybur3v.serverless.usw2.cache.amazonaws.com:6379"
      }
    ]
    # --------------------------------------------------
  }])
}

# 5. The ECS Service (The Manager)
resource "aws_ecs_service" "app_service" {
  name            = "watchdog-v4-service"
  cluster         = aws_ecs_cluster.watchdog_cluster.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2 
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_a.id, aws_subnet.private_b.id] 
    security_groups  = [aws_security_group.fargate_sg.id]
    assign_public_ip = false 
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "watchdog-app"
    container_port   = 80
  }
}