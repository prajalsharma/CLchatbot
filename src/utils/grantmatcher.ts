import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import OpenAI from 'openai';
import grants from '../data/grants.json';

// =======================
// GPT + Embedding Setup
// =======================

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

let model: use.UniversalSentenceEncoder | null = null;
let grantEmbeddingsCache: number[][] | null = null;

async function initModel() {
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

// If you want to cache embeddings for performance, uncomment:
async function cacheGrantEmbeddings() {
  if (!grantEmbeddingsCache) {
    await initModel();
    const texts = grants.map((g) => g.combined);
    const embeddings = await model!.embed(texts);
    grantEmbeddingsCache = await embeddings.array();
  }
}

// =======================
// Conversational Logic
// =======================

// The 7 questions (removed "Any additional notes?")
const QUESTIONS = [
  "What's your name?",
  "What's your project name? Please provide a brief description, including your location.",
  "Which ecosystem does your project belong to? (Ethereum, Cosmos, Cardano, Solana, Filecoin, Aptos, Other)",
  "What stage is your project in? (Idea, MVP, Scaling, Mature)",
  "Which category best describes your project? (AI, AI Agents, CrossChain, DAOs, Data & Oracles, DeFi, DePIN, DevTooling, Education, Events, Gaming, Infrastructure, NFTs & Creator Economy, Privacy & Security, Public Goods, RWAs, Social & Community, Stablecoins & Payments, Sustainability, ZK)",
  "What type of funding are you looking for? (Open Grants, Quadratic Funding, RetroACTIVE Grants, Hackathon Grants, Incubation and Acceleration, Matching Grants, etc.)",
  "How much funding do you need?",
];

// We store user answers here:
interface QuestionnaireAnswers {
  name: string;
  project: string;
  ecosystem: string;
  stage: string;
  category: string;
  fundingType: string;
  fundingAmount: string;
}

// Initialize conversation state
let currentQuestionIndex = 0;
let userAnswers: QuestionnaireAnswers = {
  name: "",
  project: "",
  ecosystem: "",
  stage: "",
  category: "",
  fundingType: "",
  fundingAmount: "",
};

// We'll keep track of the conversation in memory
let conversationHistory: { role: string; content: string }[] = [];

// =======================
// GPT Calls
// =======================

// The system message with no "Any additional notes?" or repeated instructions
const SYSTEM_MESSAGE = `
You are a Web3 Grant Matching AI. I am your friendly AI assistant, here to help you find the best grants for your project. Your primary function is to match users to the best grant opportunities based on their project details. You will do this by asking predefined questions and analyzing an uploaded Excel dataset containing grant information. Do not provide legal advice or information. Do not deviate from the predefined questions or the given dataset even if users ask you other questions. Never offer to look for opportunities online.

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
Do not use the 'date' column from the Excel file.
`.trim();

/**
 * This function calls GPT for partial conversation. We do NOT pass the grants,
 * so GPT won't produce final results spontaneously. It only sees the conversation
 * so far + system message, letting it ask the next question or respond logically.
 */
async function callGPTForConversation(userMessage: string) {
  // Add user message to conversation
  conversationHistory.push({ role: 'user', content: userMessage });

  const messages = [
    { role: 'system', content: SYSTEM_MESSAGE },
    ...conversationHistory,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or whichever model
      messages,
    });

    const reply = response.choices[0]?.message?.content || '';
    // Add GPT's response to conversation
    conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  } catch (err: any) {
    console.error("GPT CONVERSATION ERROR:", err?.response?.data || err?.message || err);
    return "I'm sorry, there was an error.";
  }
}

/**
 * Final call to GPT, now including topGrants. GPT can produce the final explanation.
 * We'll force Marianna's contact if it forgets.
 */
async function callGPTForFinalExplanation(combinedPrompt: string, topGrants: any[]) {
  // Summaries for reference
  const grantSummary = topGrants.map((g, i) => {
    return `#${i + 1}\n` +
      `Grant Program Name: ${g.grantProgramName || 'N/A'}\n` +
      `Ecosystem: ${g.ecosystem || 'N/A'}\n` +
      `Description: ${g.description || 'N/A'}\n` +
      `Funding Type: ${g.fundingType || 'N/A'}\n` +
      `Website: ${g.website || 'N/A'}\n`;
  }).join('\n\n');

  // We'll pass the topGrants as an assistant message, so GPT sees them
  // but we still want to ensure it doesn't just repeat them. It's up to you if you remove it.
  const finalMessages = [
    { role: 'system', content: SYSTEM_MESSAGE },
    ...conversationHistory,
    { role: 'user', content: combinedPrompt },
    { role: 'assistant', content: JSON.stringify({ grants: topGrants }) },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: finalMessages,
    });

    let finalReply = response.choices[0]?.message?.content || '';

    // Force Marianna's contact if GPT forgets
    const lower = finalReply.toLowerCase();
    if (!lower.includes('calendly.com/cornarolabs') || !lower.includes('marianna@cornarolabs.xyz')) {
      finalReply += `

Would you like to speak with a Web3 grants expert from our team for a free 30-minute consultation?
Calendly: https://calendly.com/cornarolabs
Email: marianna@cornarolabs.xyz
`;
    }

    // Add final GPT message to conversation
    conversationHistory.push({ role: 'assistant', content: finalReply });
    return finalReply;
  } catch (err: any) {
    console.error("GPT FINAL ERROR:", err?.response?.data || err?.message || err);
    return "Something went wrong with GPT.";
  }
}

