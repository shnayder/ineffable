import React, { useState } from 'react';
import { Annotation } from './types';
import { docModel } from './document-model';

interface AnnotationCardProps {
  annotation: Annotation;
}

const icons = {
  comment: '💬',
  question: '❓',
  suggestion: '💡',
  critique: '🔍',
};

const colorClasses = {
  comment: 'text-neutral-fg bg-surface-bg-overlay',
  question: 'text-notice-fg bg-notice-bg',
  suggestion: 'text-neutral-fg bg-surface-bg-overlay',
  critique: 'text-actionable-fg bg-actionable-bg',
};

const AnnotationCard: React.FC<AnnotationCardProps> = ({ annotation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(annotation.contents);

  const handleUpdate = () => {
    if (editedContent.trim() !== '') {
      docModel.updateAnnotation(annotation.id, editedContent.trim());
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this annotation?')) {
      docModel.deleteAnnotation(annotation.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUpdate();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(annotation.contents);
    }
  };

  return (
    <div
      className={
        'ml-4 rounded px-3 py-2 min-w-[180px] shadow ' +
        colorClasses[annotation.kind]
      }
    >
      <div className="flex justify-between items-start">
        {isEditing ? (
          <div className="flex-grow">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-1 border rounded text-black"
              rows={3}
            />
            <div className="flex justify-end space-x-2 mt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs px-2 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-800 flex-grow">
              <span
                className="mr-1"
                title={annotation.kind}
                aria-label={annotation.kind}
              >
                {icons[annotation.kind] || '-'}
              </span>
              {annotation.contents}
            </p>
            <div className="flex-shrink-0 flex items-center space-x-1 ml-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs p-1"
                aria-label="Edit"
              >
                ✏️
              </button>
              <button
                onClick={handleDelete}
                className="text-xs p-1"
                aria-label="Delete"
              >
                🗑️
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnnotationCard;
