import React, { useState, useEffect, useRef } from "react";
import { matchGrants, getChatGPTExplanation } from "@/utils/grantmatcher";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { RotateCcw, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

// Here are the 8 required questions from your system prompt:
const QUESTIONS = [
  "What's your name?",
  "What's your project name? Please provide a brief description, including your location.",
  "Which ecosystem does your project belong to? (Ethereum, Cosmos, Cardano, Solana, Filecoin, Aptos, Other)",
  "What stage is your project in? (Idea, MVP, Scaling, Mature)",
  "Which category best describes your project? (AI, AI Agents, CrossChain, DAOs, Data & Oracles, DeFi, DePIN, DevTooling, Education, Events, Gaming, Infrastructure, NFTs & Creator Economy, Privacy & Security, Public Goods, RWAs, Social & Community, Stablecoins & Payments, Sustainability, ZK)",
  "What type of funding are you looking for? (Open Grants, Quadratic Funding, RetroACTIVE Grants, Hackathon Grants, Incubation and Acceleration, Matching Grants, etc.)",
  "How much funding do you need?",
  "Any additional notes?",
];

// We'll map each question to a property in "questionnaireAnswers"
const questionKeys = [
  "name",
  "project",
  "ecosystem",
  "stage",
  "category",
  "fundingType",
  "fundingAmount",
  "notes",
];

export default function ChatbotContainer() {
  // Basic React states
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // We'll store user answers to each question
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({
    name: "",
    project: "",
    ecosystem: "",
    stage: "",
    category: "",
    fundingType: "",
    fundingAmount: "",
    notes: "",
  });

  // Track which question index we are on
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // For auto-scrolling to bottom of chat
  const chatEndRef = useRef(null);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // This function is called every time the user hits "Enter" or clicks the Send button
  const handleSend = async () => {
    if (!prompt.trim()) return;

    // Add the user's message to the chat
    const userMessage = {
      role: "user",
      content: prompt.trim(),
      type: "text",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Lowercase for easy matching
    const userText = prompt.trim().toLowerCase();
    setPrompt("");
    setIsLoading(true);

    try {
      // If user says "skip," we store "Skipped" for the current question
      if (userText.includes("skip")) {
        storeAnswer("Skipped");
      }
      // If user says "show me grants," "grants now," or "I want grants," etc.
      else if (
        userText.includes("show me grants") ||
        userText.includes("grants now") ||
        userText.includes("i want grants") ||
        userText.includes("give me the grants")
      ) {
        // Fill all unanswered with "Skipped"
        fillAllUnansweredWithSkipped();
        // Then do final matching
        await doFinalGrantMatching();
        setIsLoading(false);
        return;
      } else {
        // Otherwise, store user text as the answer to the current question
        storeAnswer(userMessage.content);
      }

      // Check if we have all answers
      const allAnswered = Object.values(questionnaireAnswers).every((val) => val.trim() !== "");
      if (allAnswered) {
        // We can do the final matching
        await doFinalGrantMatching();
      } else {
        // Otherwise, move on to next question
        askNextQuestion();
      }
    } catch (err) {
      console.error("Error in handleSend:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong while processing your request.",
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to store the user's answer in questionnaireAnswers
  const storeAnswer = (answer) => {
    const currentKey = questionKeys[currentQuestionIndex];
    setQuestionnaireAnswers((prev) => ({
      ...prev,
      [currentKey]: answer,
    }));
    // Move index forward (but not beyond last question)
    setCurrentQuestionIndex((idx) => Math.min(idx + 1, QUESTIONS.length - 1));
  };

  // Helper to fill any unanswered question with "Skipped"
  const fillAllUnansweredWithSkipped = () => {
    setQuestionnaireAnswers((prev) => {
      const updated = { ...prev };
      questionKeys.forEach((key) => {
        if (!updated[key]) {
          updated[key] = "Skipped";
        }
      });
      return updated;
    });
    setCurrentQuestionIndex(QUESTIONS.length); // effectively marks all done
  };

  // Ask the next question from our local array (NOT from GPT)
  const askNextQuestion = () => {
    const nextIndex = Math.min(currentQuestionIndex + 1, QUESTIONS.length - 1);
    setCurrentQuestionIndex(nextIndex);

    const question = QUESTIONS[nextIndex];
    // Show that question in chat from the assistant
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: question,
        type: "text",
      },
    ]);
  };

  // Called once we have all answers or user forcibly wants grants
  const doFinalGrantMatching = async () => {
    try {
      // Combine user answers
      const combinedPrompt = Object.entries(questionnaireAnswers)
        .map(([key, val]) => `${key}: ${val}`)
        .join("\n");

      // 1) We do local match
      const matchedGrants = await matchGrants(combinedPrompt);

      // 2) We ask GPT for a final explanation or summary
      const { reply } = await getChatGPTExplanation(
        localStorage.getItem("sessionId") || "",
        combinedPrompt,
        matchedGrants
      );

      // Add matched grants to the chat
      if (matchedGrants.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "grants",
            grants: matchedGrants,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "No grants found for your project details.",
            type: "text",
          },
        ]);
      }

      // Show GPT's final message if it’s not empty
      if (reply && reply.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply.trim(), type: "text" },
        ]);
      }
    } catch (error) {
      console.error("Error in doFinalGrantMatching:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong matching grants.",
          type: "text",
        },
      ]);
    }
  };

  // On mount, we ask the *first* question
  useEffect(() => {
    // Only if we have zero messages, ask the first question
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: QUESTIONS[0], // "What's your name?"
          type: "text",
        },
      ]);
    }
  }, []);

  return (
    <div className="bg-[#121C38] text-white p-6 rounded-xl shadow-lg border border-[#1F2A50] w-full lg:max-w-sm lg:sticky lg:top-20">
      <h2 className="text-xl font-bold text-[#EAEAEA]">AI Grant Matcher Tool</h2>
      <p className="text-sm text-[#A1B1E1] mt-2">
        Our AI assistant will match your project with the ideal grant opportunity.
      </p>

      <Textarea
        className="mt-4 bg-[#1A2B50] text-[#EAEAEA] placeholder-[#5E739E] border border-[#253B6E] rounded-lg focus:ring-2 focus:ring-[#58A6FF] resize-none h-24"
        placeholder="Type your answer or 'skip'..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
            setIsOpen(true);
          }
        }}
      />

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            onClick={() => {
              handleSend();
              setIsOpen(true);
            }}
            className="w-full mt-4 bg-gradient-to-r from-[#253B6E] to-[#1A2B50] text-white flex items-center gap-2 border border-[#3D5A99] hover:bg-[#1A2B50] hover:border-[#58A6FF] transition-all"
          >
            Next
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-[480px] p-0 bg-[#121C38] text-white border-l border-[#1F2A50] flex flex-col">
          <div className="p-4 flex justify-between items-center border-b border-[#1F2A50]">
            <h2 className="text-lg font-semibold text-[#EAEAEA]">
              <img src="./logo.png" className="w-44" alt="" />
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
            {messages.map((msg, idx) => {
              if (msg.type === "grants") {
                // Show the matched grants
                return msg.grants.map((grant, i) => (
                  <div key={`${idx}-${i}`} className="p-4 bg-white border rounded shadow-sm">
                    <h3 className="font-bold text-lg">{grant.grantProgramName}</h3>
                    <p><strong>Ecosystem:</strong> {grant.ecosystem}</p>
                    <p><strong>Description:</strong> {grant.description}</p>
                    <p><strong>Funding Type:</strong> {grant.fundingType}</p>
                    <p><strong>Max Funding:</strong> {grant.maxFunding}</p>
                    <a
                      href={grant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Website
                    </a>
                  </div>
                ));
              }
              // Otherwise text messages
              return (
                <div
                  key={idx}
                  className={`text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block px-3 py-2 rounded-xl shadow-lg ${
                      msg.role === "user"
                        ? "bg-[#3D5A99] text-white rounded-tr-none"
                        : "bg-[#1A2B50] text-[#EAEAEA] rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="text-left text-sm">
                <div className="inline-block px-3 py-4 rounded-xl shadow-lg bg-[#1A2B50] text-[#EAEAEA] rounded-tl-none animate-pulse">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce" />
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-[#1F2A50] flex gap-2">
            <Textarea
              className="flex-1 bg-[#1A2B50] text-[#EAEAEA] placeholder-[#5E739E] border border-[#253B6E] rounded-lg focus:ring-2 focus:ring-[#58A6FF] resize-none"
              placeholder="Type your answer or 'skip'..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-[#3D5A99] text-white rounded-lg px-4 hover:bg-white hover:text-[#3D5A99] transition-all [&_svg]:size-5 flex items-center justify-center"
            >
              {isLoading ? (
                <RotateCcw className="animate-[spin_1s_linear_infinite_reverse]" />
              ) : (
                <Send />
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
