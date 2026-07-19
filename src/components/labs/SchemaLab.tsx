import React, { useState } from 'react';
import axios from 'axios';
import { Play, Database, FileJson, AlertCircle } from 'lucide-react';
import { SCHEMA_LAB_URL } from '../../lib/config';

export const SchemaLab: React.FC = () => {
  const [rawText, setRawText] = useState<string>(
    "John Doe\nSenior Software Engineer\n5 years of experience building Python backends and React frontends.\nSkills: Python, TypeScript, Docker, Kubernetes."
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    
    setIsExtracting(true);
    setError(null);
    setResults(null);
    
    try {
      // Direct call to the standalone Schema API on port 8004
      const response = await axios.post(`${SCHEMA_LAB_URL}/extract`, {
        raw_text: rawText
      });
      setResults(response.data.extracted_data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="h-full w-full p-6 bg-gray-50 dark:bg-gray-950 overflow-y-auto font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="text-blue-500" />
          Schema Lab
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Standalone laboratory for testing LLM structured data extraction and Pydantic validation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Panel */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-[500px]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Input: Raw Unstructured Text</h3>
          
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="flex-1 w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            placeholder="Paste raw text here (e.g., CV content, invoice text)..."
          />

          <button
            onClick={handleExtract}
            disabled={isExtracting || !rawText}
            className={`mt-4 w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex justify-center items-center gap-2
              ${(isExtracting || !rawText) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
          >
            {isExtracting ? (
              <span className="animate-pulse flex items-center gap-2"><Play size={16} /> Extracting...</span>
            ) : (
              <span className="flex items-center gap-2"><Play size={16} /> Enforce Schema</span>
            )}
          </button>
        </div>

        {/* Right Column: Output Panel */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-[500px]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <FileJson className="text-green-500" /> Validated JSON Output
          </h3>

          {error && (
            <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!results && !error && !isExtracting && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <FileJson size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Awaiting execution. Results will strictly follow the Pydantic schema.</p>
            </div>
          )}

          {isExtracting && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-blue-500 animate-pulse font-medium">Parsing and validating schema...</div>
              <p className="text-xs text-amber-600 dark:text-amber-500 text-center max-w-xs">
                First run may take longer while the local model warms up.
                Please do not refresh the page.
              </p>
            </div>
          )}

          {results && !isExtracting && (
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
              <pre className="text-sm text-green-600 dark:text-green-400 font-mono">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};