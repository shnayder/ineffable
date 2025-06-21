import React, { useContext } from 'react';
import AnnotationCard from './annotation-card';
import { useDocStore } from './document-store';

interface DetailsPanelProps {
  selectedId: string;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedId }) => {
  const documentModel = useDocStore((state) => state.model);

  let annotations = documentModel?.getAnnotationsForElementId(selectedId);
  if (!annotations) {
    annotations = [];
  }

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
