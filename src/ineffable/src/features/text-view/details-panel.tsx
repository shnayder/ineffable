import React, { useContext } from 'react';
import AnnotationCard from './annotation-card';
import { DocumentContext } from './text-view-panel';

interface DetailsPanelProps {
  selectedId: string;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedId }) => {
  // Use in child
  const document = useContext(DocumentContext);

  let annotations = document?.annotations?.[selectedId] || [];

  return (
    <div 
        className="w-80 min-w-[200px] max-w-[320px] bg-surface-bg-base border-surface-border-base border-1 p-4 rounded ml-8"
    >
      <div className="mb-2">
        <strong>Selected:</strong> <span className="text-gray-800">{selectedId || <span className="text-gray-400">None</span>}</span>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="font-semibold mb-1">Comments</div>
        {annotations.map(annotation => (
          <AnnotationCard
            key={annotation.id}
            annotation={annotation} 
           />
          ))}
      </div>
    </div>
  );
};

export default DetailsPanel;
