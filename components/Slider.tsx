
import React from 'react';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({ min, max, step, value, onChange, disabled = false }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };
  
  const progress = ((value - min) / (max - min)) * 100;
  
  const sliderStyle = {
      background: `linear-gradient(to right, #007BFF ${progress}%, #4a5568 ${progress}%)`
  };


  return (
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
        style={sliderStyle}
      />
    </div>
  );
};

export default Slider;
