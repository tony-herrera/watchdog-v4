# Technical Documentation: High-Level Data Flows

## Core Request Lifecycle (Model Context Protocol Architecture)

Watchdog V4 uses Amazon Bedrock's Model Context Protocol (MCP) pattern rather than direct Action Group execution. The application acts as an orchestration layer between the user, Bedrock, caching services, and backend microservices.

The following sequence describes a typical market-data request (e.g., "What's the price of NVDA?"):

### 1. User Request Submission

The user submits a prompt through the Next.js frontend (`app/page.tsx`). The UI transitions into a loading state and sends the request to the `/api/chat` endpoint.

### 2. Initial Bedrock Invocation

The API route generates or retrieves the active session identifier and submits the user prompt to Amazon Bedrock using an `InvokeAgentCommand`.

### 3. Intent Detection and Control Return

Bedrock analyzes the request and identifies the appropriate capability (e.g., `MarketData_ActionGroup`).

Rather than executing backend logic directly, Bedrock returns a `returnControl` payload containing the extracted parameters:

```json
{
  "ticker_symbol": "NVDA"
}
```

This allows the application layer to remain responsible for tool execution, caching, security controls, and context management.

### 4. Context Capture

The orchestration layer extracts the returned parameters and stores them as conversational state.

Example:

```json
{
  "last_discussed_ticker": "NVDA"
}
```

This state becomes available for future conversation turns.

### 5. Cache Lookup (Lookaside Pattern)

Before invoking downstream services, the router performs a cache lookup.

#### Development Environment

To avoid VPC connectivity issues during local development, cache access is bypassed automatically.

#### Production Environment

The router queries Valkey Serverless for a cached response using a key such as:

```text
stock:price:nvda
```

If a valid cache entry exists, the request is satisfied immediately without invoking backend services.

### 6. Backend Service Execution (Cache Miss)

If no cached data exists, the Next.js orchestration layer invokes the Python Lambda worker responsible for retrieving market data.

The Lambda service performs the required business logic and returns a structured JSON payload.

### 7. Cache Hydration

Successful responses are written back to Valkey using a five-minute expiration policy:

```text
TTL = 300 seconds
```

This reduces latency and minimizes repeated calls to external market-data providers.

### 8. Observation Handoff to Bedrock

The Lambda response is transformed into Bedrock's required `returnControlInvocationResults` schema and submitted through a resumed `InvokeAgentCommand`.

At this stage, conversational memory is also injected:

```json
{
  "sessionAttributes": {
    "last_discussed_ticker": "NVDA"
  }
}
```

This enables follow-up questions such as:

> "Can I see a chart for it?"

without requiring the user to repeat the ticker symbol.

### 9. Natural Language Response Generation

Bedrock combines:

* Original user intent
* Lambda-generated observations
* Session attributes
* Prior conversation state

The model then generates a natural-language response and streams the result back to the client interface.

---

## Technical Chart Generation Flow

The chart-generation workflow follows a separate asset-processing pipeline optimized for visual content.

### 1. Chart Generation Request

The user requests a technical chart through the conversational interface.

Example:

> "Show me a technical chart for NVDA."

### 2. SVG Construction

The Python Lambda worker retrieves historical pricing data and dynamically generates an SVG-based chart representation.

SVG was selected because it provides:

* Resolution-independent rendering
* Small payload sizes
* Native browser support
* Dark-mode compatibility

### 3. Asset Storage

The generated SVG is uploaded to the designated S3 chart-storage bucket.

The upload process is performed through the AWS SDK (`boto3`) and returns a storage reference.

### 4. Secure Access Generation

A time-limited presigned URL is created and returned within the service response payload.

This avoids exposing public S3 permissions while allowing controlled client access.

### 5. Frontend Asset Interception

The React client intercepts chart references contained within the model response.

Rather than rendering raw storage paths or URLs, the frontend:

1. Detects chart references using pattern matching.
2. Removes the raw reference from the chat transcript.
3. Routes the asset through an internal viewer component.
4. Dynamically renders a styled chart card.

### 6. User Presentation

The user receives an interactive chart experience integrated directly into the conversation interface.

This separation keeps the language model focused on reasoning and narration while delegating visualization responsibilities to the frontend application layer.
