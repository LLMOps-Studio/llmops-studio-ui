import React, { useState } from 'react';
import axios from 'axios';
import { Send, BrainCircuit, User, Bot, AlertCircle } from 'lucide-react';
import { MEMORY_LAB_URL } from '../../lib/config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const MemoryLab: React.FC = () => {
  const [sessionId] = useState(`session_${Math.floor(Math.random() * 10000)}`);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: 'user', content: input };
    const currentHistory = [...messages];
    
    setMessages([...currentHistory, userMessage]);
    setInput('');
    setIsSending(true);
    setError(null);
    
    try {
      const response = await axios.post(`${MEMORY_LAB_URL}/chat`, {
        session_id: sessionId,
        message: userMessage.content,
        history: currentHistory
      });
      
      const botMessage: Message = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Chat failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full w-full p-6 bg-gray-50 dark:bg-gray-950 flex flex-col font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BrainCircuit className="text-blue-500" />
          Memory Lab
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Standalone laboratory for evaluating context window limits and RAG conversational memory.
        </p>
        <p className="text-xs text-gray-400 mt-1">Session ID: {sessionId}</p>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[400px]">
        {/* Chat History Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <BrainCircuit size={48} className="mb-4 opacity-30" />
              <p>Start chatting to test the LLM's memory retention.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs p-3 rounded-lg rounded-tl-none animate-pulse max-w-[80%]">
                Thinking... <span className="text-amber-600 dark:text-amber-500">(first message may take longer while the model warms up)</span>
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message to test memory..."
              className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !input.trim()}
              className={`px-5 rounded-lg font-bold text-white transition-all flex items-center gap-2
                ${(isSending || !input.trim()) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};