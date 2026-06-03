# Watchdog V4 📈

Watchdog V4 is an AI-powered financial research platform that combines conversational intelligence, real-time market data, and technical charting into a unified web application.

Built on a cloud-native AWS architecture, Watchdog enables users to query financial data using natural language, generate technical visualizations on demand, and maintain context across multi-turn conversations. The platform leverages Amazon Bedrock for reasoning and orchestration while delegating data retrieval, caching, and chart generation to dedicated backend services.

---

## Features

### Conversational Financial Research

Ask questions using natural language:

> "What's the current price of NVDA?"
> "Show me a technical chart."
> "How has it performed recently?"

The platform maintains conversational context, allowing follow-up questions without repeatedly specifying the ticker symbol.

### Bedrock-Orchestrated Tool Execution

Watchdog implements a Model Context Protocol (MCP) orchestration pattern.

Rather than allowing the language model to directly execute tools, requests flow through a dedicated orchestration layer that:

* Validates parameters
* Maintains session state
* Coordinates cache access
* Executes backend services
* Rehydrates conversational context

This architecture provides greater control, observability, and security.

### High-Performance Market Data Retrieval

A Valkey Serverless cache reduces redundant requests and improves response times through a lookaside caching pattern.

Benefits include:

* Lower latency
* Reduced backend workload
* Improved user experience
* Lower infrastructure costs

### Dynamic Technical Chart Generation

Python-based AWS Lambda workers generate SVG technical charts on demand using historical market data.

Generated assets are stored in S3 Express and rendered directly within the application interface.

### Developer Trace Mode

An optional expert view exposes the complete orchestration workflow, including:

* User request processing
* Tool execution
* Backend observations
* Model responses
* Session state transitions

This mode is designed to aid debugging, troubleshooting, and platform development.

---

## Architecture Overview

Watchdog V4 is built using a layered architecture:

```text
React / Next.js UI
        │
        ▼
ECS Fargate Orchestration Layer
        │
        ├── Valkey Serverless Cache
        │
        ├── Amazon Bedrock
        │
        └── AWS Lambda Services
                │
                ▼
         S3 Express Storage
```

Core architectural principles include:

* Separation of concerns
* Zero-trust security
* Stateless compute
* Serverless scaling
* Graceful degradation
* Infrastructure as Code

---

## Technology Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* TypeScript
* SVG-based chart rendering

### Backend

* Node.js
* AWS ECS Fargate
* AWS Lambda (Python 3.12)

### AI Services

* Amazon Bedrock Agents
* Amazon Nova Pro

### Data & Storage

* Amazon ElastiCache (Valkey Serverless)
* Amazon S3 Express One Zone

### Infrastructure

* Terraform
* GitHub Actions
* Docker

---

## Local Development

### Prerequisites

* Node.js
* AWS Account
* AWS CLI configured
* Access to required AWS resources

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd watchdog-ui
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env.local
```

Update `.env.local` with the required AWS configuration.

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Development Notes

During local development, the application automatically bypasses the production Valkey cache layer.

Because the cache resides within a private VPC, bypassing cache access prevents development-time network timeouts while preserving the same application behavior through direct Lambda execution.

This environment-aware fallback mechanism enables local development without requiring VPN connectivity or VPC access.

---

## Infrastructure

Infrastructure is fully managed through Terraform and deployed using GitHub Actions.

The deployment pipeline provisions:

* ECS Fargate services
* Bedrock integrations
* Lambda functions
* Valkey Serverless
* S3 Express storage
* IAM roles and policies
* VPC networking components

---

## Design Goals

Watchdog V4 was built around the following objectives:

* Deliver financial insights through natural language interaction
* Maintain context across multi-turn conversations
* Reduce latency through intelligent caching
* Support multimodal responses and chart generation
* Enforce secure, least-privilege AWS access patterns
* Remain fully cloud-native and horizontally scalable