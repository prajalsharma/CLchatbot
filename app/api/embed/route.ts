import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

let model: use.UniversalSentenceEncoder | null = null;

async function loadModel() {
  if (!model) {
    await tf.setBackend("cpu");
    await tf.ready();
    model = await use.load();
  }
  return model;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const textInput =
      typeof body.text === "string" ? body.text : String(body.text);

    if (!textInput) {
      return NextResponse.json(
        { error: "Missing 'text' field" },
        { status: 400 }
      );
    }

    const model = await loadModel();
    const embeddings = await model.embed([textInput]);
    const array = await embeddings.array();
    const embedding = array[0];

    return NextResponse.json({ embedding }, { status: 200 });
  } catch (err) {
    console.error("❌ Error generating embedding:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
