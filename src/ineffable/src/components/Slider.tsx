import React from 'react';

interface SliderProps {
  stops: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

const Slider: React.FC<SliderProps> = ({ stops, value, onChange }) => {
  return (
    <div className="w-fit mb-4">
        <label className="block text-sm font-medium text-neutral-fg mb-2">Select Level</label>
      <input
        type="range"
        min={0}
        max={stops.length - 1}
        value={stops.indexOf(value)}
        onChange={e => onChange(stops[+e.target.value])}
        step={1}
        className="w-full accent-primary-fg"
      />
      <div className="flex justify-between text-xs mt-1">
        {stops.map((stop) => (
          <button
            key={stop}
            type="button"
            className={
              (value === stop ? 'font-bold text-primary-fg-active ' : 'text-primary-fg-inactive hover:text-primary-fg-hover hover:underline ') +
              'bg-transparent border-none py-0 px-2 m-0 cursor-pointer focus:outline-none'
            }
            onClick={() => onChange(stop)}
            style={{ minWidth: 40 }}
          >
            {stop}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Slider;
