import React, { useState } from 'react';
import Slider from '@/components/Slider';
import { DocumentModel } from './document-model'
import { DocumentVersion, Element, ElementKind } from './types';
import DetailsPanel from './details-panel';
import DocumentPanel from './document-panel';
import { useDocStore } from './document-store'; 

type SliderStop = Exclude<ElementKind, 'document'>;
// TODO — define the list in types.ts as a const, use it to define the type and the list of stops
const SLIDER_STOPS: SliderStop[] = ['word', 'sentence', 'paragraph'];

const sampleText = 
  `Tarragon was bored`;
  
  
//   . He had planned to play with his toy spaceship, but Ginny broke it yesterday. Ginny was a weasel. She had orange fur, a lot of energy, and was Tarragon's best friend of all time.
// The weather outside was absolutely perfect for space adventures under the tall redwoods. The sun had just risen over the hills in the distance, lighting up the scattered clouds. Taraggon had just finished his breakfast of scrumptious savory french toast with green herbs, shredded mozzarella, and snail sauce, and now he had nothing to do.
// “I need to find someone to play with”, said Tarragon to himself. “Let's see if Paper the Squirrel or Ginny want to have an adventure.”
// Tarragon put on his white astronaut's jacket with a spaceship logo on the left shoulder and yellow loops for attaching items during spacewalks. He took the space-shuttle bag he always had with him and walked outside, pushed closed the door behind him, and hurried off to look for Paper the squirrel.
// The light flickered between the tall trunks and upper branches of the redwoods as he walked toward the tree where Paper the Squirrel lived.`;

const TextViewPanel: React.FC = () => {
  const [sliderValue, setSliderValue] = useState<SliderStop>('paragraph');
  // the id of the highlighted element
  const [selected, setSelected] = useState<string | null>(null);
  
    // Reset selected when sliderValue changes
  React.useEffect(() => {
    setSelected(null);
  }, [sliderValue]);

  return (

    <div className="flex flex-col items-start h-full justify-center w-full p-4 bg-surface-bg-base border-surface-border-base border-1 rounded">

      <Slider stops={SLIDER_STOPS} value={sliderValue} onChange={v => setSliderValue(v as SliderStop)} />

      <div className="flex flex-row items-start h-full justify-between relative">
        <div className="flex-1">

          <DocumentPanel
            sliderValue={sliderValue}
            onSelect={setSelected}
            selected={selected}
            sampleText={sampleText}
          />
        </div>

        <DetailsPanel selectedId={selected || ''} />
      </div>
    </div>
  );
};

export default TextViewPanel;
