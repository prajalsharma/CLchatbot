import React, { useState, useEffect, useRef } from 'react';
import { matchGrants, getChatGPTExplanation } from '@/utils/grantmatcher';

export default function ChatbotContainer() {
  const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID();
  localStorage.setItem('sessionId', sessionId);

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const userMessage = {
      role: 'user',
      content: prompt.trim(),
      type: 'text',
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      let matchedGrants = [];
      // 👇 Only run matchGrants if we are *not* mid-questionnaire
      const isGrantQuery = /grant|fund|apply|zk|ecosystem|project/i.test(prompt.toLowerCase());

      // Detect if we're mid-questionnaire based on assistant messages asking questions
      const isQuestionnaireRunning = messages.some(
        (m) =>
          m.role === 'assistant' &&
          /(could you|may I know|what(?:'s| is) your name|project|ecosystem|stage|category|funding|notes)/i.test(m.content)
      );
      
      const isQuestionnaireComplete = messages.some(
        (m) =>
          m.role === 'assistant' &&
          /here are some grants|matching grants for|no perfect matches|summarize the answers/i.test(m.content)
      );
      
      // 🧠 Only run grant matching if we're NOT in questionnaire and it's not running
      if (isGrantQuery && !isQuestionnaireRunning && isQuestionnaireComplete) {
        matchedGrants = await matchGrants(prompt);
      }


      const { reply } = await getChatGPTExplanation(sessionId, prompt, matchedGrants);

      // If grant-related and actual matches were found, render grant cards
      if (isGrantQuery && matchedGrants?.length) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', type: 'grants', grants: matchedGrants },
        ]);
      }

      // Always show text reply from assistant
      if (reply && typeof reply === 'string' && reply.trim() !== '') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply.trim(), type: 'text' },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong with GPT.',
          type: 'text',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 💬 Fixed Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        💬 Ask about grants
      </button>

      {/* 🪟 Sliding Chat Panel */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col z-50 border-l border-gray-300">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="font-bold text-lg text-[#00457C]">Grants Chatbot</div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-black text-xl"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => {
              if (msg.type === 'grants') {
                return msg.grants.map((grant, i) => (
                  <div
                    key={`${idx}-${i}`}
                    className="p-4 bg-white border rounded shadow-sm"
                  >
                    <h3 className="font-bold text-lg">
                      {grant.grantProgramName}
                    </h3>
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

              return (
                <div
                  key={idx}
                  className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block px-3 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white flex gap-2">
            <input
              type="text"
              className="flex-1 border px-4 py-2 rounded"
              placeholder="Ask about grants..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
