1. The Zero-Trust Security Model (IAM)
Security is handled at the network and execution layer.
Fargate Task Execution Role: Grants the ECS engine permission to pull the UI image from the private ECR repository and push logs to CloudWatch.
Fargate Task Role: The "Employee Badge." Grants the running Node.js server the bedrock: InvokeAgent permission. The frontend SDK automatically assumes this role, eliminating the need for hardcoded .env AWS credentials.
Lambda Resource-Based Policy: Ensures the Execution Muscle can only be invoked by the specific ARN of the Bedrock Agent.
2. The Deployment Pipeline (GitOps)
The pipeline (deploy.yml) is completely deterministic:
Infra-as-Code: Executes Terraform apply to ensure the VPC, ALB, and ECR repositories match the desired state.
Containerization: Executes a multi-stage Docker build utilizing an Alpine Node base to minimize attack surface and image bloat.
Artifact Push: Pushes the latest tag to Amazon ECR.
Rolling Update: Forces ECS to pull the new image. The ALB performs HTTP Port 80 health checks on the new container before draining connections from the old container, guaranteeing zero downtime.
3. Bypassing Lambda Size Limitations
Because financial data science libraries (Pandas, Numpy, Matplotlib) exceed the standard 250 MB AWS Lambda deployment limit, the architecture uses a custom Lambda Layer. The layer was compiled in an Amazon Linux Docker container to ensure binary compatibility with the cloud runtime, separating heavy dependencies from the agile execution code.
