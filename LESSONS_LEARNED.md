1. Overcoming the "Ghost Image" in Zero-Downtime Deployments
The Situation: During the CI/CD pipeline build, GitHub reported a "Success," but the Fargate cluster entered an infinite crash loop, and the Load Balancer began returning 405 NGINX errors.
The Investigation: By diving into the ECS Event Logs, I discovered a CannotPullContainerError. Fargate was attempting a Rolling Update, but the ECR repository was empty. The CI/CD pipeline was only building the Terraform infrastructure; it lacked the Docker compilation steps.
The Fix: I rewrote the GitHub Actions YAML to include a full Docker build-and-push sequence and implemented a strict naming-convention check between Terraform's ECR output and GitHub's deployment target.
2. Adapting to Enterprise Network Constraints (The Cloud Bypass)
The Situation: While attempting to scaffold the local Next.js environment, strict corporate firewall policies blocked the Node.js .msi installers, and no local Docker daemon was available.
The Pivot: Instead of fighting the local hardware, I shifted development entirely to the cloud. I spun up a GitHub Codespace (an Ubuntu server running VS Code in the browser), scaffolded the Next.js application natively, generated the Dockerfile, and committed it back to the repository. I then utilized Git to merge the divergent timelines between my local API work and the cloud UI work.
3. The IAM "Two-Badge" System (Task vs. Execution)
The Situation: The Fargate container successfully booted, but the API route failed to connect to Amazon Bedrock.
The Lesson: I learned the critical architectural difference between ECS Roles. An Execution Role allows the AWS Engine to perform tasks (like pulling from ECR). However, to allow the Application Code (Next.js) to talk to AWS services (Bedrock) securely, you must provision a distinct Task Role. Implementing this allowed me to use the AWS SDK without ever exposing access keys.
