import React, { useState, useEffect, useRef } from "react";
import { matchGrants, getChatGPTExplanation } from "@/utils/grantmatcher";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { RotateCcw, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

export default function ChatbotContainer() {
  const sessionId = localStorage.getItem("sessionId") || crypto.randomUUID();
  localStorage.setItem("sessionId", sessionId);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const userMessage = {
      role: "user",
      content: prompt.trim(),
      type: "text",
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      let matchedGrants = [];
      const isGrantQuery = /grant|fund|apply|zk|ecosystem|project|socialfi|ai/i.test(
        prompt.toLowerCase()
      );

      const isQuestionnaireRunning = messages.some(
        (m) =>
          m.role === "assistant" &&
          /(could you|may I know|what(?:'s| is) your name|project|ecosystem|stage|category|funding|notes)/i.test(
            m.content
          )
      );

      const isQuestionnaireComplete = messages.some(
        (m) =>
          m.role === "assistant" &&
          /here are some grants|matching grants for|no perfect matches|summarize the answers/i.test(
            m.content
          )
      );

      // 🧠 Only run grant matching if we're NOT in questionnaire and it's not running

      if (isGrantQuery && !isQuestionnaireRunning && isQuestionnaireComplete) {
        matchedGrants = await matchGrants(prompt);
      }

      const { reply } = await getChatGPTExplanation(sessionId, prompt, matchedGrants);

      if (isGrantQuery && matchedGrants?.length) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "grants", grants: matchedGrants },
        ]);
      } else if (reply && typeof reply === "string" && reply.trim() !== "") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply.trim(), type: "text" },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong with GPT.",
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#121C38] text-white p-6 rounded-xl shadow-lg border border-[#1F2A50] w-full lg:max-w-sm lg:sticky lg:top-20">
      <h2 className="text-xl font-bold text-[#EAEAEA]">AI Grant Matcher Tool</h2>
      <p className="text-sm text-[#A1B1E1] mt-2">
        Our AI assistant will match your project with the ideal grant opportunity.
      </p>

      <Textarea
        className="mt-4 bg-[#1A2B50] text-[#EAEAEA] placeholder-[#5E739E] border border-[#253B6E] rounded-lg focus:ring-2 focus:ring-[#58A6FF] resize-none h-24"
        placeholder="Describe your project..."
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
            className="w-full mt-4 bg-gradient-to-r from-[#253B6E] to-[#1A2B50] text-white flex items-center gap-2 border border-[#3D5A99] hover:bg-[#1A2B50] hover:border-[#58A6FF] transition-all">
            Find Grants
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
                return msg.grants.map((grant, i) => (
                  <div key={`${idx}-${i}`} className="p-4 bg-white border rounded shadow-sm">
                    <h3 className="font-bold text-lg">{grant.grantProgramName}</h3>
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
                      className="text-blue-600 underline">
                      Website
                    </a>
                  </div>
                ));
              }

              if (msg.type === "text") {
                const structuredGrants = msg.content
                  ?.split(/\n+/)
                  .map((line) => {
                    const match = line.match(
                      /\*\*(.*?) Grants?\*\*.*?- Website:.*?\((https?:\/\/.*?)\)/
                    );
                    if (!match) return null;
                    return {
                      grantProgramName: match[1].trim(),
                      description: line.replace(/\*\*.*?\*\*.*?- Website:.*/, "").trim(),
                      website: match[2].trim(),
                    };
                  })
                  .filter(Boolean);

                if (structuredGrants.length > 0) {
                  return structuredGrants.map((grant, i) => (
                    <div key={`${idx}-${i}`} className="p-4 bg-white border rounded shadow-sm">
                      <h3 className="font-bold text-lg">{grant.grantProgramName}</h3>
                      <p>
                        <strong>Description:</strong> {grant.description}
                      </p>
                      <a
                        href={grant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline">
                        Website
                      </a>
                    </div>
                  ));
                }

                const hasPriorGrants = messages.some((m, i) => i < idx && m.type === "grants");

                if (hasPriorGrants) return null;

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
              }
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
              placeholder="Ask about grants..."
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
              className="bg-[#3D5A99] text-white rounded-lg px-4 hover:bg-white hover:text-[#3D5A99] transition-all
              [&_svg]:size-5 flex items-center justify-center">
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
