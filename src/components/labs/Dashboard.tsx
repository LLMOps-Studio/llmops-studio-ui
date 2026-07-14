import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { Download, FileText, Activity } from 'lucide-react';

interface RunData {
  experiment_id: string;
  run_id: string;
  metrics: Record<string, number>;
  params: Record<string, string>;
  start_time: number;
}

interface ChartDataPoint {
  name: string;
  faithfulness: number;
  relevance: number;
  latency: number;
  tps: number;
}

export const Dashboard: React.FC = () => {
  const [runs, setRuns] = useState<RunData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:8000/api/v1/dashboard');
        setRuns(response.data.runs);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch MLflow metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData: ChartDataPoint[] = runs
    .filter(run => run.metrics && (run.metrics.faithfulness_score !== undefined || run.metrics.avg_faithfulness_score !== undefined))
    .map((run, index) => ({
      name: run.params.model || run.params.experiment_name || `Run ${index + 1}`,
      faithfulness: run.metrics.faithfulness_score || run.metrics.avg_faithfulness_score || 0,
      relevance: run.metrics.relevance_score || run.metrics.avg_relevance_score || 0,
      latency: run.metrics.latency || run.metrics.avg_latency_seconds || 0,
      tps: run.metrics.avg_tps || 0,
    }));

  const exportToCSV = () => {
    if (runs.length === 0) return;
    const headers = ['Run ID', 'Model', 'Faithfulness', 'Relevance', 'Latency (s)', 'TPS', 'VRAM (MB)', 'Timestamp'];
    const rows = runs.map(run => [
      run.run_id.substring(0, 8),
      run.params.model || 'N/A',
      (run.metrics.avg_faithfulness_score || 0).toFixed(4),
      (run.metrics.avg_relevance_score || 0).toFixed(4),
      (run.metrics.avg_latency_seconds || 0).toFixed(2),
      (run.metrics.avg_tps || 0).toFixed(2),
      (run.metrics.vram_used_mb || 0).toFixed(0),
      new Date(run.start_time).toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'llmops_thesis_metrics.csv';
    link.click();
  };

  const exportToMarkdown = () => {
    if (runs.length === 0) return;
    let md = `| Run ID | Model | Faithfulness | Relevance | Latency (s) | TPS | VRAM (MB) |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    
    runs.forEach(run => {
      md += `| \`${run.run_id.substring(0, 8)}\` | ${run.params.model || 'N/A'} | ${(run.metrics.avg_faithfulness_score || 0).toFixed(4)} | ${(run.metrics.avg_relevance_score || 0).toFixed(4)} | ${(run.metrics.avg_latency_seconds || 0).toFixed(2)} | ${(run.metrics.avg_tps || 0).toFixed(2)} | ${(run.metrics.vram_used_mb || 0).toFixed(0)} |\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'llmops_thesis_table.md';
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <Activity className="text-blue-500 animate-pulse mb-4" size={48} />
          <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">Aggregating MLflow Telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6 bg-gray-50 dark:bg-gray-950 overflow-y-auto font-sans">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="text-blue-500" /> Analytics & Hardware Profiling
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time edge hardware constraints and accuracy metrics.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors">
            <Download size={16} /> CSV
          </button>
          <button onClick={exportToMarkdown} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-colors">
            <FileText size={16} /> Markdown
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Accuracy Optimization (Score)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                <YAxis stroke="#9ca3af" domain={[0, 1]} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                <Legend iconType="circle" />
                <Bar dataKey="faithfulness" fill="#10b981" name="Faithfulness" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="relevance" fill="#3b82f6" name="Relevance" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Edge Hardware Throughput (TPS)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#ef4444" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                <Legend iconType="circle" />
                <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#ef4444" name="Latency (sec)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="tps" stroke="#8b5cf6" name="Tokens / Sec" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Evaluation Registry (MLflow)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">Run ID</th>
                <th className="px-6 py-4">Model Configuration</th>
                <th className="px-6 py-4">Faithfulness</th>
                <th className="px-6 py-4">Relevance</th>
                <th className="px-6 py-4">Throughput (TPS)</th>
                <th className="px-6 py-4">VRAM (MB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {runs.map((run, idx) => (
                <tr key={idx} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{run.run_id.substring(0, 8)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{run.params.model || run.params.experiment_name || 'N/A'}</td>
                  <td className="px-6 py-4 font-mono text-emerald-600">{run.metrics.faithfulness_score?.toFixed(3) || run.metrics.avg_faithfulness_score?.toFixed(3) || '-'}</td>
                  <td className="px-6 py-4 font-mono text-blue-600">{run.metrics.relevance_score?.toFixed(3) || run.metrics.avg_relevance_score?.toFixed(3) || '-'}</td>
                  <td className="px-6 py-4 font-mono text-purple-500">{run.metrics.avg_tps?.toFixed(1) || '-'}</td>
                  <td className="px-6 py-4 font-mono">{run.metrics.vram_used_mb?.toFixed(0) || '-'}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No telemetry data found in MLflow. Run a pipeline to generate metrics.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};