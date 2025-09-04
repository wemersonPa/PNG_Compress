import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import SettingsPanel from './components/SettingsPanel';
import ImageList from './components/ImageList';
import ComparisonModal from './components/ComparisonModal';
import { Settings, ProcessedImage, ProcessStatus, ImageInfo } from './types';
import Button from './components/Button';
import { DownloadIcon } from './components/icons/DownloadIcon';

// Declare UPNG.js and JSZip globals for TypeScript
declare const UPNG: any;
declare const JSZip: any;

const App: React.FC = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [settings, setSettings] = useState<Settings>({ targetSize: 200 });
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);

  const updateImageState = (id: string, updates: Partial<ProcessedImage>) => {
    setImages(prev => prev.map(img => (img.id === id ? { ...img, ...updates } : img)));
  };

  const hasTransparency = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(false);
        ctx.drawImage(image, 0, 0);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let i = 3; i < imageData.length; i += 4) {
            if (imageData[i] < 255) {
              URL.revokeObjectURL(image.src);
              return resolve(true);
            }
          }
        } catch (e) {
            console.error("Failed to read image data (CORS issue with local files?):", e);
        }
        URL.revokeObjectURL(image.src);
        resolve(false);
      };
      image.onerror = () => resolve(false);
    });
  };

  const handleFileSelect = async (files: File[]) => {
    setError(null);
    const newImages: ProcessedImage[] = [];

    for (const file of files) {
        if (file.type !== 'image/png') {
            setError(`Skipped ${file.name}: not a PNG file.`);
            continue;
        }
        const transparent = await hasTransparency(file);
        if (!transparent) {
            setError(`Skipped ${file.name}: not a PNG with transparency.`);
            continue;
        }

        const id = `${file.name}-${file.lastModified}-${Math.random()}`;
        const url = URL.createObjectURL(file);
        newImages.push({
            id,
            file,
            status: ProcessStatus.QUEUED,
            originalImage: { url, size: file.size, name: file.name, blob: file },
            compressedImage: null,
        });
    }
    setImages(prev => [...prev, ...newImages]);
  };
  
  /**
   * This is the core iterative compression logic.
   * It attempts to compress an image to meet the target size.
   * It starts with the highest quality (lossless) and progressively
   * reduces the number of colors (quantization) if the file is too large.
   */
  const compressImage = useCallback(async (image: ProcessedImage, options: Settings) => {
    updateImageState(image.id, { status: ProcessStatus.COMPRESSING });
    
    const targetBytes = options.targetSize * 1024;
    const img = new Image();
    img.src = image.originalImage.url;

    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          updateImageState(image.id, { status: ProcessStatus.ERROR, error: 'Canvas context failed.' });
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Quality loop: 100 is lossless, then step down from 95 to 30.
        // This corresponds to a decreasing number of colors for quantization.
        for (let quality = 100; quality >= 30; quality -= 5) {
            const minColors = 32;
            const maxColors = 256;
            // cnum = 0 means lossless. Otherwise, map quality to color count.
            const cnum = quality === 100 ? 0 : minColors + Math.round(((maxColors - minColors) * (quality - 30)) / (95 - 30));

            const pngBuffer = UPNG.encode([imageData.data.buffer], canvas.width, canvas.height, cnum);
            
            if (pngBuffer && (pngBuffer.byteLength <= targetBytes || quality === 30)) {
                const blob = new Blob([pngBuffer], { type: 'image/png' });
                const url = URL.createObjectURL(blob);
                const compressedImageInfo: ImageInfo = { url, size: blob.size, name: image.file.name, blob };
                
                updateImageState(image.id, { status: ProcessStatus.SUCCESS, compressedImage: compressedImageInfo });
                return; // Exit loop on success
            }
        }
        // If loop finishes without meeting target size (even at lowest quality)
        updateImageState(image.id, { status: ProcessStatus.ERROR, error: 'Could not meet target size.' });
    };
    img.onerror = () => {
        updateImageState(image.id, { status: ProcessStatus.ERROR, error: 'Could not load image file.' });
    };
  }, []);
  
  useEffect(() => {
    const queuedImages = images.filter(img => img.status === ProcessStatus.QUEUED);
    if (queuedImages.length > 0) {
      queuedImages.forEach(img => compressImage(img, settings));
    }
  }, [images, settings, compressImage]);

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const successfulImages = images.filter(img => img.status === ProcessStatus.SUCCESS && img.compressedImage);
    
    if(successfulImages.length === 0) return;

    successfulImages.forEach(img => {
        zip.file(img.file.name, img.compressedImage!.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'pngslim-compressed.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetState = () => {
    images.forEach(img => {
        URL.revokeObjectURL(img.originalImage.url);
        if(img.compressedImage) URL.revokeObjectURL(img.compressedImage.url);
    });
    setImages([]);
    setError(null);
  };

  const successfulCount = images.filter(img => img.status === ProcessStatus.SUCCESS).length;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
                <SettingsPanel settings={settings} onSettingsChange={setSettings} />
                 <div className="mt-6 flex flex-col space-y-4">
                    <Button 
                        variant="primary" 
                        className="w-full" 
                        onClick={handleDownloadZip}
                        disabled={successfulCount === 0}
                    >
                        <DownloadIcon />
                        Download All ({successfulCount}) as ZIP
                    </Button>
                    <Button variant="secondary" onClick={resetState} className="w-full">
                        Clear All
                    </Button>
                 </div>
            </div>
            <div className="lg:col-span-8">
                {images.length === 0 ? (
                    <Dropzone onFileSelect={handleFileSelect} error={error} />
                ) : (
                    <ImageList images={images} onImageClick={setSelectedImage} />
                )}
            </div>
        </div>
      </main>
      <footer className="text-center p-4 text-medium-text">
        <p>&copy; {new Date().getFullYear()} PNGSlim. All rights reserved.</p>
        <p>Your images are processed locally in your browser and are never uploaded.</p>
      </footer>
      {selectedImage && (
        <ComparisonModal 
            image={selectedImage} 
            onClose={() => setSelectedImage(null)} 
        />
      )}
    </div>
  );
};

export default App;
