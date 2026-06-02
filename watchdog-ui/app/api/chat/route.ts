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

    if (response.completion) {
      for await (const chunkEvent of response.completion) {
        
        // ==========================================
        // TYPE-SAFE RETURN CONTROL INTERCEPTION
        // ==========================================
        if (chunkEvent.returnControl) {
          const invocationInputs = chunkEvent.returnControl.invocationInputs;
          const invocationId = chunkEvent.returnControl.invocationId; // Fixed: invocationId
          
          console.log("🎯 [UI Chat Router] Bedrock requested Return Control. Processing tool execution...");
          const toolResults: any[] = [];

          for (const input of invocationInputs || []) {
            // Fixed: targeting functionInvocationInput for Option A console setup
            const groupInput = input.functionInvocationInput; 
            if (!groupInput) continue;

            // Format the payload exactly to bridge Bedrock to your local Next.js MCP Switchboard
            const mcpPayload = {
              actionGroup: groupInput.actionGroup,
              apiPath: `/${groupInput.function}`, // Fixed: function string name reference
              parameters: groupInput.parameters || [] // Natively an array from the SDK!
            };

            console.log(`📡 [UI Chat Router] Forwarding to internal switchboard: ${mcpPayload.apiPath}`);

            // Self-invoke your Fargate /api/mcp endpoint locally
            const { origin } = new URL(req.url);
            const mcpResponse = await fetch(`${origin}/api/mcp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mcpPayload)
            });

            const mcpData = await mcpResponse.json();

            if (!mcpResponse.ok) {
              throw new Error(`Local MCP tool invocation failed: ${mcpData.error || mcpResponse.statusText}`);
            }
            
            // Re-package the execution result using strict functionResult schema
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

          // Build a brand new resume command passing along the validation token and the result array
          const resumeCommand = new InvokeAgentCommand({
            agentId: "MHHZZXHGCF",
            agentAliasId: "TSTALIASID",
            sessionId: generatedSessionId,
            sessionState: {
              returnControlInvocationResults: toolResults
            },
            inputText: invocationId // Submit invocationId to resume transaction context
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