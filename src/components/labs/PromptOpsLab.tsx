import React, { useState } from 'react';
import axios from 'axios';
import { Play, Settings2, FileText, Download } from 'lucide-react';
import { PROMPTOPS_LAB_URL } from '../../lib/config';

export const PromptOpsLab: React.FC = () => {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPrompt, setSelectedPrompt] = useState('v1');
  const [selectedModel, setSelectedModel] = useState('phi3:latest');

  const [customLabel, setCustomLabel] = useState('v3');
  const [customTemplate, setCustomTemplate] = useState(
    'You are a helpful customer support assistant.\nUse the following context to answer the question.\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:'
  );
  const [loadSource, setLoadSource] = useState('v1');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'error' | 'success'} | null>(null);

  const models = ['phi3:latest', 'qwen2.5:3b', 'llama3:8b'];

  const customTemplateHasPlaceholders =
    customTemplate.includes('{context}') && customTemplate.includes('{question}');
  const canRun =
    mode === 'preset' ||
    (customLabel.trim().length > 0 && customTemplateHasPlaceholders);

  const handleLoadTemplate = async () => {
    setIsLoadingTemplate(true);
    try {
      const response = await axios.get(`${PROMPTOPS_LAB_URL}/prompts/${loadSource}`);
      setCustomTemplate(response.data.template);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Could not load template';
      setToastMessage({ title: 'Load Failed', message: errorMsg, type: 'error' });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleEvaluate = async () => {
    if (!canRun) return;
    setIsEvaluating(true);
    setResults(null);
    setToastMessage(null);

    const promptVersion = mode === 'preset' ? selectedPrompt : customLabel.trim();

    try {
      const response = await axios.post(`${PROMPTOPS_LAB_URL}/evaluate`, {
        prompt_version: promptVersion,
        model: selectedModel, // Ready for when backend supports model switching
        ...(mode === 'custom' ? { custom_template: customTemplate } : {}),
      });
      setResults(response.data.results);

      setToastMessage({ title: 'Evaluation Complete', message: `Prompt version ${promptVersion} evaluated successfully.`, type: 'success' });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Evaluation failed';
      setToastMessage({ title: 'Execution Failed', message: errorMsg, type: 'error' });
    } finally {
      setIsEvaluating(false);
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
      {isEvaluating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="flex flex-col items-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Evaluating Prompt</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-[280px]">
              Running regression tests on prompt logic.<br/><br/>
              <span className="font-semibold text-amber-600 dark:text-amber-500">Please do not refresh the page.</span>
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings2 className="text-blue-500" />
          PromptOps Lab
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Standalone laboratory for A/B testing and evaluating prompt versions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt Source</label>
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden text-sm">
                  <button
                    onClick={() => setMode('preset')}
                    className={`flex-1 py-1.5 font-medium transition-colors ${mode === 'preset' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                  >
                    Existing version
                  </button>
                  <button
                    onClick={() => setMode('custom')}
                    className={`flex-1 py-1.5 font-medium transition-colors ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                  >
                    Write / edit
                  </button>
                </div>
              </div>

              {mode === 'preset' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt Version</label>
                  <select 
                    value={selectedPrompt}
                    onChange={(e) => setSelectedPrompt(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  >
                    <option value="v1">v1 (Zero-shot)</option>
                    <option value="v2">v2 (Few-shot)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version Label</label>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="e.g. v3, experiment-a"
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start from</label>
                      <select
                        value={loadSource}
                        onChange={(e) => setLoadSource(e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white outline-none"
                      >
                        <option value="v1">v1 (Zero-shot)</option>
                        <option value="v2">v2 (Few-shot)</option>
                      </select>
                    </div>
                    <button
                      onClick={handleLoadTemplate}
                      disabled={isLoadingTemplate}
                      className="mb-0.5 flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      <Download size={14} /> {isLoadingTemplate ? 'Loading...' : 'Load'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
                    <textarea
                      value={customTemplate}
                      onChange={(e) => setCustomTemplate(e.target.value)}
                      rows={8}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white font-mono resize-y focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    />
                    {!customTemplateHasPlaceholders && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Template must include both <code>{'{context}'}</code> and <code>{'{question}'}</code>.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Model (Ollama)</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                >
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating || !canRun}
                className={`w-full py-3 mt-2 rounded-xl font-bold text-white shadow-md transition-all flex justify-center items-center gap-2
                  ${(isEvaluating || !canRun) ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
              >
                <span className="flex items-center gap-2"><Play size={16} /> Run Evaluation</span>
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 min-h-[400px] flex flex-col relative">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <FileText className="text-blue-500" /> Evaluation Results
            </h3>

            {!results && !isEvaluating && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <FileText size={48} className="mb-4 opacity-30" />
                <p className="text-sm">Select a configuration and click Run Evaluation to view metrics.</p>
              </div>
            )}

            {results && !isEvaluating && (
              <div className="flex-1 flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase">Avg Faithfulness</p>
                    <p className="text-3xl text-green-700 dark:text-green-300 font-mono mt-1">
                      {results.avg_faithfulness !== undefined ? results.avg_faithfulness.toFixed(2) : '-'}
                    </p>
                  </div>
                  <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">Avg Relevance</p>
                    <p className="text-3xl text-blue-700 dark:text-blue-300 font-mono mt-1">
                      {results.avg_relevance !== undefined ? results.avg_relevance.toFixed(2) : '-'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 p-5 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase">Raw Output Payload</p>
                  <pre className="text-xs text-gray-800 dark:text-gray-300 overflow-x-auto font-mono">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};