import React from 'react';
import { Sun, Moon, Bell, Search, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTabTitle: string;
}

export function Header({ theme, toggleTheme, activeTabTitle }: HeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-transparent border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-medium text-gray-900 dark:text-white tracking-tight">
          {activeTabTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            className="w-64 pl-9 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5 focus:bg-white dark:focus:bg-white/10 focus:border-primary-500 dark:focus:border-purple-500/50 focus:ring-1 focus:ring-primary-500 dark:focus:ring-purple-500/50 rounded-full transition-all outline-none text-gray-900 dark:text-gray-200 placeholder:text-gray-500"
          />
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-white/10 pl-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
          
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors">
            <Bell className="w-4 h-4" />
          </button>

          <button className="w-8 h-8 rounded-full bg-primary-100 dark:bg-white/10 flex items-center justify-center text-primary-600 dark:text-gray-300 ml-2">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
