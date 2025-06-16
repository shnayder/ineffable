import React, { useState } from 'react';
import Slider from '@/components/Slider';
import { parseRawText } from './utils';
import { Document, Paragraph, Sentence, Word } from './types';

// This file has been moved to features/text-view/TextViewPanel.tsx

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

  return (
    <div className="flex flex-col items-start h-full justify-center w-1/2">
      {/* Slider */}
      <Slider stops={SLIDER_STOPS} value={sliderValue} onChange={v => setSliderValue(v as SliderStop)} />

      {/* Highlighted selectable text */}
      <div className="w-full mb-4 min-h-[120px]">
        {document.paragraphs.map(p => (
            <p
            key={p.id}
            className={`${selected === p.id ? 'bg-yellow-200' : ''} my-2`}
            onClick={() => sliderValue === 'Paragraph' ? setSelected(p.id) : null}
            >
            {p.sentences.map(s => (
              <span
              key={s.id}
              className={selected === s.id ? 'bg-yellow-200' : ''}
              onClick={() => sliderValue === 'Sentence' ? setSelected(s.id) : null}
              >
              {s.words.map(w => (
                <span
                key={w.id}
                className={selected === w.id ? 'bg-yellow-200' : ''}
                onClick={() => sliderValue === 'Word' ? setSelected(w.id) : null}
                >
                {w.text}{' '}
                </span>
              ))}
              </span>
            ))}
            </p>
        ))}
      </div>
      {/* Selected element display */}
      <div className="w-full bg-gray-100 p-2 rounded min-h-[32px]">
        <strong>Selected:</strong> 
        <span className="text-gray-400">
          {selected ? document.elementMap[selected].text : "None"} 
          </span>
      </div>
    </div>
  );
};

export default TextViewPanel;
