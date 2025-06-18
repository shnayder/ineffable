import React, { useContext, useState } from 'react';
import { DocumentContext } from './text-view-panel';
import { getAnnotationsForId } from './document';

interface TextPanelProps {
  sliderValue: 'Word' | 'Sentence' | 'Paragraph';
  onSelect: (id: string) => void;
  selected: string | null;
  sampleText: string[];
}

const TextPanel: React.FC<TextPanelProps> = ({ sliderValue, onSelect, selected }) => {
  const document = useContext(DocumentContext);

  if (!document) {
      return <div className="w-full mb-4 min-h-[120px] max-w-prose">No text</div>;
  }

  const getParaClass = (id: string) => {
    if (sliderValue !== 'Paragraph') 
        return 'my-2 p-2';
    return `my-2 p-2 ${selected === id 
      ? 'bg-neutral-highlight' 
      : 'border-l-2 odd:border-neutral-fg-accent1 even:border-neutral-fg-accent2'}`;
  };

  const getSentenceClass = (id: string) => {
    if (sliderValue !== 'Sentence') return '';
    return selected === id
      ? 'bg-neutral-highlight'
      : 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2';
  };

  const getWordClass = (id: string) => {
    if (sliderValue !== 'Word') return '';
    return selected === id
      ? 'bg-neutral-highlight'
      : 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2';
  };

  const isActiveLevel = (level: 'Paragraph' | 'Sentence' | 'Word') => sliderValue === level;

  const getAnnotationCountElement = (id: string) => {
    const annotations = getAnnotationsForId(document, id);
    if (annotations && annotations.length > 0) {
      return  <span className="inline-flex items-center justify-center text-xs font-semibold rounded-md bg-secondary-bg text-secondary-fg border border-secondary-border w-4 h-4 ml-1">
        {annotations.length}
      </span>

    }
    return null;
  }

  return (
    <div className="w-full mb-4 min-h-[120px] max-w-prose">
      {document.paragraphs.map((p) => (
        <p
          key={p.id}
          id={p.id}
          className={getParaClass(p.id)}
          onClick={() => isActiveLevel('Paragraph') && onSelect(p.id)}
        >
          {p.sentences.map((s, sIdx) => (
            <span
              key={s.id}
              id={s.id}
              className={getSentenceClass(s.id)}
              onClick={() => isActiveLevel('Sentence') && onSelect(s.id)}
            >
              {s.words.map((w, wIdx) => (
                <React.Fragment key={w.id}>
                  <span
                    id={w.id}
                    className={getWordClass(w.id)}
                    onClick={() => isActiveLevel('Word') && onSelect(w.id)}
                    >
                  {w.text}
                  {isActiveLevel('Word') && getAnnotationCountElement(w.id)}
                  </span>
                  {wIdx < s.words.length - 1 && ' '}
                </React.Fragment>
              ))}
              {isActiveLevel('Sentence') && getAnnotationCountElement(s.id)}
              {sIdx < p.sentences.length - 1 && ' '}
            </span>
          ))}
          {isActiveLevel('Paragraph') && getAnnotationCountElement(p.id)}
        </p>
      ))}
    </div>
  );
};

export default TextPanel;
