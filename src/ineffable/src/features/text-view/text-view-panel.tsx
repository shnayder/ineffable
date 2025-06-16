import React, { useState } from 'react';
import Slider from '@/components/Slider';

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

function splitText(text: string, mode: SliderStop): string[] {
  if (mode === 'Paragraph') return [text];
  if (mode === 'Sentence') return text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
  if (mode === 'Word') return text.split(/\s+/);
  return [text];
}

const TextViewPanel: React.FC = () => {
  const [sliderValue, setSliderValue] = useState<SliderStop>('Paragraph');
  const [selected, setSelected] = useState<string | null>(null);

  let elements: string[] = [];
  if (sliderValue === 'Paragraph') {
    elements = sampleText;
  } else {
    elements = sampleText.flatMap(paragraph => splitText(paragraph, sliderValue));
  }

  return (
    <div className="flex flex-col items-start h-full justify-center w-1/2">
      {/* Slider */}
      <Slider stops={SLIDER_STOPS} value={sliderValue} onChange={v => setSliderValue(v as SliderStop)} />
      {/* Highlighted selectable text */}
      <div className="w-full mb-4 min-h-[120px]">
        {elements.map((el, idx) => (
          <span
            key={idx}
            onClick={() => setSelected(el)}
            className={`transition-colors rounded px-0.5 py-0.5 cursor-pointer ${selected === el ? 'bg-yellow-200' : ''} ${sliderValue === 'Paragraph' ? 'block' : 'inline'} ${sliderValue === 'Word' ? 'mr-1' : ''}`}
          >
            {el}
            {(sliderValue === 'Sentence' || sliderValue === 'Word') ? ' ' : ''}
          </span>
        ))}
      </div>
      {/* Selected element display */}
      <div className="w-full bg-gray-100 p-2 rounded min-h-[32px]">
        <strong>Selected:</strong> {selected || <span className="text-gray-400">None</span>}
      </div>
    </div>
  );
};

export default TextViewPanel;
