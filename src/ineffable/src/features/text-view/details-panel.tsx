import React, { useState } from 'react';
import AnnotationCard from './annotation-card';
import { docModel, useAnnotations } from './document-model';
import { AnnotationKind } from './types';

interface DetailsPanelProps {
  selectedId: string;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedId }) => {
  const documentModel = docModel;

  const annotations = useAnnotations(selectedId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAnnotationContent, setNewAnnotationContent] = useState('');
  const [newAnnotationKind, setNewAnnotationKind] =
    useState<AnnotationKind>('comment');

  const handleAddAnnotation = () => {
    if (newAnnotationContent.trim() && selectedId) {
      documentModel.addAnnotation(
        selectedId,
        newAnnotationKind,
        newAnnotationContent.trim()
      );
      setNewAnnotationContent('');
      setNewAnnotationKind('comment');
      setShowAddForm(false);
    }
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddAnnotation();
    }
  };

  const annotationKinds: AnnotationKind[] = [
    'comment',
    'critique',
    'suggestion',
    'question',
  ];

  return (
    <div className="w-80 min-w-[200px] max-w-[320px] bg-surface-bg-base border-surface-border-base border-1 p-4 rounded ml-8">
      <div className="mb-2">
        <strong>Selected:</strong>{' '}
        <span className="text-gray-800">
          {selectedId || <span className="text-gray-400">None</span>}
        </span>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center mb-1">
          <div className="font-semibold">Comments</div>
          {selectedId && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-lg font-bold p-1 leading-none"
            >
              {showAddForm ? '-' : '+'}
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="flex flex-col space-y-2 border p-2 rounded">
            <textarea
              value={newAnnotationContent}
              onChange={(e) => setNewAnnotationContent(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="w-full p-1 border rounded"
              placeholder="Add a comment..."
              rows={3}
            />
            <select
              value={newAnnotationKind}
              onChange={(e) =>
                setNewAnnotationKind(e.target.value as AnnotationKind)
              }
              className="w-full p-1 border rounded"
            >
              {annotationKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind.charAt(0).toUpperCase() + kind.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddAnnotation}
              className="bg-blue-500 text-white p-1 rounded"
            >
              Add
            </button>
          </div>
        )}

        {annotations.map((annotation) => (
          <AnnotationCard key={annotation.id} annotation={annotation} />
        ))}
      </div>
    </div>
  );
};

export default DetailsPanel;
