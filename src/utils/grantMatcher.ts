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

export async function getChatGPTExplanation(userInput: string, topGrants: any[]) {
  const columnsToInclude = [
    'grantProgramName',
    'ecosystem',
    'description',
    'topicsForFunding',
    'fundingType',
    'website',
    'maxFunding',
    'Deadline Date'
  ];

  const grantText = topGrants
    .map((g) =>
      columnsToInclude
        .map((col) => `${col}: ${g[col] || 'N/A'}`)
        .join('\n')
    )
    .join('\n\n');

  const instructions = `You are a Web3 Grants Matching Assistant trained on a curated dataset of over 100 grant programs. Your job is to guide users in understanding relevant grants, but also to provide thoughtful insights, clarify categories, and offer support even when grant matching is not explicitly requested. Avoid using emojis. Stay factual based on the dataset. If the user wants to talk about categories, strategy, or get advice, answer conversationally.`;

  const prompt = `${instructions}\n\nUser project:\n${userInput}\n\nMatched grants:\n${grantText}\n\nRespond accordingly.`;

  console.log("📤 Sending prompt to OpenAI:", prompt);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    console.log("✅ GPT response:", response);
    return response.choices[0]?.message?.content || 'No reply.';
  } catch (err) {
    console.error("❌ GPT ERROR:", err);
    return 'Something went wrong with GPT.';
  }
}
