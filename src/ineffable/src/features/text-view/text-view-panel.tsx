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
          />
        </div>

        <DetailsPanel selectedId={selected || ''} />
      </div>
    </div>
  );
};

export default TextViewPanel;