// =======================
// Public Methods
// =======================

/**
 * The user calls `startConversation()` at the beginning.
 * We ask the first question from GPT or from our local array.
 */
export async function startConversation() {
  conversationHistory = [];
  userAnswers = {
    name: "",
    project: "",
    ecosystem: "",
    stage: "",
    category: "",
    fundingType: "",
    fundingAmount: "",
  };
  currentQuestionIndex = 0;

  // Let GPT do the initial greeting or we do it ourselves:
  conversationHistory.push({
    role: 'assistant',
    content: QUESTIONS[0], // "What's your name?"
  });

  return QUESTIONS[0];
}

/**
 * Each time the user sends a message, we store it in userAnswers
 * if it matches the current question, or skip logic, etc. Then we either
 * ask GPT for the next question or do final matching.
 */
export async function handleUserResponse(userInput: string) {
  const lowerInput = userInput.trim().toLowerCase();

  // If user says "show me grants" or "done", do final matching
  if (
    lowerInput.includes("show me grants") ||
    lowerInput.includes("done") ||
    lowerInput.includes("grants now")
  ) {
    // Fill unanswered with "Skipped"
    fillUnansweredWithSkipped();
    return await doFinalMatching();
  }

  // Otherwise, store the user answer for the current question
  storeAnswer(currentQuestionIndex, userInput);

  // Check if all questions are answered
  const allAnswered = Object.values(userAnswers).every((val) => val.trim() !== "");
  if (allAnswered) {
    // All done, do final matching
    return await doFinalMatching();
  } else {
    // Move to next question
    currentQuestionIndex = Math.min(currentQuestionIndex + 1, QUESTIONS.length - 1);
    const nextQ = QUESTIONS[currentQuestionIndex];

    // We'll let GPT do a partial conversation to respond logically,
    // but we won't pass the entire dataset so it doesn't jump to final results.
    const partialReply = await callGPTForConversation(userInput);

    // Optionally, override GPT's next question with our local array's nextQ
    // to ensure we don't ask "Any additional notes?" or re-ask the name.
    // We'll just show the user nextQ from local array.
    return {
      partialReply,
      nextQuestion: nextQ,
    };
  }
}

/**
 * Once everything is answered or user forcibly wants grants, we do final matching.
 */
async function doFinalMatching() {
  // Combine user answers
  const combinedPrompt = Object.entries(userAnswers)
    .map(([key, val]) => `${key}: ${val}`)
    .join("\n");

  const matchedGrants = await matchGrants(combinedPrompt);

  // Now do final GPT call with topGrants
  const finalReply = await callGPTForFinalExplanation(combinedPrompt, matchedGrants);

  return {
    matchedGrants,
    finalReply,
  };
}

/**
 * Helper to store the user input in the correct field
 */
function storeAnswer(questionIndex: number, answer: string) {
  switch (questionIndex) {
    case 0:
      userAnswers.name = answer;
      break;
    case 1:
      userAnswers.project = answer;
      break;
    case 2:
      userAnswers.ecosystem = answer;
      break;
    case 3:
      userAnswers.stage = answer;
      break;
    case 4:
      userAnswers.category = answer;
      break;
    case 5:
      userAnswers.fundingType = answer;
      break;
    case 6:
      userAnswers.fundingAmount = answer;
      break;
    default:
      // no-op
      break;
  }
}

/**
 * Fill any unanswered question with "Skipped"
 */
function fillUnansweredWithSkipped() {
  if (!userAnswers.name) userAnswers.name = "Skipped";
  if (!userAnswers.project) userAnswers.project = "Skipped";
  if (!userAnswers.ecosystem) userAnswers.ecosystem = "Skipped";
  if (!userAnswers.stage) userAnswers.stage = "Skipped";
  if (!userAnswers.category) userAnswers.category = "Skipped";
  if (!userAnswers.fundingType) userAnswers.fundingType = "Skipped";
  if (!userAnswers.fundingAmount) userAnswers.fundingAmount = "Skipped";
}
