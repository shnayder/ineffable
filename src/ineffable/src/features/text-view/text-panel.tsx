import React, { useState } from 'react';
import { parseRawText } from './document';
import { Document, Paragraph, Sentence, Word } from './types';

interface TextPanelProps {
  sliderValue: 'Word' | 'Sentence' | 'Paragraph';
  onSelect: (id: string) => void;
  selected: string | null;
  sampleText: string[];
}

const TextPanel: React.FC<TextPanelProps> = ({ sliderValue, onSelect, selected, sampleText }) => {
  let document: Document = parseRawText(sampleText);

  let pStyle = sliderValue === 'Paragraph' ? 'border-l-2 odd:border-neutral-fg-accent1 even:border-neutral-fg-accent2' : '';
  let sStyle = sliderValue === 'Sentence' ? 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2' : '';
  let wStyle = sliderValue === 'Word' ? 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2' : '';

  return (
    <div className="w-full mb-4 min-h-[120px] max-w-prose">
      {document.paragraphs.map(p => (
        <p
          key={p.id}
          id={p.id}
          className={`${selected === p.id ? 'bg-neutral-highlight' : pStyle} my-2 p-2`}
          onClick={() => sliderValue === 'Paragraph' ? onSelect(p.id) : null}
        >
          {p.sentences.map(s => (
            <span
              key={s.id}
              id={s.id}
              className={selected === s.id ? 'bg-neutral-highlight' : sStyle}
              onClick={e => {
                if (sliderValue === 'Sentence') onSelect(s.id);
              }}
            >
              {s.words.map(w => (
                <span
                  key={w.id}
                  id={w.id}
                  className={selected === w.id ? 'bg-neutral-highlight' : wStyle}
                  onClick={e => {
                    if (sliderValue === 'Word') onSelect(w.id);
                  }}
                >
                  {w.text}{' '}
                </span>
              ))}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
};

export default TextPanel;
