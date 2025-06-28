import React, { useContext, useState } from 'react';

import { Annotation, DocumentVersion, Element, ElementKind } from './types';
import { Id } from '@/utils/nanoid';
import { useDocStore } from './document-store';
import { docModel, useCurrentVersion, useElement } from './document-model';

interface TextPanelProps {
  sliderValue: Exclude<ElementKind, 'document'>;
  onSelect: (id: Id) => void;
  selected: Id | null;
  sampleText: string;
}

const DocumentPanel: React.FC<TextPanelProps> = ({ sliderValue, onSelect, selected, sampleText }) => {
  const currentVersion = useCurrentVersion();
  const rootId = currentVersion?.rootId;
  const rootElement = useElement(rootId);

  React.useEffect(() => {
    docModel.updateElement(rootId, sampleText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // documentModel = addMockAnnotations(documentModel); // Update later

  // if (!documentModel) {
  //     return <div className="w-full mb-4 min-h-[120px] max-w-prose">No text</div>;
  // }

  const getParaClass = (id: Id) => {
    if (sliderValue !== 'paragraph') 
        return 'my-2 p-2';
    return `my-2 p-2 ${selected === id 
      ? 'bg-neutral-highlight' 
      : 'border-l-2 odd:border-neutral-fg-accent1 even:border-neutral-fg-accent2'}`;
  };

  const getSentenceClass = (id: Id) => {
    if (sliderValue !== 'sentence') return '';
    return selected === id
      ? 'bg-neutral-highlight'
      : 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2';
  };

  const getWordClass = (id: Id) => {
    if (sliderValue !== 'word') return '';
    return selected === id
      ? 'bg-neutral-highlight'
      : 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2';
  };

  const isActiveLevel = (level: 'paragraph' | 'sentence' | 'word') => sliderValue === level;

  const getAnnotationCountElement = (id: Id) => {
    const annotations: Annotation[] = [] //documentModel.getAnnotationsForElementId(id); 
    if (annotations && annotations.length > 0) {
      return  <span className="inline-flex items-center justify-center text-xs font-semibold rounded-md bg-secondary-bg text-secondary-fg border border-secondary-border w-4 h-4 ml-1">
        {annotations.length}
      </span>
    }
    return null;
  }

  return (
    <div className="w-full mb-4 min-h-[120px] max-w-prose">
      {docModel.getElement(rootId)?.childrenIds.map((pId) => (
        <p
          key={pId}
          id={pId}
          className={getParaClass(pId)}
          onClick={() => isActiveLevel('paragraph') && onSelect(pId)}
        >
          {docModel.getElement(pId)?.childrenIds.map((sId, sIdx) => (
            <span
              key={sId}
              id={sId}
              className={getSentenceClass(sId)}
              onClick={() => isActiveLevel('sentence') && onSelect(sId)}
            >
              {docModel.getElement(sId)?.childrenIds.map((wId, wIdx) => (
                <React.Fragment key={wId}>
                  <span
                    id={wId}
                    className={getWordClass(wId)}
                    onClick={() => isActiveLevel('word') && onSelect(wId)}
                    >
                  {docModel.getElement(wId)?.contents}
                  {isActiveLevel('word') && getAnnotationCountElement(wId)}
                  </span>
                  {wIdx < docModel.getElement(sId).childrenIds.length - 1 && ' '}
                </React.Fragment>
              ))}
              {isActiveLevel('sentence') && getAnnotationCountElement(sId)}
              {sIdx < docModel.getElement(pId).childrenIds.length - 1 && ' '}
            </span>
          ))}
          {isActiveLevel('paragraph') && getAnnotationCountElement(pId)}
        </p>
      ))}
    </div>
  );
};

export default DocumentPanel;
