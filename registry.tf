# 1. The Container Repository for the Watchdog App
resource "aws_ecr_repository" "watchdog_app" {
  name                 = "watchdog-v4-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "watchdog-v4-app-registry"
    Environment = "production"
  }
}

# 2. Lifecycle Policy (The Validated Cleanup Crew)
resource "aws_ecr_lifecycle_policy" "cleanup" {
  repository = aws_ecr_repository.watchdog_app.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only the last 5 images to optimize storage costs"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountType"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}