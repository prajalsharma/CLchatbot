import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { thread_id, message } = body;

    // Check if there's an active run before creating a new message
    try {
      const runs = await openai.beta.threads.runs.list(thread_id);
      const activeRun = runs.data.find(
        (run) =>
          !["completed", "failed", "cancelled", "expired"].includes(run.status)
      );

      if (activeRun) {
        return NextResponse.json(
          { error: "Cannot send a new message while a run is in progress" },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error("Error checking active runs:", error);
    }

    // Add user message to thread
    await openai.beta.threads.messages.create(thread_id, {
      role: "user",
      content: message,
    });

    // Create a new run
    const run = await openai.beta.threads.runs.create(thread_id, {
      assistant_id: ASSISTANT_ID,
    });

    let runStatus;
    let retries = 0;
    const maxRetries = 60;

    do {
      runStatus = await openai.beta.threads.runs.retrieve(thread_id, run.id);

      if (runStatus.status === "requires_action") {
        const toolCall =
          runStatus.required_action?.submit_tool_outputs?.tool_calls[0];
        if (toolCall) {
          const { name, arguments: args } = toolCall.function;
          return NextResponse.json({
            tool_call_required: true,
            tool_call: {
              name,
              arguments: JSON.parse(args),
              run_id: runStatus.id,
              tool_call_id: toolCall.id,
            },
          });
        }
      }

      if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
        throw new Error(`Run failed with status: ${runStatus.status}`);
      }

      await new Promise((r) => setTimeout(r, 1000));
      retries++;
    } while (runStatus.status !== "completed" && retries < maxRetries);

    if (retries >= maxRetries) {
      throw new Error("Timeout waiting for run to complete");
    }

    const messages = await openai.beta.threads.messages.list(thread_id);
    const latestMessage =
      messages.data[0]?.content[0]?.type === "text"
        ? messages.data[0].content[0].text?.value
        : undefined;

    return NextResponse.json({ reply: latestMessage }, { status: 200 });
  } catch (error) {
    console.error("❌ Error handling assistant message:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
