import React from 'react';
import { ProcessedImage, ProcessStatus } from '../types';
import Spinner from './Spinner';
import { CheckIcon } from './icons/CheckIcon';
import { ErrorIcon } from './icons/ErrorIcon';

interface ImageListItemProps {
  image: ProcessedImage;
  onClick: (image: ProcessedImage) => void;
}

const formatBytes = (bytes: number, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


const ImageListItem: React.FC<ImageListItemProps> = ({ image, onClick }) => {
    const { status, originalImage, compressedImage } = image;

    const renderStatus = () => {
        switch (status) {
            case ProcessStatus.COMPRESSING:
                return (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-xs text-light-text">
                        <Spinner />
                        <span className="mt-1">Compressing...</span>
                    </div>
                );
            case ProcessStatus.SUCCESS:
            case ProcessStatus.OVER_TARGET:
                if (!compressedImage) return null;
                const savings = ((originalImage.size - compressedImage.size) / originalImage.size) * 100;
                const isSuccess = status === ProcessStatus.SUCCESS;
                return (
                    <div 
                        className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer p-2"
                        onClick={() => onClick(image)}
                    >
                        <p className={`text-lg font-bold ${isSuccess ? 'text-green-400' : 'text-yellow-400'}`}>{savings.toFixed(1)}%</p>
                        <p className="text-xs text-medium-text">Saved</p>
                        {!isSuccess && <p className="mt-1 text-xs text-yellow-400 font-semibold">{image.error}</p>}
                        <p className="mt-2 text-xs font-semibold">Click to compare</p>
                    </div>
                );
             case ProcessStatus.ERROR:
                 return (
                    <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center text-xs text-light-text p-2 text-center">
                        <ErrorIcon className="w-6 h-6 text-red-400" />
                        <span className="mt-1 font-semibold">{image.error}</span>
                    </div>
                 );
            default:
                return null;
        }
    }

  return (
    <div className="bg-dark-card rounded-lg shadow-lg overflow-hidden relative group">
      <div className="aspect-square w-full bg-dark-bg flex items-center justify-center">
          <img src={originalImage.url} alt={originalImage.name} className="max-w-full max-h-full object-contain" />
      </div>
      <div className="p-2 text-xs">
        <p className="font-bold text-light-text truncate" title={originalImage.name}>{originalImage.name}</p>
        <div className="flex justify-between items-center text-medium-text mt-1">
            <span>{formatBytes(originalImage.size)}</span>
            {(status === ProcessStatus.SUCCESS || status === ProcessStatus.OVER_TARGET) && compressedImage && (
                <>
                <span className="font-mono text-light-text">→</span>
                <span className={`font-bold ${status === ProcessStatus.SUCCESS ? 'text-green-400' : 'text-yellow-400'}`}>
                    {formatBytes(compressedImage.size)}
                </span>
                </>
            )}
            {status === ProcessStatus.ERROR && <span className="font-bold text-red-400">Failed</span>}
        </div>
      </div>
      {renderStatus()}
    </div>
  );
};

export default ImageListItem;