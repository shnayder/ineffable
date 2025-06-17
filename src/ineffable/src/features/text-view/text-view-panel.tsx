import React, { useState } from 'react';
import Slider from '@/components/Slider';
import { parseRawText } from './utils';
import { Document, Paragraph, Sentence, Word } from './types';
import CommentCard, { Comment } from './comment-card';
import DetailsPanel from './details-panel';
import TextPanel from './text-panel';

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
  
  let document: Document = parseRawText(sampleText);

  // Reset selected when sliderValue changes
  React.useEffect(() => {
    setSelected(null);
  }, [sliderValue]);


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

      <Slider stops={SLIDER_STOPS} value={sliderValue} onChange={v => setSliderValue(v as SliderStop)} />

      <div className="flex flex-row items-start h-full justify-between relative">
        <div className="flex-1">

          <TextPanel
            sliderValue={sliderValue}
            onSelect={setSelected}
            selected={selected}
            sampleText={sampleText}
          />
        </div>

        <DetailsPanel comments={comments} selectedId={selected || ''} />
      </div>
    </div>
  );
};

export default TextViewPanel;
