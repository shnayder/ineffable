import React, { useState } from 'react';
import Slider from '@/components/Slider';
import { parseRawText } from './utils';
import { Document, Paragraph, Sentence, Word } from './types';
import CommentCard, { Comment } from './comment-card';
import DetailsPanel from './details-panel';

const SLIDER_STOPS = ['Word', 'Sentence', 'Paragraph'] as const;
type SliderStop = typeof SLIDER_STOPS[number];

const sampleText = [
  `Tarragon was bored. He had planned to play with his toy spaceship, but Ginny broke it yesterday. Ginny was a weasel. She had orange fur, a lot of energy, and was Tarragon's best friend of all time.`,
  `The weather outside was absolutely perfect for space adventures under the tall redwoods. The sun had just risen over the hills in the distance, lighting up the scattered clouds. Taraggon had just finished his breakfast of scrumptious savory french toast with green herbs, shredded mozzarella, and snail sauce, and now he had nothing to do.`,
  `“I need to find someone to play with”, said Tarragon to himself. “Let's see if Paper the Squirrel or Ginny want to have an adventure.”`,
  `Tarragon put on his white astronaut's jacket with a spaceship logo on the left shoulder and yellow loops for attaching items during spacewalks. He took the space-shuttle bag he always had with him and walked outside, pushed closed the door behind him, and hurried off to look for Paper the squirrel.`,
  `The light flickered between the tall trunks and upper branches of the redwoods as he walked toward the tree where Paper the Squirrel lived.`,
];

const TextViewPanel: React.FC = () => {
  const [sliderValue, setSliderValue] = useState<SliderStop>('Paragraph');
  // the id of the highlighted element
  const [selected, setSelected] = useState<string | null>(null);
  const [commentPos, setCommentPos] = useState<{ top: number } | null>(null);
  const textContainerRef = React.useRef<HTMLDivElement>(null);

  let document: Document = parseRawText(sampleText);

  // Reset selected and comment position when sliderValue changes
  React.useEffect(() => {
    setSelected(null);
    setCommentPos(null);
  }, [sliderValue]);

  // When selected changes, update comment position
  React.useEffect(() => {
    if (!selected) {
      setCommentPos(null);
      return;
    }
    // Try to find the DOM node for the selected element
    const el = window.document.getElementById(selected);
    if (el && textContainerRef.current) {
      const elRect = el.getBoundingClientRect();
      const containerRect = textContainerRef.current.getBoundingClientRect();
      setCommentPos({ top: elRect.top - containerRect.top });
    }
  }, [selected]);

  // Set up alternating colors for selected level. Transparent lines left (paragraph) or underneath (sentence and word) the elements.
  let pStyle = sliderValue === 'Paragraph' ? 'border-l-2 odd:border-neutral-fg-accent1 even:border-neutral-fg-accent2' : '';
  let sStyle = sliderValue === 'Sentence' ? 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2' : '';
  let wStyle = sliderValue === 'Word' ? 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2' : '';

  // Example: comments for each element (replace with real data as needed)
  const commentsMap: Record<string, Comment[]> = {
    ...(selected ? { [selected]: [
      { id: 'c1', text: 'Sample comment 1' },
      { id: 'c2', text: 'Sample comment 2' },
    ] } : {})
  };
  const comments = selected ? commentsMap[selected] || [] : [];

  return (
    <div className="flex flex-col items-start h-full justify-center w-full p-4 bg-surface-bg-base border-surface-border-base border-1 rounded">
        {/* Slider */}
        <Slider stops={SLIDER_STOPS} value={sliderValue} onChange={v => setSliderValue(v as SliderStop)} />

      <div className="flex flex-row items-start h-full justify-between relative">

        <div ref={textContainerRef} className="flex-1">

          {/* Highlighted selectable text */}
          <div className="w-full mb-4 min-h-[120px] max-w-prose">
            {document.paragraphs.map(p => (
              <p
                key={p.id}
                id={p.id}
                className={`${selected === p.id ? 'bg-neutral-highlight' : pStyle} my-2 p-2`}
                onClick={() => sliderValue === 'Paragraph' ? setSelected(p.id) : null}
              >
                {p.sentences.map(s => (
                  <span
                    key={s.id}
                    id={s.id}
                    className={selected === s.id ? 'bg-neutral-highlight' : sStyle}
                    onClick={e => {
                      if (sliderValue === 'Sentence') setSelected(s.id);
                    }}
                  >
                    {s.words.map(w => (
                      <span
                        key={w.id}
                        id={w.id}
                        className={selected === w.id ? 'bg-neutral-highlight' : wStyle}
                        onClick={e => {
                          if (sliderValue === 'Word') setSelected(w.id);
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
        </div>
        {/* Details panel on the right */}
        {selected && commentPos && (
          <DetailsPanel comments={comments} top={commentPos.top} selectedId={selected} />
        )}
      </div>
    </div>
  );
};

export default TextViewPanel;
