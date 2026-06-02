import { NextResponse } from 'next/server';
import { WATCHDOG_MCP_TOOLS } from '../../../lib/mcp/tools';

// 1. THE DISCOVERY ENDPOINT
// Bedrock calls this to learn what tools are currently available.
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    tools: WATCHDOG_MCP_TOOLS 
  });
}

// 2. THE EXECUTION ENDPOINT
// Bedrock calls this to actually run a tool and get the data back.
export async function POST(request: Request) {
  // Start the telemetry timer for Observability
  const startTime = performance.now();

  try {
    const body = await request.json();
    const { actionGroup, apiPath, parameters } = body;

    console.log(`⚡ [MCP Server] Incoming execution request for: ${apiPath}`);

    // --- TOOL ROUTER ---
    let responsePayload = {};

    if (apiPath === '/fetch_stock_price') {
      // Extract the ticker symbol from the parameters Bedrock sent
      const ticker = parameters.find((p: any) => p.name === 'ticker_symbol')?.value;
      
      if (!ticker) throw new Error("Missing required parameter: ticker_symbol");

      // TODO: Wire up actual external API (e.g., Yahoo Finance or Alpaca)
      responsePayload = {
        ticker: ticker,
        price: 135.42,
        trend: "BULLISH",
        source: "Watchdog_MCP_Engine"
      };

    } else if (apiPath === '/generate_technical_chart') {
      const ticker = parameters.find((p: any) => p.name === 'ticker_symbol')?.value;
      const chartType = parameters.find((p: any) => p.name === 'chart_type')?.value || 'simple_moving_average';

      // TODO: Wire up to S3 Express One Zone and Python generation logic
      responsePayload = {
        ticker: ticker,
        chart_type: chartType,
        s3_uri: `s3://watchdog-v4-charts/${ticker}_${chartType}_latest.png`,
        status: "Chart successfully generated and persisted to edge storage."
      };

    } else {
      throw new Error(`Tool ${apiPath} is not recognized by the MCP Server.`);
    }

    // Stop timer and log telemetry
    const executionTimeMs = Math.round(performance.now() - startTime);
    console.log(`⏱️ [MCP Telemetry] ${apiPath} executed in ${executionTimeMs}ms`);

    // Return the strict format Bedrock requires
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
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}