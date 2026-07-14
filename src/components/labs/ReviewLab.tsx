import React, { useState } from 'react';
import axios from 'axios';
import { Play, Code, MessageSquare } from 'lucide-react';

export const ReviewLab: React.FC = () => {
  const [codeSnippet, setCodeSnippet] = useState<string>(
    "def calculate_average(numbers):\n    sum = 0\n    for n in numbers:\n        sum += n\n    return sum / len(numbers)"
  );
  const [isReviewing, setIsReviewing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'error' | 'success'} | null>(null);

  const handleReview = async () => {
    if (!codeSnippet.trim()) return;
    
    setIsReviewing(true);
    setResults(null);
    setToastMessage(null);
    
    try {
      const response = await axios.post('http://localhost:8005/review', {
        code_snippet: codeSnippet
      });
      setResults(response.data);
      setToastMessage({ title: 'Analysis Complete', message: 'Code review generated successfully.', type: 'success' });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Code review failed';
      setToastMessage({ title: 'Review Failed', message: errorMsg, type: 'error' });
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="h-full w-full p-6 bg-gray-50 dark:bg-gray-950 overflow-y-auto font-sans relative">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`absolute top-6 right-6 z-[100] flex items-start p-4 w-80 shadow-2xl rounded-xl border-l-4 animate-in slide-in-from-top-5 fade-in duration-300 
          ${toastMessage.type === 'error' ? 'bg-white dark:bg-gray-800 border-red-500 text-red-600' : 'bg-white dark:bg-gray-800 border-green-500 text-green-600'}`}>
          <div className="flex-1">
            <h3 className="font-bold text-sm">{toastMessage.title}</h3>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">{toastMessage.message}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">✖</button>
        </div>
      )}

      {/* GLOBAL LOADING OVERLAY */}
      {isReviewing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="flex flex-col items-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analyzing Code</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-[280px]">
              Running static analysis and LLM security checks.<br/><br/>
              <span className="font-semibold text-amber-600 dark:text-amber-500">Please do not refresh the page.</span>
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Code className="text-purple-500" />
          Review Lab
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Standalone laboratory for automated LLM-based code reviews and static analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-[550px]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Target Code</h3>
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            className="flex-1 w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] border border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono"
            placeholder="Paste code here..."
            spellCheck="false"
          />
          <button
            onClick={handleReview}
            disabled={isReviewing || !codeSnippet}
            className={`mt-4 w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex justify-center items-center gap-2
              ${(isReviewing || !codeSnippet) ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}`}
          >
            <span className="flex items-center gap-2"><Play size={16} /> Run Code Review</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-[550px] relative">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <MessageSquare className="text-purple-500" /> LLM Feedback
          </h3>

          {!results && !isReviewing && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <MessageSquare size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Submit code to generate security and performance insights.</p>
            </div>
          )}

          {results && !isReviewing && (
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-5 rounded-xl border border-gray-200 dark:border-gray-800 overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap leading-relaxed">
                {typeof results === 'string' ? results : JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};