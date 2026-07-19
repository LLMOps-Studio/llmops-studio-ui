import React, { useState } from 'react';
import axios from 'axios';
import { Play, FileSearch, BarChart2 } from 'lucide-react';
import { RAG_LAB_URL } from '../../lib/config';

export const RAGBenchmarkLab: React.FC = () => {
  const [experimentName, setExperimentName] = useState('rag_test_01');
  const [rawText, setRawText] = useState('Apache Kafka is an open-source distributed event streaming platform used by thousands of companies for high-performance data pipelines, streaming analytics, data integration, and mission-critical applications.');
  const [testQueries, setTestQueries] = useState('What is Apache Kafka used for?');
  const [chunkSizes, setChunkSizes] = useState('100, 200');
  const [chunkOverlaps, setChunkOverlaps] = useState('10, 20');
  
  // Yerel Ollama modelleri
  const availableModels = ['phi3:latest', 'qwen2.5:3b', 'llama3:8b'];
  const [selectedModels, setSelectedModels] = useState<string[]>(['phi3:latest']);

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // Custom Toast State for Error/Success handling 
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'error' | 'success'} | null>(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setResults(null);
    setToastMessage(null);

    try {
      const payload = {
        experiment_name: experimentName,
        raw_text: rawText,
        test_queries: testQueries.split('\n').filter(q => q.trim() !== ''),
        chunk_sizes: chunkSizes.split(',').map(s => parseInt(s.trim())),
        chunk_overlaps: chunkOverlaps.split(',').map(s => parseInt(s.trim())),
        models: selectedModels
      };

      // 8002 portundaki gerçek RAG Benchmark API'sine istek atıyoruz
      const response = await axios.post(`${RAG_LAB_URL}/benchmark`, payload);
      setResults(response.data.results);
      
      setToastMessage({ title: 'Benchmark Complete', message: 'RAG grid search evaluated successfully.', type: 'success' });
      // Auto-dismiss success toast
      setTimeout(() => setToastMessage(null), 4000);

    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Benchmark execution failed';
      setToastMessage({ title: 'Execution Failed', message: errorMsg, type: 'error' });
    } finally {
      setIsRunning(false);
    }
  };

  const toggleModel = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const handleExportCsv = () => {
    if (!results) return;
    const header = ['run_name', 'chunk_size', 'chunk_overlap', 'model', 'avg_latency_ms', 'avg_faithfulness', 'avg_relevance', 'vram_mb'];
    const rows = results.map((run: any) => [
      run.run_name, run.chunk_size, run.chunk_overlap, run.model,
      run.avg_latency, run.avg_faithfulness, run.avg_relevance, run.vram_mb
    ].join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag_benchmark_${experimentName}_${Date.now()}.csv`;
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
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            ✖
          </button>
        </div>
      )}

      {/* GLOBAL LOADING OVERLAY */}
      {isRunning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="flex flex-col items-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Executing Grid Search</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-[280px]">
              Processing chunks and evaluating RAG performance. This may take a while depending on the grid size.<br/><br/>
              <span className="font-semibold text-amber-600 dark:text-amber-500">Please do not refresh the page.</span>
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileSearch className="text-blue-500" />
          RAG Benchmark Lab
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Standalone laboratory for grid testing chunking strategies and LLM models for Retrieval-Augmented Generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Sütun: Konfigürasyon */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Grid Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Experiment Name</label>
                <input type="text" value={experimentName} onChange={(e) => setExperimentName(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Raw Text (Knowledge Base)</label>
                <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Test Queries (One per line)</label>
                <textarea value={testQueries} onChange={(e) => setTestQueries(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white h-16 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chunk Sizes</label>
                  <input type="text" value={chunkSizes} onChange={(e) => setChunkSizes(e.target.value)} placeholder="100, 200" className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Overlaps</label>
                  <input type="text" value={chunkOverlaps} onChange={(e) => setChunkOverlaps(e.target.value)} placeholder="10, 20" className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Target Models</label>
                <div className="flex flex-wrap gap-2">
                  {availableModels.map(model => (
                    <label key={model} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg cursor-pointer border border-transparent hover:border-gray-300 transition-colors">
                      <input type="checkbox" checked={selectedModels.includes(model)} onChange={() => toggleModel(model)} className="rounded text-blue-600 focus:ring-blue-500" />
                      {model}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRunBenchmark}
                disabled={isRunning || selectedModels.length === 0}
                className={`w-full py-3 mt-2 rounded-xl font-bold text-white shadow-md transition-all flex justify-center items-center gap-2
                  ${(isRunning || selectedModels.length === 0) ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
              >
                <span className="flex items-center gap-2"><Play size={16} /> Run Benchmark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Sonuçlar */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 min-h-[500px] flex flex-col relative">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><BarChart2 className="text-green-500" /> Execution Results</span>
              {results && (
                <button
                  onClick={handleExportCsv}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Export CSV
                </button>
              )}
            </h3>

            {!results && !isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <BarChart2 size={48} className="mb-4 opacity-30" />
                <p className="text-sm">Configure parameters and run the benchmark to see results.</p>
              </div>
            )}

            {results && !isRunning && (
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-5 rounded-xl border border-gray-200 dark:border-gray-700 overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-800 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Run Name</th>
                        <th className="px-4 py-3">Avg Faithfulness</th>
                        <th className="px-4 py-3">Avg Relevance</th>
                        <th className="px-4 py-3 rounded-tr-lg">Latency (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((run: any, idx: number) => (
                        <tr key={idx} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{run.run_name}</td>
                          <td className="px-4 py-4 font-mono text-green-600 dark:text-green-400">{run.avg_faithfulness?.toFixed(2) || '-'}</td>
                          <td className="px-4 py-4 font-mono text-blue-600 dark:text-blue-400">{run.avg_relevance?.toFixed(2) || '-'}</td>
                          <td className="px-4 py-4 font-mono">{run.avg_latency?.toFixed(2) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase mt-6">Raw MLflow Payload</p>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                   <pre className="text-xs text-gray-800 dark:text-gray-300 font-mono overflow-x-auto">
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