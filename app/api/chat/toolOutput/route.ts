import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { thread_id, message, tool_outputs } = body;
    console.log(thread_id, message, tool_outputs);

    if (tool_outputs) {
      const { run_id, tool_call_id, results } = tool_outputs;
      console.log(run_id, tool_call_id, results);
      console.log(
        "Received results:",
        Array.isArray(results),
        results?.length,
        results
      );

      // print in pretty format
      if (Array.isArray(results) && results.length > 0) {
        const simplifiedGrants = results.slice(0, 3).map((grant: any) => ({
          name: grant.grantProgramName,
          description: grant.description,
          funding: `${grant.minFunding} - ${grant.maxFunding}`,
          website: grant.website,
        }));

        // Submit tool outputs (so i can resume the execution of current run)
        await openai.beta.threads.runs.submitToolOutputs(thread_id, run_id, {
          tool_outputs: [
            {
              tool_call_id,
              output: JSON.stringify(simplifiedGrants),
            },
          ],
        });
        console.log("resumed");
      } else {
        console.warn("❗ tool_outputs.results is empty or not an array.");
        await openai.beta.threads.runs.submitToolOutputs(thread_id, run_id, {
          tool_outputs: [
            {
              tool_call_id,
              output: JSON.stringify([]),
            },
          ],
        });
      }

      console.log("resumed");
    } else {
      // Step 2: User sends new message → add to thread
      await openai.beta.threads.messages.create(thread_id, {
        role: "user",
        content: message,
      });
    }

    // Step 3: Check if there's an active run first
    let run;

    try {
      // Try retrieving all runs for this thread
      const runs = await openai.beta.threads.runs.list(thread_id, { limit: 1 });
      const latestRun = runs.data[0];

      if (
        latestRun &&
        ["queued", "in_progress", "requires_action"].includes(latestRun.status)
      ) {
        run = latestRun;
      } else {
        run = await openai.beta.threads.runs.create(thread_id, {
          assistant_id: ASSISTANT_ID,
        });
      }
    } catch (e) {
      console.error("Failed to check/create run:", e);
      throw e;
    }

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

    // Step 4: Get the final reply message
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
