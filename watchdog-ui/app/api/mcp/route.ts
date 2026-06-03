import { NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { WATCHDOG_MCP_TOOLS } from '../../../lib/mcp/tools';
import { valkeyClient } from "@/lib/valkey";

// 1. Initialize the AWS SDK Lambda Client
const lambdaClient = new LambdaClient({ region: 'us-west-2' });

export async function GET() {
  return NextResponse.json({ success: true, tools: WATCHDOG_MCP_TOOLS });
}

export async function POST(request: Request) {
  const startTime = performance.now();
  let apiPathForTelemetry = "unknown";
  let actionGroupForTelemetry = "unknown";

  try {
    const body = await request.json();
    const { actionGroup, apiPath, parameters } = body;
    
    apiPathForTelemetry = apiPath || "unknown";
    actionGroupForTelemetry = actionGroup || "unknown";

    console.log(`⚡ [MCP Server] Incoming execution request for: ${apiPath}`);
    let responsePayload: any = {};

    // ===================================================
    // ROUTE HANDLER 1: REAL-TIME STOCK PRICES
    // ===================================================
    if (apiPath === '/fetch_stock_price') {
      const ticker = parameters.find((p: any) => p.name === 'ticker_symbol')?.value;
      if (!ticker) throw new Error("Missing required parameter: ticker_symbol");
      
      const cacheKey = `stock:price:${ticker.toLowerCase()}`;

      // 1. Check the Valkey Cache Layer first
      if (valkeyClient) {
        try {
          const cachedData = await valkeyClient.get(cacheKey);
          if (cachedData) {
            console.log(`🚀 [Valkey Hit] Serving real-time price data for ${ticker.toUpperCase()} directly from serverless memory cache!`);
            responsePayload = JSON.parse(cachedData);
            
            // Re-route flow down to our unified response wrapper to log performance tracking metrics cleanly
            return buildBedrockResponse(actionGroup, apiPath, responsePayload, startTime);
          }
        } catch (cacheErr) {
          console.error("Valkey read failure, falling back to Lambda pipeline:", cacheErr);
        }
      }

      // 2. Cache Miss: Fall back to invoking the Lambda worker microservice
      console.log(`📡 [Valkey Bypassed] Invoking Fargate -> Lambda worker for ${ticker.toUpperCase()}...`);
      const priceCommand = new InvokeCommand({
        FunctionName: 'watchdog-market-data-worker',
        Payload: JSON.stringify({ action: 'fetch_price', ticker: ticker }),
      });

      const { Payload } = await lambdaClient.send(priceCommand);
      if (!Payload) throw new Error("Lambda returned an empty payload stream.");
      
      const lambdaResponse = JSON.parse(Buffer.from(Payload).toString());
      if (lambdaResponse.statusCode !== 200) {
        throw new Error(`Lambda execution failed: ${lambdaResponse.body}`);
      }
      
      responsePayload = JSON.parse(lambdaResponse.body);

      // 3. Write data to Valkey with a 5-minute Time-To-Live (TTL) expiration window
      if (valkeyClient && responsePayload) {
        try {
          await valkeyClient.set(cacheKey, JSON.stringify(responsePayload), "EX", 300);
          console.log(`💾 [Valkey Save] Pinned telemetry entry for ${ticker.toUpperCase()} inside cluster memory states.`);
        } catch (cacheErr) {
          console.error("Valkey write failure:", cacheErr);
        }
      }

    // ===================================================
    // ROUTE HANDLER 2: MULTIMODAL TECHNICAL GRAPHING
    // ===================================================
    } else if (apiPath === '/generate_technical_chart') {
      const ticker = parameters.find((p: any) => p.name === 'ticker_symbol')?.value;
      const chartType = parameters.find((p: any) => p.name === 'chart_type')?.value || 'simple_moving_average';
      const timeWindow = parameters.find((p: any) => p.name === 'time_window')?.value || 30;

      if (!ticker) throw new Error("Missing required parameter: ticker_symbol");

      console.log(`📡 [MCP Switchboard] Invoking Lambda for visual charts generation on ${ticker.toUpperCase()}...`);

      const chartCommand = new InvokeCommand({
        FunctionName: 'watchdog-market-data-worker',
        Payload: JSON.stringify({ 
          action: 'generate_chart', 
          ticker: ticker,
          chart_type: chartType,
          time_window: timeWindow
        }),
      });

      const { Payload } = await lambdaClient.send(chartCommand);
      if (!Payload) throw new Error("Lambda infrastructure returned empty stream.");
      
      const lambdaResponse = JSON.parse(Buffer.from(Payload).toString());
      if (lambdaResponse.statusCode !== 200) {
        throw new Error(`Lambda chart generation threw an error: ${lambdaResponse.body}`);
      }

      responsePayload = JSON.parse(lambdaResponse.body);

    } else {
      throw new Error(`Tool ${apiPath} is not recognized by the MCP Server.`);
    }

    // Direct all clean execution trajectories out through our master formatter block
    return buildBedrockResponse(actionGroup, apiPath, responsePayload, startTime);

  } catch (error: any) {
    const failureTimeMs = Math.round(performance.now() - startTime);
    console.error(`❌ [MCP Server Error] Failed after ${failureTimeMs}ms:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helper module to keep our response objects strictly compliant with Amazon Bedrock specifications
function buildBedrockResponse(actionGroup: string, apiPath: string, payload: any, startTime: number) {
  const executionTimeMs = Math.round(performance.now() - startTime);
  console.log(`⏱️ [MCP Telemetry] ${apiPath} completed execution processing loop in ${executionTimeMs}ms`);

  return NextResponse.json({
    messageVersion: '1.0',
    response: {
      actionGroup: actionGroup,
      apiPath: apiPath,
      httpMethod: 'POST',
      httpStatusCode: 200,
      responseBody: {
        'application/json': { body: JSON.stringify(payload) }
      }
    }
  });
}