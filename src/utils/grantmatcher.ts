import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import OpenAI from 'openai';
import grants from '../data/grants.json';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

let model: use.UniversalSentenceEncoder | null = null;

export async function initModel() {
  if (!model) {
    await tf.setBackend('webgl');
    await tf.ready();
    model = await use.load();
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function matchGrants(userInput: string, topK = 5) {
  await initModel();

  const userEmbedding = await model!.embed([userInput]);
  const userVec = await userEmbedding.array().then((res) => res[0]);

  const texts = grants.map((g) => g.combined);
  const grantEmbeddings = await model!.embed(texts);
  const grantVecs = await grantEmbeddings.array();

  const scored = grantVecs.map((vec, i) => ({
    grant: grants[i],
    score: cosineSimilarity(userVec, vec),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.grant);
}

// In-memory chat history
const chatHistories: Record<string, { role: 'user' | 'assistant' | 'system'; content: string }[]> = {};

export async function getChatGPTExplanation(
  sessionId: string,
  userInput: string,
  topGrants: any[]
) {
  const grantSummary = topGrants.map((g, i) => {
    return `#${i + 1}\n` +
      `Grant Program Name: ${g.grantProgramName || 'N/A'}\n` +
      `Ecosystem: ${g.ecosystem || 'N/A'}\n` +
      `Description: ${g.description || 'N/A'}\n` +
      `Funding Type: ${g.fundingType || 'N/A'}\n` +
      `Website: ${g.website || 'N/A'}\n`;
  }).join('\n\n');

  if (!chatHistories[sessionId]) {
    chatHistories[sessionId] = [
      {
        role: 'system',
        content: `
  You are a warm, intelligent Web3 Grants Assistant from Cornaro Labs.

🎯 Your role is to help users discover the best matching grants based on the details they provide — even if it’s partial. If the user gives **at least their project idea and one other detail**, do NOT force them to fill the entire questionnaire. Use good judgment to move forward with matching.

🤖 If the user says things like:
- "show me 5 AI grants"
- "suggest grants in zk"
- "i just want grant names"
...then proceed directly to grant suggestions. Be helpful and efficient — not robotic or pushy.

📦 When showing grants, always format them cleanly like cards. Each grant must include:
1. Grant Program Name
2. Ecosystem
3. Description (a few lines, human readable)
4. Funding Type
5. Max Funding (if known)
6. Website (with a **hyperlinked** label like “Website”)

❌ NEVER use paragraph blobs or numbered markdown lists when returning grants.
✅ ALWAYS return structured, skimmable content.

💡You can still ask questions to clarify if the user is unsure — but never argue or insist if they clearly want results now.

Only offer Calendly/email if the user explicitly asks to connect with someone.

You're not a chatbot. You're a real grants assistant guiding builders. Keep it warm.
  `.trim() // ✅ Trimming the full content string here
      },
      {
        role: 'user',
        content: 'Help me find suitable grants for my project',
      }
    ];
  } else {
    chatHistories[sessionId].push({ role: 'user', content: prompt });
  }
  
  

  const summaryPrompt = topGrants.length > 0
  ? `Based on the user's request, here are some relevant grants:\n\n${grantSummary}\n\nNow write a friendly and helpful explanation about why these are good fits, and offer suggestions.`
  : `The user asked: "${userInput}". Respond conversationally. You are a helpful advisor at Cornaro Labs. Provide guidance, advice, or support based on their question.`;

  chatHistories[sessionId].push({ role: 'user', content: userInput });

  chatHistories[sessionId].push({
    role: 'assistant',
    content: summaryPrompt,
  });
  


  try {
    console.log('📤 Sending to OpenAI:', JSON.stringify(chatHistories[sessionId], null, 2));
  
    // 🔒 Filter out bad entries (null, undefined, missing content)
const cleanedMessages = chatHistories[sessionId].filter(
  (msg) => msg.role && typeof msg.content === 'string' && msg.content.trim() !== ''
);

console.log("🧼 Cleaned messages:", cleanedMessages);

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: cleanedMessages,
});

  

    const reply = response.choices[0]?.message?.content || 'No reply.';
    chatHistories[sessionId].push({ role: 'assistant', content: reply });

    return {
      reply,
      history: chatHistories[sessionId],
      matchedGrants: topGrants,
    };
  } catch (err: any) {
    console.error("❌ GPT ERROR:", err?.response?.data || err?.message || err);
    return { reply: 'Something went wrong with GPT.', matchedGrants: [], history: chatHistories[sessionId] };
  }
}
