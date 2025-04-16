"use client";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { RotateCcw, Send } from "lucide-react";
import Markdown from "react-markdown";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { handleUserDetails } from "./chatBotUtils/utils";

type MessageType =
  | {
      type: "text";
      role: "user" | "assistant";
      content: string;
    }
  | {
      type: "grants";
      role: "assistant";
      grants: {
        grantProgramName: string;
        ecosystem: string;
        description: string;
        fundingType: string;
        maxFunding: string;
        website: string;
        minFunding?: string;
        status?: string;
        fundingTopics?: string;
      }[];
    };

export default function ChatbotContainer() {
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasShownGreeting, setHasShownGreeting] = useState<boolean>(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [fetchingGrants, setFetchingGrants] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const initThread = async () => {
      try {
        const res = await fetch("/api/chat/thread", {
          method: "POST",
        });
        const data: { threadId: string } = await res.json();
        setThreadId(data.threadId);
      } catch (err) {
        console.error("Failed to create thread:", err);
      }
    };
    initThread();
  }, []);

  useEffect(() => {
    if (isOpen && !hasShownGreeting && threadId) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm your AI grant matcher assistant. I'll help you find the perfect grant opportunities for your project.",
          type: "text",
        },
      ]);
      setHasShownGreeting(true);
    }
  }, [isOpen, hasShownGreeting, threadId]);

  const handleChat = async () => {
    if (!prompt.trim() || !threadId || isLoading) return;
    const userMessage: MessageType = {
      role: "user",
      content: prompt.trim(),
      type: "text",
    };
    setMessages((prev) => [...prev, userMessage]);
    const userText = prompt.trim();
    setPrompt("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          thread_id: threadId,
          message: userText,
        }),
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (res.status === 409) {
          // Handle the case where a run is already in progress
          setMessages((prev) => [
            ...prev,
            {
              type: "text",
              role: "assistant",
              content:
                "I'm still processing your previous request. Please wait a moment before sending a new message.",
            },
          ]);
          return;
        }
        if (data.tool_call_required) {
          const toolCall = data.tool_call;
          const runId = toolCall.run_id;
          const toolCallId = toolCall.tool_call_id;
          if (toolCall.name === "handleUserDetails") {
            const details = toolCall.arguments.details;
            const runId = toolCall.run_id;
            const toolCallId = toolCall.tool_call_id;
            // Show a loading message for grants
            setMessages((prev) => [
              ...prev,
              {
                type: "text",
                role: "assistant",
                content: "Searching for matching grants...",
              },
            ]);
            setFetchingGrants(true);
            try {
              const response = await handleUserDetails(
                details.ecosystem,
                details.category,
                details.fundingType,
                details.fundingAmount,
                details.projectDescription
              );

              console.log("final response from print_details_on_console:", response);
              try {
                await fetch("/api/chat/toolOutput", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    thread_id: threadId,
                    tool_outputs: {
                      run_id: runId,
                      tool_call_id: toolCallId,
                      results: response,
                    },
                  }),
                });
              } catch (error) {
                console.error("error in submitting tool outputs:", error);
              }
              if (response && response.length > 0) {
                // filter grants based on similarity (less than 0.6)
                const filteredGrants = response.filter(
                  (grant) => grant.similarity >= 0.6
                );

                if (filteredGrants.length > 0) {
                  const formattedGrants = filteredGrants.map((grant) => ({
                    grantProgramName:
                      grant.original.grantProgramName || "Unknown Grant",
                    ecosystem: grant.original.ecosystem || "Various",
                    description:
                      grant.original.description || "No description available",
                    fundingType: grant.original.fundingType || "Not specified",
                    maxFunding: grant.original.maxFunding || "Not specified",
                    minFunding: grant.original.minFunding || "Not specified",
                    website: grant.original.website || "#",
                    status: grant.original.status || "Unknown",
                    fundingTopics: grant.original.fundingTopics || "Various",
                  }));

                  // Add response messages
                  setMessages((prev) => [
                    ...prev,
                    {
                      type: "text",
                      role: "assistant",
                      content: "Here are some grants that match your project:",
                    },
                    {
                      type: "grants",
                      role: "assistant",
                      grants: formattedGrants,
                    },
                    {
                      type: "text",
                      role: "assistant",
                      content:
                        "Let me know if you'd like more information about any of these grants, or if you want to refine your search.\n\nJust let me know!",
                    },
                    {
                      type: "text",
                      role: "assistant",
                      content:
                        "**Would you like a free 30-minute consultation with a Web3 grants expert from our team?**\n\n- **📅 Calendly:** [Schedule a meeting](https://calendly.com/cornarolabs)\n- **📧 Email:** marianna@cornarolabs.xyz\n\nLet me know if you need any further assistance!",
                    },
                  ]);
                } else {
                  setMessages((prev) => [
                    ...prev,
                    {
                      type: "text",
                      role: "assistant",
                      content:
                        "None of the grants scored highly enough in similarity. Try adjusting your project description for better matches.",
                    },
                  ]);
                }
              }
            } catch (err) {
              console.error("Error fetching grants:", err);
              setMessages((prev) => [
                ...prev,
                {
                  type: "text",
                  role: "assistant",
                  content:
                    "I encountered an error while searching for grants. Please try again with different criteria.",
                },
              ]);
            } finally {
              setFetchingGrants(false);
            }
          }
        } else {
          const formattedReply = data.reply.replace(/\n\n+/g, "\n\n").trim();
          setMessages((prev) => [
            ...prev,
            {
              type: "text",
              role: "assistant",
              content: formattedReply,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to parse JSON:", text);
        setMessages((prev) => [
          ...prev,
          {
            type: "text",
            role: "assistant",
            content: "Sorry, I encountered an error processing your request.",
          },
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        {
          type: "text",
          role: "assistant",
          content: "Sorry, I encountered an error connecting to the server.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#121C38] text-white p-6 rounded-xl shadow-lg border border-[#1F2A50] w-full lg:max-w-md text-center lg:text-left">
      <h2 className="text-xl font-bold text-[#EAEAEA]">
        AI Grant Matcher Tool
      </h2>
      <p className="text-sm text-[#A1B1E1] mt-2">
        Our AI assistant will match your project with the ideal grant
        opportunity.
      </p>
      {!isOpen && (
        <p className="mt-4 text-[#EAEAEA] bg-[#1A2B50] p-3 rounded-lg border border-[#253B6E]">
          Hello! I'm your AI grant matcher assistant. Enter your project details
          and I'll help you find the perfect grant opportunities.
        </p>
      )}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            onClick={() => setIsOpen(true)}
            className="w-full mt-4 bg-gradient-to-r from-[#253B6E] to-[#1A2B50] text-white flex items-center gap-2 border border-[#3D5A99] hover:bg-[#1A2B50] hover:border-[#58A6FF] transition-all"
          >
            Find Grants
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-[480px] p-0 bg-[#121C38] text-white border-l border-[#1F2A50] flex flex-col outline-none">
          <SheetTitle className="sr-only">Assistant</SheetTitle>
          <div className="p-4 flex justify-between items-center border-b border-[#1F2A50]">
            <h2 className="text-lg font-semibold text-[#EAEAEA]">
              <img src="/logo.png" className="w-44" alt="AI Grant Matcher" />
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
            {messages.map((msg, idx) => {
              if (msg.type === "grants") {
                return (
                  <div key={`grants-${idx}`} className="space-y-4 my-4">
                    {msg.grants.map((grant, i) => (
                      <div
                        key={`grant-${idx}-${i}`}
                        className="p-4 bg-[#1A2B50] border border-[#253B6E] rounded-lg shadow-sm text-[#EAEAEA] text-sm"
                      >
                        <h3 className="font-bold text-lg text-[#A1B1E1]">
                          {grant.grantProgramName}
                        </h3>
                        <div className="mt-2 space-y-1">
                          {grant.ecosystem !== "Various" && (
                            <p>
                              <strong className="text-[#A1B1E1]">
                                Ecosystem:
                              </strong>{" "}
                              {grant.ecosystem}
                            </p>
                          )}
                          {grant.fundingTopics &&
                            grant.fundingTopics !== "Various" && (
                              <p>
                                <strong className="text-[#A1B1E1]">
                                  Topics:
                                </strong>{" "}
                                {grant.fundingTopics}
                              </p>
                            )}
                          {grant.description &&
                            grant.description !==
                              "No description available" && (
                              <p>
                                <strong className="text-[#A1B1E1]">
                                  Description:
                                </strong>{" "}
                                {grant.description}
                              </p>
                            )}
                          {grant.fundingType &&
                            grant.fundingType !== "Not specified" && (
                              <p>
                                <strong className="text-[#A1B1E1]">
                                  Funding Type:
                                </strong>{" "}
                                {grant.fundingType}
                              </p>
                            )}
                          {(grant.minFunding !== "Not specified" ||
                            grant.maxFunding !== "Not specified") && (
                            <p className="flex flex-wrap gap-1">
                              <strong className="text-[#A1B1E1]">
                                Funding:
                              </strong>{" "}
                              {grant.minFunding !== "Not specified" ? (
                                <span>
                                  {grant.minFunding} - {grant.maxFunding}
                                </span>
                              ) : (
                                <span>Up to {grant.maxFunding}</span>
                              )}
                            </p>
                          )}
                          {grant.status && grant.status !== "Unknown" && (
                            <p>
                              <strong className="text-[#A1B1E1]">
                                Status:
                              </strong>{" "}
                              <span
                                className={`${
                                  grant.status === "Active"
                                    ? "text-green-400"
                                    : "text-yellow-400"
                                }`}
                              >
                                {grant.status}
                              </span>
                            </p>
                          )}
                          {grant.website && grant.website !== "#" && (
                            <a
                              href={grant.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#58A6FF] hover:text-[#A1B1E1] underline mt-2 inline-block"
                            >
                              Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div
                  key={`message-${idx}`}
                  className={`text-sm ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block px-3 py-2 rounded-xl shadow-lg prose prose-invert text-sm ${
                      msg.role === "user"
                        ? "bg-[#3D5A99] text-white rounded-tr-none"
                        : "bg-[#1A2B50] text-[#EAEAEA] rounded-tl-none"
                    }`}
                  >
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              );
            })}
            {(isLoading || fetchingGrants) && (
              <div className="text-left text-sm">
                <div className="inline-block px-3 py-4 rounded-xl shadow-lg bg-[#1A2B50] text-[#EAEAEA] rounded-tl-none animate-pulse">
                  {fetchingGrants ? (
                    <div className="flex flex-col gap-2">
                      <span className="flex items-center gap-2">
                        Searching for grants
                        <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce" />
                      </span>
                      <span className="text-xs text-[#A1B1E1]">
                        This may take a moment
                      </span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-[#EAEAEA] rounded-full animate-bounce" />
                    </span>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-[#1F2A50] flex gap-2">
            <Textarea
              className="flex-1 bg-[#1A2B50] text-[#EAEAEA] placeholder-[#5E739E] border border-[#253B6E] rounded-lg focus:ring-2 focus:ring-[#58A6FF] resize-none"
              placeholder="Tell me about your project..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleChat();
                }
              }}
              disabled={isLoading || fetchingGrants || !threadId}
            />
            <Button
              onClick={handleChat}
              disabled={
                isLoading || fetchingGrants || !prompt.trim() || !threadId
              }
              className="bg-[#3D5A99] text-white rounded-lg px-4 hover:bg-[#253B6E] transition-all [&_svg]:size-5 flex items-center justify-center"
            >
              {isLoading || fetchingGrants ? (
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
