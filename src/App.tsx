import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/labs/Dashboard';
import { RAGBenchmarkLab } from './components/labs/RAGBenchmarkLab';
import { PromptOpsLab } from './components/labs/PromptOpsLab';
import { SchemaLab } from './components/labs/SchemaLab';
import { ReviewLab } from './components/labs/ReviewLab';
import { MemoryLab } from './components/labs/MemoryLab';
import { BatchEvalLab } from './components/labs/BatchEvalLab';
// YENİ: Studio Canvas'ı dahil ediyoruz
import { StudioCanvas } from './components/studio/StudioCanvas';

export default function App() {
  // YENİ: Varsayılan ana ekranımız artık 'studio'
  const [activeTab, setActiveTab] = useState('studio');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'studio': return 'LLMOps Studio (DAG Pipeline)';
      case 'dashboard': return 'Analytics Dashboard';
      case 'rag-benchmark': return 'RAG Benchmark Lab (Standalone)';
      case 'promptops': return 'PromptOps Lab (Standalone)';
      case 'schema': return 'Schema Lab (Standalone)';
      case 'review': return 'Review Lab (Standalone)';
      case 'memory': return 'Memory Lab (Standalone)';
      case 'batch': return 'Batch Evaluation Lab (Standalone)';
      default: return 'LLMOps Platform';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'studio': return <StudioCanvas />;
      case 'dashboard': return <Dashboard />;
      case 'rag-benchmark': return <RAGBenchmarkLab />;
      case 'promptops': return <PromptOpsLab />;
      case 'schema': return <SchemaLab />;
      case 'review': return <ReviewLab />;
      case 'memory': return <MemoryLab />;
      case 'batch': return <BatchEvalLab />;
      default: return <StudioCanvas />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header theme={theme} toggleTheme={toggleTheme} activeTabTitle={getTabTitle()} />
        {/* StudioCanvas kendi scroll yönetimine sahip olduğu için p-6 padding'ini kaldırıyoruz veya opsiyonel yapıyoruz */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'studio' ? '' : 'p-6'}`}>
          <div className={`${activeTab === 'studio' ? 'h-full w-full' : 'max-w-7xl mx-auto h-full'}`}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}