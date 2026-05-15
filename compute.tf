# 1. The ECS Cluster (The "Hangar" for our engines)
resource "aws_ecs_cluster" "watchdog_cluster" {
  name = "watchdog-v4-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled" # Gives us professional metrics in CloudWatch
  }
}

# 2. Capacity Providers (Telling AWS to use Fargate)
resource "aws_ecs_cluster_capacity_providers" "watchdog_fargate" {
  cluster_name = aws_ecs_cluster.watchdog_cluster.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"] # SPOT is 70% cheaper for dev!

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}