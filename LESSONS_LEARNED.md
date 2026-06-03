# Lessons Learned

## 1. Zero-Downtime Deployments Require Valid Artifacts, Not Just Successful Pipelines

### The Challenge

A GitHub Actions deployment reported a successful build, yet the ECS Fargate service entered an infinite crash loop and the Application Load Balancer began returning 405 NGINX errors.

### Investigation

Reviewing ECS event logs revealed a `CannotPullContainerError`. Fargate was attempting a rolling deployment, but the target ECR repository contained no container image. The CI/CD pipeline was provisioning infrastructure through Terraform but never building or publishing the application container.

### Solution

The GitHub Actions workflow was redesigned to include a complete Docker build-and-push stage. Additional validation was added to enforce naming consistency between Terraform-generated ECR repositories and GitHub deployment targets.

### Key Takeaway

A successful infrastructure deployment does not guarantee a successful application deployment. CI/CD pipelines must validate both infrastructure state and deployable application artifacts before promotion.

---

## 2. Enterprise Network Constraints Often Require Cloud-Native Development

### The Challenge

Corporate security policies blocked local Node.js installers and prevented access to a local Docker daemon, making traditional local development impractical.

### Solution

Development shifted entirely to GitHub Codespaces. The Next.js application was scaffolded in a cloud-hosted Ubuntu environment, Docker assets were generated remotely, and changes were committed directly to the repository. Git was then used to reconcile cloud-based UI development with locally developed API work.

### Key Takeaway

When local environments become bottlenecks, cloud-native development environments can eliminate friction and keep delivery moving without compromising security policies.

---

## 3. Network Isolation Must Be Accounted for During Development

### The Challenge

A Valkey Serverless cache was deployed within private VPC subnets. During development in GitHub Codespaces, the application existed outside the VPC and could not establish network connectivity, causing repeated `ETIMEDOUT` failures and significant request latency.

### Solution

An environment-aware fallback mechanism was implemented. During local development, the cache client resolves to `null` and requests bypass the cache entirely, falling back to the Lambda processing path. In production, ECS Fargate automatically establishes the encrypted connection pool without requiring code changes.

### Key Takeaway

Applications should degrade gracefully when dependent infrastructure is unavailable. Environment-aware architecture significantly improves developer productivity and system resilience.

---

## 4. Understanding ECS IAM Roles Is Critical for Secure AWS Integrations

### The Challenge

Although the Fargate container launched successfully, application requests failed when attempting to communicate with Amazon Bedrock.

### Investigation

The issue stemmed from a misunderstanding of ECS IAM role separation. The Execution Role permitted ECS to perform infrastructure tasks such as pulling container images, but the application itself lacked permissions to access AWS services.

### Solution

A dedicated ECS Task Role was created and assigned to the application. This allowed the AWS SDK to securely access Bedrock without embedding credentials or exposing access keys.

### Key Takeaway

Execution Roles grant permissions to the ECS platform, while Task Roles grant permissions to the application running inside the container. Both are required for secure production architectures.

---

## 5. Foundation Models Require External Context Management

### The Challenge

During multi-turn conversations, users frequently referenced prior entities using pronouns or indirect references. Bedrock Agents lost context and occasionally routed requests to incorrect action groups.

### Solution

Model Context Protocol (MCP) state tracking was integrated into the application router. During the `returnControl` workflow, active conversation parameters such as ticker symbols are captured and reinjected into Bedrock session attributes on subsequent requests.

### Key Takeaway

Foundation models are inherently stateless. Reliable enterprise conversational systems require external orchestration layers that capture, persist, and rehydrate context across interactions.

---

## 6. LLMs Need Structured Data Boundaries to Prevent Analytical Drift

### The Challenge

The system occasionally generated unsupported financial commentary when only a single market data point was available. Without historical context, the model inferred trends that were not grounded in actual data.

### Solution

Analytical calculations were moved into the data-processing layer. Rather than expecting the model to infer market conditions, backend services compute metrics such as moving-average comparisons and return them as structured JSON fields.

### Key Takeaway

Models should not be responsible for generating analytical conclusions from incomplete data. The data layer must explicitly provide the facts and calculations required for downstream presentation.

---

## 7. Keep LLM Outputs Simple and Move Rendering to the Frontend

### The Challenge

Returning raw asset references such as `s3://bucket/charts/CELH.svg` produced unusable responses for end users because chat interfaces cannot directly render storage paths.

### Solution

Rendering responsibilities were moved to the frontend layer. The React application intercepts asset references, removes them from the model response, and dynamically mounts interactive SVG chart components in their place.

### Key Takeaway

LLMs should return simple, structured payloads. Visualization, formatting, and user-interface concerns belong in the frontend application layer.

---

## 8. Monorepo Dependency Management Can Break Container Builds

### The Challenge

Fargate deployments failed with `Module Not Found: ioredis` despite the application working correctly during development.

### Investigation

A dual-lockfile conflict existed between the repository root and a nested application directory. The Docker build context was using stale dependency metadata and producing incomplete container images.

### Solution

Dependency management was standardized, package definitions were synchronized, and container images were rebuilt using the corrected dependency graph.

### Key Takeaway

Monorepos require strict dependency and build-context management. Small inconsistencies between lockfiles and build boundaries can cause production failures that are difficult to reproduce locally.
