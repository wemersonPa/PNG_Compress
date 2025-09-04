import React, { useState, useCallback } from 'react';
import { ImageIcon } from './icons/ImageIcon';

interface DropzoneProps {
  onFileSelect: (files: File[]) => void;
  error: string | null;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, error }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(Array.from(e.target.files));
    }
  };

  const dragClass = isDragging ? 'border-brand-primary bg-dark-bg' : 'border-dark-border';

  return (
    <div className="p-8 bg-dark-card rounded-xl shadow-lg text-center">
      <h2 className="text-xl font-semibold mb-4 text-light-text">Upload Your PNGs</h2>
      <p className="text-medium-text mb-6">Drop multiple PNG files with transparency to begin.</p>
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${dragClass}`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept="image/png"
          multiple
        />
        <div className="flex flex-col items-center justify-center space-y-4 text-medium-text">
            <ImageIcon />
            <p className="font-semibold text-light-text">
            {isDragging ? 'Drop your files!' : 'Drag & drop PNGs here'}
            </p>
            <p>or</p>
            <label htmlFor="file-upload" className="font-medium text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer">
            Click to browse
            </label>
        </div>
      </div>
      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
};

export default Dropzone;
