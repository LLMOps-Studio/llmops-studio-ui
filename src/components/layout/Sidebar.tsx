import React from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  LineChart,
  GitMerge,
  FileJson,
  MessageSquareCode,
  BrainCircuit,
  Workflow,
  ListChecks,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'studio', label: 'Workflow Studio', icon: Workflow },
  { id: 'rag-benchmark', label: 'RAG Benchmark Lab', icon: LineChart },
  { id: 'promptops', label: 'PromptOps Lab', icon: GitMerge },
  { id: 'schema', label: 'Schema Lab', icon: FileJson },
  { id: 'review', label: 'Review Lab', icon: MessageSquareCode },
  { id: 'memory', label: 'Memory Lab', icon: BrainCircuit },
  { id: 'batch', label: 'Batch Evaluation', icon: ListChecks },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-[#0c0c0e] border-r border-gray-200 dark:border-white/5 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-transparent shrink-0">
        <div className="flex items-center gap-2 text-primary-600 dark:text-white font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-purple-600 flex items-center justify-center">
            <div className="hidden dark:block w-4 h-4 bg-white/20 rounded-full blur-[1px]"></div>
            <BrainCircuit className="w-5 h-5 dark:hidden" />
          </div>
          <span>LLMOps<span className="text-purple-500">Studio</span></span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-purple-600/10 text-primary-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-white/5">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Environment</div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Local Node</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cloud Hybrid</span>
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-purple-500"></span>
        </div>
      </div>
    </aside>
  );
}
