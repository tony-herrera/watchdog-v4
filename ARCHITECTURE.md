# Watchdog V4 System Architecture

## Overview

Watchdog V4 is a cloud-native financial intelligence platform designed around a layered service architecture. The platform separates presentation, orchestration, caching, compute, and storage concerns into independent tiers to maximize scalability, resiliency, and operational maintainability.

The architecture follows modern IT service management principles, emphasizing high availability, fault isolation, least-privilege security, and graceful degradation under partial service failures.

---

# Five-Tier Architecture

## 1. Interface Tier (Next.js / React)

The Interface Tier provides the primary user experience through a responsive, data-dense financial dashboard.

### Responsibilities

* User interaction and conversation management
* Real-time response streaming
* Dynamic visualization rendering
* Session state presentation
* Debugging and observability controls

### Key Capabilities

#### Dynamic Asset Rendering

The frontend intercepts chart references returned by backend services and transforms them into interactive visualization components. This approach decouples visual rendering from model-generated text and ensures a consistent user experience.

#### Expert Mode

An optional diagnostic view exposes the orchestration lifecycle, allowing developers to inspect:

* Request preprocessing
* Orchestration decisions
* Backend observations
* Model responses

This significantly improves troubleshooting and operational visibility.

---

## 2. Orchestration Tier (ECS Fargate)

The Orchestration Tier serves as the system's central control plane.

Rather than allowing the foundation model to directly invoke external services, Watchdog implements a Return Control orchestration pattern. This keeps business logic, security controls, and state management outside the model runtime.

### Responsibilities

* Bedrock Agent communication
* Intent validation
* Session management
* Conversational memory injection
* Cache coordination
* Backend service routing
* Error handling and recovery

### Key Capabilities

#### Return Control Pattern

When a user request is received:

1. Bedrock identifies the intent.
2. Control is returned to the orchestration layer.
3. The router executes the required business logic.
4. Results are passed back to Bedrock for response generation.

This architecture provides greater transparency, auditability, and operational control than direct model-driven tool invocation.

#### Context Management

The orchestration layer maintains persistent session attributes and conversational state, enabling reliable multi-turn interactions and reducing model context loss.

---

## 3. Cache Tier (Valkey Serverless)

The Cache Tier provides low-latency access to frequently requested financial data.

### Responsibilities

* Market data caching
* Request deduplication
* Latency reduction
* Backend load reduction

### Key Capabilities

#### Lookaside Caching Pattern

Before invoking downstream services, the orchestration layer checks the cache for existing results.

Benefits include:

* Single-digit millisecond retrieval times
* Reduced Lambda invocations
* Lower infrastructure costs
* Improved end-user responsiveness

#### Cost Optimization

Valkey Serverless was selected to provide elastic scaling while minimizing idle resource consumption, making the platform more cost-efficient under variable workloads.

---

## 4. Compute Tier (AWS Lambda)

The Compute Tier executes business logic and data-processing workloads.

Implemented as lightweight Python microservices, this layer remains independent of both the user interface and orchestration logic.

### Responsibilities

* Market data retrieval
* Financial analysis
* Chart generation
* Data transformation
* Response normalization

### Key Capabilities

#### Multimodal Processing

The compute layer supports both:

* Structured JSON responses
* SVG-based chart generation

This enables a single service layer to support conversational and visual workflows.

#### Performance Optimization

Connection reuse and SDK-level keep-alive pooling minimize cold-start impact and improve response times for recurring requests.

---

## 5. Storage Tier (S3 Express One Zone)

The Storage Tier manages generated visual assets and durable object storage.

### Responsibilities

* Chart persistence
* Asset distribution
* Temporary file storage
* Secure asset access

### Key Capabilities

#### High-Speed Asset Retrieval

Generated chart assets are written to an S3 Express directory bucket, providing low-latency access for visualization workflows.

#### Secure Distribution

Assets are exposed through presigned URLs with short-lived expiration windows, ensuring controlled access without requiring public bucket permissions.

---

# Security Architecture

## Private Network Isolation

Core platform services operate within a private VPC, reducing exposure to public network traffic and limiting attack surface.

## Least-Privilege Access Control

The platform follows a zero-trust IAM model:

* ECS Execution Roles manage infrastructure operations.
* ECS Task Roles authorize application-level AWS service access.
* No long-lived credentials are embedded within application code.

## Secure Service Communication

AWS-native authentication mechanisms are used wherever possible, eliminating the need to distribute or rotate application secrets.

---

# Resiliency and Fault Tolerance

## Graceful Degradation

The platform is designed to continue operating when non-critical services become unavailable.

Examples include:

* Cache failures automatically falling back to direct compute execution.
* Development environments bypassing VPC-only services.
* Service-level isolation preventing single-component failures from cascading across the platform.

## Operational Benefits

This architecture provides:

* High availability
* Reduced operational risk
* Improved scalability
* Lower infrastructure costs
* Enhanced observability
* Secure multi-service orchestration

By separating responsibilities across independent tiers, Watchdog V4 maintains predictable performance while supporting complex AI-driven financial workflows.
