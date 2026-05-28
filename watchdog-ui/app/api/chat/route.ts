import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextResponse } from "next/server";

// 1. Initialize the Bedrock client
// The magic of Fargate: We don't need to pass access keys here. 
// The AWS SDK automatically finds the "Task Role" we attached in Terraform!
const client = new BedrockAgentRuntimeClient({ region: "us-west-2" });

export async function POST(req: Request) {
  try {
    const { prompt, sessionId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    // 2. Build the command using your specific Agent details
    const command = new InvokeAgentCommand({
      agentId: "MHHZZXHGCF",
      agentAliasId: "TSTALIASID", 
      sessionId: sessionId || `session-${Date.now()}`, // Unique ID for conversational memory
      inputText: prompt,
    });

    // 3. Send the request to Bedrock
    const response = await client.send(command);

    // 4. Parse the streamed response chunks
    let agentResponse = "";
    if (response.completion) {
      for await (const chunkEvent of response.completion) {
        if (chunkEvent.chunk && chunkEvent.chunk.bytes) {
          agentResponse += new TextDecoder("utf-8").decode(chunkEvent.chunk.bytes);
        }
      }
    }

    return NextResponse.json({ success: true, text: agentResponse });

  } catch (error) {
    console.error("Bedrock Invoke Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to connect to the Cognitive Agent." }, 
      { status: 500 }
    );
  }
}