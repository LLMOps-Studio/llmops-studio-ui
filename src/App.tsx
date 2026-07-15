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
import { StudioCanvas } from './components/studio/StudioCanvas';

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  studio: 'Workflow Studio',
  'rag-benchmark': 'RAG Benchmark Lab',
  promptops: 'PromptOps Lab',
  schema: 'Schema Lab',
  review: 'Review Lab',
  memory: 'Memory Lab',
  batch: 'Batch Evaluation Lab',
};

// Every entry here is rendered as its own component. `id` matches Sidebar's
// navItems ids. `noPadding` mirrors the special full-bleed layout StudioCanvas
// needs (it manages its own scroll/canvas area).
const TABS: { id: string; render: () => React.ReactNode; noPadding?: boolean }[] = [
  { id: 'dashboard', render: () => <Dashboard /> },
  { id: 'studio', render: () => <StudioCanvas />, noPadding: true },
  { id: 'rag-benchmark', render: () => <RAGBenchmarkLab /> },
  { id: 'promptops', render: () => <PromptOpsLab /> },
  { id: 'schema', render: () => <SchemaLab /> },
  { id: 'review', render: () => <ReviewLab /> },
  { id: 'memory', render: () => <MemoryLab /> },
  { id: 'batch', render: () => <BatchEvalLab /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Tabs the user has actually opened. Once a tab is visited it's added
  // here and never removed, so its component stays mounted (state intact)
  // for the rest of the session -- switching away just hides it with CSS
  // instead of unmounting it. This is what fixes "switching pages loses
  // the running test's state": previously `renderContent()` used a plain
  // switch statement, so navigating away destroyed the previous tab's
  // component instance (and every useState inside it) entirely.
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['dashboard']));

  useEffect(() => {
    setVisitedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

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

  const activeTabTitle = TAB_TITLES[activeTab] ?? 'LLMOps Studio';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header theme={theme} toggleTheme={toggleTheme} activeTabTitle={activeTabTitle} />
        <main className={`flex-1 overflow-y-auto ${activeTab === 'studio' ? '' : 'p-6'}`}>
          {TABS.filter(tab => visitedTabs.has(tab.id)).map(tab => (
            <div
              key={tab.id}
              // hidden (not unmounted) when inactive -- keeps component state alive
              style={{ display: activeTab === tab.id ? 'block' : 'none' }}
              className={tab.noPadding ? 'h-full w-full' : 'max-w-7xl mx-auto h-full'}
            >
              {tab.render()}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}