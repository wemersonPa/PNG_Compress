import React from 'react';
import { ProcessedImage } from '../types';
import ImageListItem from './ImageListItem';

interface ImageListProps {
  images: ProcessedImage[];
  onImageClick: (image: ProcessedImage) => void;
}

const ImageList: React.FC<ImageListProps> = ({ images, onImageClick }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((image) => (
        <ImageListItem key={image.id} image={image} onClick={onImageClick} />
      ))}
    </div>
  );
};

export default ImageList;
