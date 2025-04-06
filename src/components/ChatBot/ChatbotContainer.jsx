import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { initModel, matchGrants, getChatGPTExplanation } from "@/utils/grantMatcher";
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog';

export default function ChatbotContainer() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey there! Need help? Just type your request." },
  ]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    console.log("🟡 User Prompt:", prompt);
    const userMessage = { role: "user", text: prompt };
    setMessages([...messages, userMessage]);
    setPrompt("");

    try {
      await initModel();
      const topGrants = await matchGrants(prompt);
      const reply = await getChatGPTExplanation(prompt, topGrants);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (error) {
      console.error("❌ Error in grant matching or GPT:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    }
  };

  return (
    <div className="bg-[#121C38] text-white p-6 rounded-xl shadow-lg border border-[#1F2A50] w-full lg:max-w-sm mx-auto my-7">
      <h2 className="text-xl font-bold text-[#EAEAEA]">AI Grant Matcher Tool</h2>
      <p className="text-sm text-[#A1B1E1] mt-2">
        Our AI assistant will match your project with the ideal grant opportunity.
      </p>

      <Textarea
        className="mt-4 bg-[#1A2B50] text-[#EAEAEA] placeholder-[#5E739E] border border-[#253B6E] rounded-lg focus:ring-2 focus:ring-[#58A6FF] resize-none h-24"
        placeholder="Describe your project..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <Sheet>
        <SheetTrigger asChild>
          <Button className="w-full mt-4 bg-gradient-to-r from-[#253B6E] to-[#1A2B50] text-white flex items-center gap-2 border border-[#3D5A99] hover:bg-[#1A2B50] hover:border-[#58A6FF] transition-all">
            Find Grants
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-[480px] p-0 bg-[#121C38] text-white border-l border-[#1F2A50] flex flex-col">
          <div className="p-4 flex flex-col gap-1 border-b border-[#1F2A50]">
            <DialogTitle asChild>
              <h2 className="text-lg font-semibold text-[#EAEAEA]">
                <img src="./logo.png" className="w-44" alt="Cornaro Labs" />
              </h2>
            </DialogTitle>
            <DialogDescription>
              Describe your project to get matched with relevant grants.
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`p-3 max-w-[80%] rounded-xl shadow-lg ${
                    msg.role === "user"
                      ? "bg-[#3D5A99] text-white rounded-tr-none"
                      : "bg-[#1A2B50] text-[#EAEAEA] rounded-tl-none"
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#1F2A50] flex gap-2">
            <Textarea
              className="flex-1 bg-[#1A2B50] text-[#EAEAEA] placeholder-[#5E739E] border border-[#253B6E] rounded-lg focus:ring-2 focus:ring-[#58A6FF] resize-none h-12"
              placeholder="Type here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button
              onClick={handleSend}
              className="bg-[#3D5A99] text-white rounded-lg px-4 hover:bg-white hover:text-[#3D5A99] transition-all [&_svg]:size-5 flex items-center justify-center">
              <Send />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
