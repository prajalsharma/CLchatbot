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

    await openai.beta.threads.messages.create(thread_id, {
      role: "user",
      content: message,
    });

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
