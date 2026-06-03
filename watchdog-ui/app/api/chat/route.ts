import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextResponse } from "next/server";

// 1. Initialize the Bedrock client
const client = new BedrockAgentRuntimeClient({ region: "us-west-2" });

export async function POST(req: Request) {
  try {
    const { prompt, sessionId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const generatedSessionId = sessionId || `session-${Date.now()}`;

    // 2. Build the initial command
    let command = new InvokeAgentCommand({
      agentId: "MHHZZXHGCF",
      agentAliasId: "TSTALIASID", 
      sessionId: generatedSessionId, 
      inputText: prompt,
    });

    // 3. Send request to Bedrock
    let response = await client.send(command);
    let agentResponse = "";
    let extractedTickerContext = ""; // Tracker variable to capture active assets dynamically

    if (response.completion) {
      for await (const chunkEvent of response.completion) {
        
        // ==========================================
        // TYPE-SAFE RETURN CONTROL INTERCEPTION
        // ==========================================
        if (chunkEvent.returnControl) {
          const invocationInputs = chunkEvent.returnControl.invocationInputs;
          const invocationId = chunkEvent.returnControl.invocationId;
          
          console.log("🎯 [UI Chat Router] Bedrock requested Return Control. Processing tool execution...");
          const toolResults: any[] = [];

          for (const input of invocationInputs || []) {
            const groupInput = input.functionInvocationInput; 
            if (!groupInput) continue;

            const normalizedParameters = groupInput.parameters || [];

            // CAPTURE CONTEXT: Locate the ticker symbol parameter if it is being processed in this turn
            const tickerParam = normalizedParameters.find((p: any) => p.name === 'ticker_symbol');
            if (tickerParam && tickerParam.value) {
              extractedTickerContext = tickerParam.value.toUpperCase();
              console.log(`💾 [UI Memory Lock] Captured conversational context asset: ${extractedTickerContext}`);
            }

            // Format the payload exactly to bridge Bedrock to your local Next.js MCP Switchboard
            const mcpPayload = {
              actionGroup: groupInput.actionGroup,
              apiPath: `/${groupInput.function}`, 
              parameters: normalizedParameters
            };

            // Force a hard loopback address to bypass the Codespaces public HTTPS proxy trap
            const isDev = process.env.NODE_ENV === 'development';
            const currentPort = process.env.PORT || (isDev ? 3000 : 80);
            const internalUrl = `http://127.0.0.1:${currentPort}/api/mcp`;

            console.log(`📡 [UI Chat Router] Forwarding to internal loopback interface: ${internalUrl}`);

            const mcpResponse = await fetch(internalUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mcpPayload)
            });

            const mcpData = await mcpResponse.json();

            if (!mcpResponse.ok) {
              throw new Error(`Local MCP tool invocation failed: ${mcpData.error || mcpResponse.statusText}`);
            }
            
            toolResults.push({
              functionResult: {
                actionGroup: groupInput.actionGroup,
                function: groupInput.function,
                responseBody: {
                  TEXT: {
                    body: JSON.stringify(mcpData.response.responseBody)
                  }
                }
              }
            });
          }

          console.log("🔄 [UI Chat Router] Tool results gathered. Resuming Bedrock Agent orchestration cycle...");

          // 4. PERSIST METADATA: Inject session attributes along with your validation token back into AWS
          const resumeCommand = new InvokeAgentCommand({
            agentId: "MHHZZXHGCF",
            agentAliasId: "TSTALIASID",
            sessionId: generatedSessionId,
            sessionState: {
              invocationId: invocationId,
              returnControlInvocationResults: toolResults,
              // Session attributes stick to this sessionId lifecycle across subsequent turns
              sessionAttributes: extractedTickerContext ? {
                last_discussed_ticker: extractedTickerContext
              } : undefined
            }
          });

          const resumeResponse = await client.send(resumeCommand);

          // Drain the finalized text responses out of the resumed conversation stream
          if (resumeResponse.completion) {
            for await (const resChunk of resumeResponse.completion) {
              if (resChunk.chunk && resChunk.chunk.bytes) {
                agentResponse += new TextDecoder("utf-8").decode(resChunk.chunk.bytes);
              }
            }
          }
          
          break;
        }

        // Standard text streaming block handler
        if (chunkEvent.chunk && chunkEvent.chunk.bytes) {
          agentResponse += new TextDecoder("utf-8").decode(chunkEvent.chunk.bytes);
        }
      }
    }

    return NextResponse.json({ success: true, text: agentResponse });

  } catch (error: any) {
    console.error("Bedrock Invoke Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to connect to the Cognitive Agent." }, 
      { status: 500 }
    );
  }
}