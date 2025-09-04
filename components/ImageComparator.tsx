import React, { useState } from 'react';
import { ImageInfo } from '../types';

interface ImageComparatorProps {
  original: ImageInfo;
  compressed: ImageInfo;
}

const ImageComparator: React.FC<ImageComparatorProps> = ({ original, compressed }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-dark-bg shadow-lg select-none group">
      {/* Original Image (Bottom Layer) */}
      <img
        src={original.url}
        alt="Original"
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
        draggable="false"
      />

      {/* Compressed Image (Top Layer, clipped) */}
      <img
        src={compressed.url}
        alt="Compressed"
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        draggable="false"
      />

      {/* Slider Control */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={handleSliderChange}
        className="absolute top-0 left-0 w-full h-full m-0 p-0 cursor-ew-resize appearance-none bg-transparent focus:outline-none"
        aria-label="Image comparison slider"
      />

      {/* Slider Handle/Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/70 pointer-events-none transform -translate-x-1/2 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute w-10 h-10 rounded-full bg-white/90 border-2 border-brand-primary flex items-center justify-center shadow-lg cursor-ew-resize">
          <svg className="w-5 h-5 text-brand-primary transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default ImageComparator;
