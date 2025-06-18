import React from 'react';
import { Annotation } from './types';

interface AnnotationCardProps {
  annotation: Annotation;
}

const icons = {
  'comment': '💬',
  'question': '❓',
  'suggestion': '💡',
  'critique': '🔍',
}

const colorClasses = {
  'comment': 'text-neutral-fg bg-surface-bg-overlay',
  'question': 'text-notice-fg bg-notice-bg',
  'suggestion': 'text-neutral-fg bg-surface-bg-overlay',
  'critique': 'text-actionable-fg bg-actionable-bg',
}

const AnnotationCard: React.FC<AnnotationCardProps> = ({ annotation }) => {

  return (
    <div
      className={"ml-4 rounded px-3 py-2 min-w-[180px] shadow" + 
        colorClasses[annotation.kind]}
    >
        <p className="text-sm text-gray-800">
        <span className="mr-1" title={annotation.kind} aria-label={annotation.kind}>
            {icons[annotation.kind] || '-'}
            </span>

          {annotation.text}
          </p>
    </div>
  );
};

export default AnnotationCard;
