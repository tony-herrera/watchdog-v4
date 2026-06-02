import { NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { WATCHDOG_MCP_TOOLS } from '../../../lib/mcp/tools';

// 1. Initialize the AWS SDK Lambda Client
// Fargate will automatically inject the IAM credentials from our task role!
const lambdaClient = new LambdaClient({ region: 'us-west-2' });

export async function GET() {
  return NextResponse.json({ success: true, tools: WATCHDOG_MCP_TOOLS });
}

export async function POST(request: Request) {
  const startTime = performance.now();

  try {
    const body = await request.json();
    const { actionGroup, apiPath, parameters } = body;

    console.log(`⚡ [MCP Server] Incoming execution request for: ${apiPath}`);
    let responsePayload = {};

    if (apiPath === '/fetch_stock_price') {
      const ticker = parameters.find((p: any) => p.name === 'ticker_symbol')?.value;
      if (!ticker) throw new Error("Missing required parameter: ticker_symbol");

      // --- LAMBDA INVOCATION ---
      console.log(`📡 [MCP Server] Invoking Fargate -> Lambda worker for ${ticker}...`);
      
      const command = new InvokeCommand({
        FunctionName: 'watchdog-market-data-worker',
        Payload: JSON.stringify({ ticker: ticker }),
      });

      // Fire the request to AWS Lambda
      const { Payload } = await lambdaClient.send(command);
      if (!Payload) throw new Error("Lambda returned an empty payload.");
      
      // Parse the Buffer returned by the AWS SDK
      const lambdaResponse = JSON.parse(Buffer.from(Payload).toString());
      
      if (lambdaResponse.statusCode !== 200) {
        throw new Error(`Lambda execution failed: ${lambdaResponse.body}`);
      }

      // Extract the actual financial data from the Lambda body
      responsePayload = JSON.parse(lambdaResponse.body);

    } else if (apiPath === '/generate_technical_chart') {
      const ticker = parameters.find((p: any) => p.name === 'ticker_symbol')?.value;
      responsePayload = { status: `Chart generation for ${ticker} pending future sprint.` };
    } else {
      throw new Error(`Tool ${apiPath} is not recognized by the MCP Server.`);
    }

    const executionTimeMs = Math.round(performance.now() - startTime);
    console.log(`⏱️ [MCP Telemetry] ${apiPath} executed in ${executionTimeMs}ms`);

    return NextResponse.json({
      messageVersion: '1.0',
      response: {
        actionGroup: actionGroup,
        apiPath: apiPath,
        httpMethod: 'POST',
        httpStatusCode: 200,
        responseBody: {
          'application/json': { body: JSON.stringify(responsePayload) }
        }
      }
    });

  } catch (error: any) {
    const failureTimeMs = Math.round(performance.now() - startTime);
    console.error(`❌ [MCP Server Error] Failed after ${failureTimeMs}ms:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}