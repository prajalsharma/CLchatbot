import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  try {
    const thread = await openai.beta.threads.create();

    return NextResponse.json({ threadId: thread.id }, { status: 200 });
  } catch (err) {
    console.error("❌ Error creating thread:", err);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}
