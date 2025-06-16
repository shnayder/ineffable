import React from 'react';
import TextViewPanel from '@/features/text-view/text-view-panel';

const App = () => {
  return (
    <div className="app-container flex h-screen">
      <div className="sidebar w-64 bg-gray-50 border-r p-12">
        <h2 className="text-xl font-bold mb-2">Info Panel</h2>
        <p className="text-gray-700">Here's our text:</p>
      </div>
      <div className="text-view-panel flex-1 flex items-center justify-center">
        <TextViewPanel />
      </div>
    </div>
  );
};

export default App;
