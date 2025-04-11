import React, { useState, useEffect, useRef } from "react";
import { matchGrants, getChatGPTExplanation } from "@/utils/grantmatcher";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { RotateCcw, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { cn } from "@/lib/utils";
import { print_details_on_console } from "./chatBotUtils/utils";


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
  const [hasShownGreeting, setHasShownGreeting] = useState(false);
  const [threadId, setThreadId] = useState(null);

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

  // for init-ing the thread for each session
  useEffect(() => {
    const initThread = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/chat/thread", {
          method: "POST",
        });
        const data = await res.json();
        console.log("threadId:", data.threadId);
        setThreadId(data.threadId);
      } catch (err) {
        console.error("Failed to create thread:", err);
      }
    };

    initThread();
  }, []);

  const handleSendMessage = async (message) => {
    const res = await fetch("http://localhost:3000/api/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thread_id: threadId,
        message:
          "1. Gulshan, 2. Aleo, zk centic zk application from Paris, 3. Ethereum , 4. MVP, 5. DeFi, 6. Open Grants 7. 10000",
      }),
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      console.log("Parsed data:", data);

      // Tool call required
      if (data.tool_call_required) {
        const toolCall = data.tool_call;
        console.log("Tool call from Assistant:", toolCall);

        if (toolCall.name === "print_details_on_console") {
          const details = toolCall.arguments.details;

          print_details_on_console(
            details.ecosystem,
            details.category,
            details.fundingType,
            details.fundingAmount,
            details.projectDescription
          );
        }
      } else {
        console.log("Assistant Reply:", data.reply);
      }
    } catch (err) {
      console.error("Failed to parse JSON:", text);
    }
  };

  // This function shows the greeting when the dialog opens
  useEffect(() => {
    if (isOpen && !hasShownGreeting) {
      // Initialize with a greeting message when dialog opens for the first time
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm your AI grant matcher assistant. I'll help you find the perfect grant opportunities for your project. Let's get started with a few questions about your project. " +
            QUESTIONS[0],
          type: "text",
        },
      ]);
      setHasShownGreeting(true);
    }
  }, [isOpen, hasShownGreeting]);

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
      const allAnswered = Object.values(questionnaireAnswers).every(
        (val) => val.trim() !== ""
      );
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

      // Show GPT's final message if it's not empty
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

  // Removed the initial useEffect that was automatically showing the first question

  // const handleConsole = async (userQueryString) => {
  //   console.log("Current answers:", questionnaireAnswers);
  //   console.log("Current question index:", currentQuestionIndex);
  //   console.log("Messages:", messages);
  //   console.log("Prompt:", prompt);
  //   console.log("Thread ID:", threadId);
  //   const userQueryString = Object.entries(questionnaireAnswers)
  //     .map(([key, value]) => `${capitalize(key)}: ${value}`)
  //     .join("\n");

  //   function capitalize(str) {
  //     return str.charAt(0).toUpperCase() + str.slice(1);
  //   }

  //   console.log("User Query String:", userQueryString);
  //   try {
  //     const userEmbedding = await getUserEmbedding(userQueryString);
  //     console.log("✅ User Embedding:", userEmbedding);
  //     try {
  //       const embeddedGrants = await loadEmbeddedGrants();
  //       const matches = findTopMatches(userEmbedding, embeddedGrants);
  //       console.log("🎯 Top matches:", matches);
  //     } catch (error) {
  //       console.error("Error in handleConsole: in cosine similarity", error);
  //     }
  //   } catch (err) {
  //     console.error("❌ Error getting embedding:", err);
  //   }
  // };

  return (
    <div className="bg-[#121C38] text-white p-6 rounded-xl shadow-lg border border-[#1F2A50] w-full lg:max-w-md text-center lg:text-left">
      <h2 className="text-xl font-bold text-[#EAEAEA]">
        AI Grant Matcher Tool
      </h2>
      <p className="text-sm text-[#A1B1E1] mt-2">
        Our AI assistant will match your project with the ideal grant
        opportunity.
      </p>

      {/* Show a greeting message when dialog is closed */}
      {!isOpen && (
        <p className="mt-4 text-[#EAEAEA] bg-[#1A2B50] p-3 rounded-lg border border-[#253B6E]">
          Hello! I'm your AI grant matcher assistant. Enter your project details
          and I'll help you find the perfect grant opportunities. (here goes any
          text you want as first text of the thread)
        </p>
      )}

      {/* uncomment this according to UX */}
      {/* <Textarea
        className="mt-4 bg-[#1A2B50] text-[#EAEAEA] placeholder-[#5E739E] border border-[#253B6E] rounded-lg focus:ring-2 focus:ring-[#58A6FF] resize-none h-12"
        placeholder="Ask about grants..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
            setIsOpen(true);
          }
        }}
      /> */}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            onClick={() => {
              setIsOpen(true);
            }}
            className="w-full mt-4 bg-gradient-to-r from-[#253B6E] to-[#1A2B50] text-white flex items-center gap-2 border border-[#3D5A99] hover:bg-[#1A2B50] hover:border-[#58A6FF] transition-all"
          >
            Find Grants
          </Button>
        </SheetTrigger>

        {/* Updated SheetContent with white background and black text */}
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
                  <div
                    key={`${idx}-${i}`}
                    className="p-4 bg-white border rounded shadow-sm"
                  >
                    <h3 className="font-bold text-lg">
                      {grant.grantProgramName}
                    </h3>
                    <p>
                      <strong>Ecosystem:</strong> {grant.ecosystem}
                    </p>
                    <p>
                      <strong>Description:</strong> {grant.description}
                    </p>
                    <p>
                      <strong>Funding Type:</strong> {grant.fundingType}
                    </p>
                    <p>
                      <strong>Max Funding:</strong> {grant.maxFunding}
                    </p>
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
                  className={`text-sm ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
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

          <div className="p-4 border-t border-gray-300 flex gap-2">
            <Textarea
              className="flex-1 bg-[#1A2B50] text-[#EAEAEA] placeholder-[#5E739E] border border-[#253B6E] rounded-lg focus:ring-2 focus:ring-[#58A6FF] resize-none"
              placeholder="Describe your project..."
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
      <button onClick={handleSendMessage}>click me for more infos</button>
    </div>
  );
}
