Watchdog V4 is a serverless, event-driven, agentic AI platform designed to democratize institutional-grade financial analysis. By combining a Next.js front-end with Amazon Bedrock (Nova Pro) and AWS Lambda, the system acts as a multimodal financial analyst—capable of fetching real-time market data, dynamically generating technical charts, analyzing visual patterns, and delivering conversational insights to the user.
The Problem
Retail investors face a massive cognitive load. They must independently synthesize raw price feeds, parse financial news sentiment, and manually interpret complex technical indicators (MACD, RSI, Moving Averages).
The Solution
Watchdog V4 resolves this synthesis gap through an AI-driven Research Desk. Users interact with a secure, auto-scaling web interface that allows them to issue natural-language commands (e.g., "Analyze NVDA's 30-day moving average"). The system autonomously orchestrates the data retrieval, visualizes the chart, analyzes the result, and returns a comprehensive, institutional-grade summary.
Core Architecture Highlights
Compute Edge: Next.js (App Router) containerized via Docker and deployed on AWS Fargate (ECS) for serverless, zero-maintenance, multi-AZ high availability.
Traffic Routing: Application Load Balancer (ALB) distributing traffic across private subnets, ensuring zero public IP exposure to the application layer.
Cognitive Engine: Amazon Bedrock Agent (Nova Pro) acting as the orchestration brain, securely connected via strict IAM Task Roles.
Execution Engine: AWS Lambda (Python 3.12) handling the heavy lifting of data fetching and Matplotlib chart generation, bypassing payload limits via S3 artifact storage.
CI/CD Pipeline: Fully automated GitHub Actions workflow executing Terraform state changes, multi-stage Docker builds, and zero-downtime rolling updates to Fargate.
