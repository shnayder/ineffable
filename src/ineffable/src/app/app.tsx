import React, { useState } from 'react';
import TextViewPanel from '@/features/text-view/text-view-panel';
import ThemePreview from '@/features/theme-preview/theme-preview';

const NAV_ITEMS = [
  { key: 'text', label: 'Text View' },
  { key: 'theme', label: 'Theme Preview' },
];

const App = () => {
  const [page, setPage] = useState<'text' | 'theme'>('text');

  return (
    <div className="app-container flex h-screen">
      <nav className="sidebar w-64 bg-surface-bg-base border-r p-12 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-neutral-fg">Navigation</h2>
        <ul className="flex flex-col gap-2">
          {NAV_ITEMS.map(item => (
            <li key={item.key}>
              <button
                className={`w-full text-left px-3 py-2 rounded transition-colors ${page === item.key ? 'bg-primary-bg-active text-primary-fg-active font-semibold' : 'hover:bg-primary-bg-hover text-primary-fg-inactive'}`}
                onClick={() => setPage(item.key as 'text' | 'theme')}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="text-view-panel flex-1 flex flex-col overflow-auto">
        <div className="flex-1 flex items-center justify-center">
          {page === 'text' && <TextViewPanel />}
          {page === 'theme' && <ThemePreview />}
        </div>
      </div>
    </div>
  );
};

export default App;
