# 1. Automatically zip the Python script during deployment
data "archive_file" "market_data_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/market-data"
  output_path = "${path.module}/market_data_payload.zip"
}

# 2. The Execution Role: Gives Lambda permission to run and write logs
resource "aws_iam_role" "lambda_exec_role" {
  name = "watchdog-market-data-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Attach the basic AWS policy for CloudWatch logging
resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 3. The Isolated Compute Worker (AWS Lambda)
resource "aws_lambda_function" "market_data_worker" {
  filename         = data.archive_file.market_data_zip.output_path
  source_code_hash = data.archive_file.market_data_zip.output_base64sha256
  function_name    = "watchdog-market-data-worker"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  runtime          = "python3.12"
  timeout          = 10
  memory_size      = 128
}

# 4. The Security Handshake: Allow Fargate to invoke this specific Lambda
resource "aws_iam_role_policy" "fargate_invoke_lambda" {
  name = "watchdog-fargate-invoke-lambda"
  # Note: This assumes your Fargate task role is named 'ecs_task_role' as seen in your earlier file
  role = aws_iam_role.ecs_task_role.id 
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action   = "lambda:InvokeFunction",
      Effect   = "Allow",
      Resource = aws_lambda_function.market_data_worker.arn
    }]
  })
}