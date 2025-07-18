import React, { useState } from 'react';
import Slider from '@/components/Slider';
import { ElementKind } from './types';
import DetailsPanel from './details-panel';
import DocumentPanel from './document-panel';
import { docModel, useMaxVersionNumber, useCurrentVersion } from './document-model';

type SliderStop = Exclude<ElementKind, 'document'>;
// TODO — define the list in types.ts as a const, use it to define the type and the list of stops
const SLIDER_STOPS: SliderStop[] = ['word', 'sentence', 'paragraph'];

const TextViewPanel: React.FC = () => {
  const [sliderValue, setSliderValue] = useState<SliderStop>('paragraph');
  // the id of the highlighted element
  const [selected, setSelected] = useState<string | null>(null);
  
  const maxVersion = useMaxVersionNumber();
  const currentVersion = useCurrentVersion();

  // Reset selected when sliderValue changes
  React.useEffect(() => {
    setSelected(null);
  }, [sliderValue, currentVersion]);

  const handleVersionChange = (newVersion: number) => {
    docModel.switchToVersion(newVersion);
  };

  return (

    <div className="flex flex-col items-start h-full justify-center w-full p-4 bg-surface-bg-base border-surface-border-base border-1 rounded">

      <div className="w-full flex-col items-center mb-4">
        <label className="block text-sm font-medium text-neutral-fg mb-2">Time Travel:</label>
        <input
          type="range"
          min={1}
          max={maxVersion}
          value={currentVersion.docVersionNumber}
          onChange={(e) => handleVersionChange(Number(e.target.value))}
          className="w-64 accent-primary-fg"
        />
        <span className="ml-2 text-sm">Version {currentVersion.docVersionNumber}</span>
      </div>

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
