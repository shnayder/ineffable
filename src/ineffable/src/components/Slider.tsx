import React from 'react';

interface SliderProps {
  stops: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

const Slider: React.FC<SliderProps> = ({ stops, value, onChange }) => {
  return (
    <div className="w-full mb-4">
      <input
        type="range"
        min={0}
        max={stops.length - 1}
        value={stops.indexOf(value)}
        onChange={e => onChange(stops[+e.target.value])}
        step={1}
        className="w-full accent-blue-500"
      />
      <div className="flex justify-between text-xs mt-1">
        {stops.map(stop => (
          <span key={stop} className={value === stop ? 'font-bold text-blue-600' : ''}>{stop}</span>
        ))}
      </div>
    </div>
  );
};

export default Slider;
