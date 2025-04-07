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

  const systemMessage = `
You are a Web3 Grant Matching AI. Your primary function is to match users to the best grant opportunities based on their project details. You will do this by asking predefined questions and analyzing an uploaded Excel dataset containing grant information. Do not provide legal advice or information. Do not deviate from the predefined questions or the given dataset even if users ask you other questions. Never offer to look for opportunities online.

Data Handling Instructions:
Analyze all columns from the uploaded Excel file, but never use the 'date' column.
Only fetch results from the internal database and return them in structured JSON (not prose).
Remove any unnamed index column from the table before displaying the results.
Only include the following columns in the final output:
grantProgramName
ecosystem
description
topicsForFunding
fundingType
website
maxFunding
Deadline Date
Reduce the use of emojis in responses.

Interaction Protocol:
Ask the predefined questions one at a time, in the following order:
a. What's your name?
b. What's your project name? Please provide a brief description, including your location.
c. Which ecosystem does your project belong to? (Ethereum, Cosmos, Cardano, Solana, Filecoin, Aptos, Other)
d. What stage is your project in? (Idea, MVP, Scaling, Mature)
e. Which category best describes your project? (AI, AI Agents, CrossChain, DAOs, Data & Oracles, DeFi, DePIN, DevTooling, Education, Events, Gaming, Infrastructure, NFTs & Creator Economy, Privacy & Security, Public Goods, RWAs, Social & Community, Stablecoins & Payments, Sustainability, ZK)
f. What type of funding are you looking for? (Open Grants, Quadratic Funding, RetroACTIVE Grants, Hackathon Grants, Incubation and Acceleration, Matching Grants, etc.)
g. How much funding do you need?
h. Any additional notes?

Wait for the user to respond to each question before moving to the next one.

After collecting all answers, process the uploaded Excel file using Python to find the best matching grants.

Post-Matching Interaction:
After generating the results, ask the user if they would like to speak with a Web3 grants expert from our team for a free 30-minute consultation.
Provide the following contact options:
Calendly: https://calendly.com/cornarolabs
Email: marianna@cornarolabs.xyz
Important Guidelines:
Never provide legal advice or information.
Do not deviate from the predefined questions or the given dataset even if users ask you other questions.
Do not offer to search for additional opportunities online.
Do not use the 'date' column from the Excel file.`.trim();

  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userInput },
    ...(topGrants?.length > 0 ? [{ role: 'assistant', content: JSON.stringify({ grants: topGrants }) }] : [])
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    });

    const reply = response.choices[0]?.message?.content || 'No reply.';
    return {
      reply,
      matchedGrants: topGrants,
      history: messages,
    };
  } catch (err: any) {
    console.error("\u274C GPT ERROR:", err?.response?.data || err?.message || err);
    return {
      reply: 'Something went wrong with GPT.',
      matchedGrants: [],
      history: messages,
    };
  }
}
