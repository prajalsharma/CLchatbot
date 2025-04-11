"use client";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { RotateCcw, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { print_details_on_console } from "./chatBotUtils/utils";

const url = process.env.NEXT_PUBLIC_VITE_URL;

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
      }[];
    };

export default function ChatbotContainer() {
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasShownGreeting, setHasShownGreeting] = useState<boolean>(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // THIS PART

  // useEffect(() => {
  //   const initThread = async () => {
  //     try {
  //       const res = await fetch(`${url}/api/chat/thread`, {
  //         method: "POST",
  //       });
  //       const data: { threadId: string } = await res.json();
  //       console.log("threadId:", data.threadId);
  //       setThreadId(data.threadId);
  //     } catch (err) {
  //       console.error("Failed to create thread:", err);
  //     }
  //   };

  //   initThread();
  // }, []);

  useEffect(() => {
    if (isOpen && !hasShownGreeting && threadId) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm your AI grant matcher assistant. I'll help you find the perfect grant opportunities for your project. Tell me about your project, and I'll suggest some grants that might be a good fit.",
          type: "text",
        },
      ]);
      setHasShownGreeting(true);
    }
  }, [isOpen, hasShownGreeting, threadId]);

  const handleSendMessage = async () => {
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
      const res = await fetch(`${url}/api/chat/message`, {
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
        console.log("Parsed data:", data);

        if (data.tool_call_required) {
          const toolCall = data.tool_call;
          console.log("Tool call from Assistant:", toolCall);

          if (toolCall.name === "print_details_on_console") {
            const details = toolCall.arguments.details;

            const response = await print_details_on_console(
              details.ecosystem,
              details.category,
              details.fundingType,
              details.fundingAmount,
              details.projectDescription
            );

            console.log("final response from print_details_on_console:", response);

            //  GETTING ERROR FOR THIS

            // setMessages((prev) => [
            //     ...prev,
            //     {
            //         type: "grants",
            //         role: "assistant",
            //         grants: response,
            //     },
            // ]);

            if (response && response.length > 0) {
              setMessages((prev) => [
                ...prev,
                {
                  type: "text",
                  role: "assistant",
                  content:
                    "Here are some grants that match your project. Let me know if you'd like more information about any of them, or if you want to refine your search.",
                },
              ]);
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  type: "text",
                  role: "assistant",
                  content:
                    "I couldn't find any grants matching your criteria. Let's try refining your search. Could you provide more details about your project?",
                },
              ]);
            }
          }
        } else {
          console.log("Assistant Reply:", data.reply);

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
      <h2 className="text-xl font-bold text-[#EAEAEA]">AI Grant Matcher Tool</h2>
      <p className="text-sm text-[#A1B1E1] mt-2">
        Our AI assistant will match your project with the ideal grant opportunity.
      </p>

      {!isOpen && (
        <p className="mt-4 text-[#EAEAEA] bg-[#1A2B50] p-3 rounded-lg border border-[#253B6E]">
          Hello! I'm your AI grant matcher assistant. Enter your project details and I'll help you
          find the perfect grant opportunities.
        </p>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            onClick={() => setIsOpen(true)}
            className="w-full mt-4 bg-gradient-to-r from-[#253B6E] to-[#1A2B50] text-white flex items-center gap-2 border border-[#3D5A99] hover:bg-[#1A2B50] hover:border-[#58A6FF] transition-all">
            Find Grants
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-[480px] p-0 bg-[#121C38] text-white border-l border-[#1F2A50] flex flex-col">
          <div className="p-4 flex justify-between items-center border-b border-[#1F2A50]">
            <h2 className="text-lg font-semibold text-[#EAEAEA]">
              <img src="/logo.png" className="w-44" alt="AI Grant Matcher" />
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
            {messages.map((msg, idx) => {
              if (msg.type === "grants") {
                return msg.grants.map((grant, i) => (
                  <div
                    key={`${idx}-${i}`}
                    className="p-4 bg-[#1A2B50] border border-[#253B6E] rounded-lg shadow-sm text-[#EAEAEA] my-3">
                    <h3 className="font-bold text-lg text-[#A1B1E1]">{grant.grantProgramName}</h3>
                    <p className="mt-2">
                      <strong className="text-[#A1B1E1]">Ecosystem:</strong> {grant.ecosystem}
                    </p>
                    <p>
                      <strong className="text-[#A1B1E1]">Description:</strong> {grant.description}
                    </p>
                    <p>
                      <strong className="text-[#A1B1E1]">Funding Type:</strong> {grant.fundingType}
                    </p>
                    <p>
                      <strong className="text-[#A1B1E1]">Max Funding:</strong> {grant.maxFunding}
                    </p>
                    <a
                      href={grant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#58A6FF] hover:text-[#A1B1E1] underline mt-2 inline-block">
                      Website
                    </a>
                  </div>
                ));
              }

              return (
                <div
                  key={idx}
                  className={`text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block px-3 py-2 rounded-xl shadow-lg ${
                      msg.role === "user"
                        ? "bg-[#3D5A99] text-white rounded-tr-none"
                        : "bg-[#1A2B50] text-[#EAEAEA] rounded-tl-none"
                    }`}>
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
              placeholder="Tell me about your project..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading || !threadId}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !prompt.trim() || !threadId}
              className="bg-[#3D5A99] text-white rounded-lg px-4 hover:bg-[#253B6E] transition-all [&_svg]:size-5 flex items-center justify-center">
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
