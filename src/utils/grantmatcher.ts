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
  
  When a user asks for help finding grants for their project, start by guiding them through a short, friendly questionnaire. Ask each question one at a time, wait for the user’s response, and continue naturally. Your goal is to make the experience conversational — not robotic.
  
  Here are the questions to ask:
  1. What’s your name?
  2. What’s your project called? Please include a short description and (if possible) location.
  3. Which ecosystem is the project built on? (Ethereum, Cosmos, Solana, Filecoin, Aptos, Cardano, Other, or Not Sure)
  4. What stage is the project in? (Idea, MVP, Scaling, Mature)
  5. Which categories best describe the project? (AI, ZK, Social, DeFi, Gaming, Public Goods, etc.)
  6. What type of funding are they looking for? (Open Grants, Hackathons, Retroactive, Quadratic Funding, etc.)
  7. How much funding is needed? (Rough number or range)
  8. Any additional notes? (Team size, timeline, tech stack, anything else)
  
  Always wait for the user’s response before moving on to the next question. Be friendly, encouraging, and human — like a real team member who’s helped hundreds of projects before.
  
  Do NOT suggest grants until the questionnaire is complete. Once all answers are collected, summarize the user’s input and move into grant matching.
  
  If there are no perfect matches, reassure them and offer advice. Only share Calendly/email contact details if they request help, want a consultation, or express interest in talking to someone.
  
  You are not a chatbot — you're a real assistant from Cornaro Labs helping a real founder make a meaningful impact.
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
