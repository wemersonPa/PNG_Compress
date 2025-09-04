import React from 'react';
import { ProcessedImage } from '../types';
import ImageComparator from './ImageComparator';

interface ComparisonModalProps {
  image: ProcessedImage;
  onClose: () => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ image, onClose }) => {
  if (!image.compressedImage) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-dark-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] p-4 flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex-shrink-0 flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold truncate" title={image.originalImage.name}>{image.originalImage.name}</h3>
            <button 
                onClick={onClose}
                className="text-medium-text hover:text-light-text"
                aria-label="Close"
            >&times;</button>
        </div>
        <div className="flex-grow min-h-0">
          <ImageComparator
            original={image.originalImage}
            compressed={image.compressedImage}
          />
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
