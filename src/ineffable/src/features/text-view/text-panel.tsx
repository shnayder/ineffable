import React, { useContext, useState } from 'react';

import { createDocumentModelFromText, createDocumentVersionFromText, DocumentModel } from './document';
import { Annotation, DocumentVersion, Element, ElementKind } from './types';
import { Id } from '@/utils/nanoid';
import { useDocStore } from './document-store';

interface TextPanelProps {
  sliderValue: Exclude<ElementKind, 'document'>;
  onSelect: (id: Id) => void;
  selected: Id | null;
  sampleText: string;
}

const TextPanel: React.FC<TextPanelProps> = ({ sliderValue, onSelect, selected, sampleText }) => {

  React.useEffect(() => {
    const version: DocumentVersion = createDocumentVersionFromText(sampleText);
    useDocStore.getState().load(version);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const documentModel = useDocStore((state) => state.model);

  // documentModel = addMockAnnotations(documentModel); // Update later

  if (!documentModel) {
      return <div className="w-full mb-4 min-h-[120px] max-w-prose">No text</div>;
  }

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
    const annotations: Annotation[] = documentModel.getAnnotationsForElementId(id); 
    if (annotations && annotations.length > 0) {
      return  <span className="inline-flex items-center justify-center text-xs font-semibold rounded-md bg-secondary-bg text-secondary-fg border border-secondary-border w-4 h-4 ml-1">
        {annotations.length}
      </span>
    }
    return null;
  }

  return (
    <div className="w-full mb-4 min-h-[120px] max-w-prose">
      {documentModel.getChildElements(documentModel.root.id).map((p) => (
        <p
          key={p.id}
          id={p.id}
          className={getParaClass(p.id)}
          onClick={() => isActiveLevel('paragraph') && onSelect(p.id)}
        >
          {documentModel.getChildElements(p.id).map((s, sIdx) => (
            <span
              key={s.id}
              id={s.id}
              className={getSentenceClass(s.id)}
              onClick={() => isActiveLevel('sentence') && onSelect(s.id)}
            >
              {documentModel.getChildElements(s.id).map((w, wIdx) => (
                <React.Fragment key={w.id}>
                  <span
                    id={w.id}
                    className={getWordClass(w.id)}
                    onClick={() => isActiveLevel('word') && onSelect(w.id)}
                    >
                  {w.contents}
                  {isActiveLevel('word') && getAnnotationCountElement(w.id)}
                  </span>
                  {wIdx < s.childrenIds.length - 1 && ' '}
                </React.Fragment>
              ))}
              {isActiveLevel('sentence') && getAnnotationCountElement(s.id)}
              {sIdx < p.childrenIds.length - 1 && ' '}
            </span>
          ))}
          {isActiveLevel('paragraph') && getAnnotationCountElement(p.id)}
        </p>
      ))}
    </div>
  );
};

export default TextPanel;
