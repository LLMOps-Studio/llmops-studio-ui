import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Database, UploadCloud, BarChart2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface DatasetItem {
  query: string;
  expected_output: string;
}

export const BatchEvalLab: React.FC = () => {
  const [rawText, setRawText] = useState<string>(
    "Market data indicates a sudden spike in trading volume coupled with a 5% price surge over the last 4 hours. Historically, this aligns with the P_8_V_9 neuro-symbolic token, indicating strong bullish momentum."
  );
  
  const [dataset, setDataset] = useState<DatasetItem[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [availableModels, setAvailableModels] = useState<string[]>(['phi3:latest']);
  const [selectedModel, setSelectedModel] = useState<string>('phi3:latest');
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'error' | 'success'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Discovery: Fetch available Ollama models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/models');
        if (response.data.models && response.data.models.length > 0) {
          setAvailableModels(response.data.models);
          setSelectedModel(response.data.models[0]);
        }
      } catch (err) {
        console.warn("Auto-discovery failed, utilizing fallback models.", err);
      }
    };
    fetchModels();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (Array.isArray(parsed) && parsed.every(item => 'query' in item && 'expected_output' in item)) {
          setDataset(parsed);
          setToastMessage({ title: 'Dataset Loaded', message: `Successfully parsed ${parsed.length} items.`, type: 'success' });
          setTimeout(() => setToastMessage(null), 3000);
        } else {
          throw new Error("Invalid schema. Ensure JSON is an array of { query, expected_output } objects.");
        }
      } catch (error: any) {
        setDataset([]);
        setFileName(null);
        setToastMessage({ title: 'Parsing Error', message: error.message || 'Failed to parse JSON dataset.', type: 'error' });
      }
    };
    
    reader.readAsText(file);
  };

  const handleRunBatchEvaluation = async () => {
    if (dataset.length === 0) {
      setToastMessage({ title: 'Validation Error', message: 'Please upload a valid Golden Dataset first.', type: 'error' });
      return;
    }

    setIsEvaluating(true);
    setResults(null);
    setToastMessage(null);

    try {
      const payload = {
        experiment_name: "finwise_golden_dataset_eval",
        raw_text: rawText,
        dataset: dataset,
        model: selectedModel,
        chunk_size: 300,
        chunk_overlap: 30
      };

      const response = await axios.post('http://localhost:8002/batch-evaluate', payload);
      setResults(response.data);
      
      setToastMessage({ title: 'Batch Evaluation Complete', message: 'Regression test executed successfully.', type: 'success' });
      setTimeout(() => setToastMessage(null), 4000);

    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Batch execution failed';
      setToastMessage({ title: 'Execution Failed', message: errorMsg, type: 'error' });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExportCsv = () => {
    if (!results) return;
    const header = ['index', 'query', 'expected', 'actual', 'format_valid'];
    const rows = results.detailed_results.map((item: any, idx: number) => [
      idx,
      JSON.stringify(item.query ?? ''),
      JSON.stringify(item.expected ?? ''),
      JSON.stringify(item.actual ?? ''),
      item.format_valid
    ].join(','));
    const summary = [
      `# strict_accuracy_percentage,${results.metrics.strict_accuracy_percentage}`,
      `# format_penalty_percentage,${results.metrics.format_penalty_percentage}`,
      `# format_violations,${results.metrics.format_violations}`,
      `# total_tested,${results.metrics.total_tested}`,
    ];
    const csv = [...summary, header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_eval_${selectedModel.replace(/[:/]/g, '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Executing Batch Regression</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-[280px]">
              Evaluating {dataset.length} items against the knowledge base to determine Format Penalty.<br/><br/>
              <span className="font-semibold text-amber-600 dark:text-amber-500">Please do not refresh the page.</span>
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="text-emerald-500" />
          Batch Evaluation Lab
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Determine LLM Catastrophic Forgetting and Strict Format Adherence (Label Contracts) using a Golden Dataset.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: CONFIGURATION */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Test Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Model (Ollama)</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                >
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Knowledge Base Context</label>
                <textarea 
                  value={rawText} 
                  onChange={(e) => setRawText(e.target.value)} 
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white h-32 resize-none focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" 
                  placeholder="Enter the reference text here..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Golden Dataset (JSON Array)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${fileName ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <UploadCloud className={`mb-2 ${fileName ? 'text-emerald-500' : 'text-gray-400'}`} size={32} />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {fileName ? fileName : 'Click to upload dataset (.json)'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">{'Requires: [{ "query": "...", "expected_output": "..." }]'}</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                </div>
              </div>

              <button
                onClick={handleRunBatchEvaluation}
                disabled={isEvaluating || dataset.length === 0}
                className={`w-full py-3 mt-4 rounded-xl font-bold text-white shadow-md transition-all flex justify-center items-center gap-2
                  ${(isEvaluating || dataset.length === 0) ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}
              >
                <span className="flex items-center gap-2"><Play size={16} /> Execute Batch Regression</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 min-h-[600px] flex flex-col relative">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><BarChart2 className="text-emerald-500" /> Evaluation Telemetry</span>
              {results && (
                <button
                  onClick={handleExportCsv}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Export CSV
                </button>
              )}
            </h3>

            {!results && !isEvaluating && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <Database size={48} className="mb-4 opacity-30" />
                <p className="text-sm">Upload a dataset and execute the pipeline to generate telemetry.</p>
              </div>
            )}

            {results && !isEvaluating && (
              <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
                
                {/* METRICS CARDS */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col justify-center">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Strict Accuracy</p>
                    <div className="flex items-end gap-2 mt-1">
                      <p className="text-4xl text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                        {results.metrics.strict_accuracy_percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex flex-col justify-center">
                    <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Format Penalty</p>
                    <div className="flex items-end gap-2 mt-1">
                      <p className="text-4xl text-red-700 dark:text-red-300 font-mono font-bold">
                        {results.metrics.format_penalty_percentage.toFixed(1)}%
                      </p>
                      <p className="text-sm text-red-500 font-semibold mb-1">
                        ({results.metrics.format_violations} violations)
                      </p>
                    </div>
                  </div>
                </div>

                {/* DETAILED RESULTS TABLE */}
                <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Trajectory Logs ({results.metrics.total_tested} items)</span>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-0">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 sticky top-0 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-gray-800">Expected Contract</th>
                          <th className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-gray-800">LLM Generation</th>
                          <th className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-gray-800 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {results.detailed_results.map((item: any, idx: number) => (
                          <tr key={idx} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 max-w-[150px] truncate" title={item.expected}>
                              {item.expected}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[250px] truncate" title={item.actual}>
                              {item.actual}
                            </td>
                            <td className="px-4 py-3 flex justify-center">
                              {item.format_valid ? (
                                <CheckCircle className="text-emerald-500" size={18} />
                              ) : (
                                <XCircle className="text-red-500" size={18} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};