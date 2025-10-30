import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import SettingsPanel from './components/SettingsPanel';
import ImageList from './components/ImageList';
import ComparisonModal from './components/ComparisonModal';
import { Settings, ProcessedImage, ProcessStatus, ImageInfo } from './types';
import Button from './components/Button';
import { DownloadIcon } from './components/icons/DownloadIcon';

// Declare JSZip global for TypeScript
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
  
  const compressImage = useCallback(async (image: ProcessedImage, options: Settings) => {
    updateImageState(image.id, { status: ProcessStatus.COMPRESSING });
    
    const targetBytes = options.targetSize * 1024;
    const img = new Image();
    img.src = image.originalImage.url;

    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          updateImageState(image.id, { status: ProcessStatus.ERROR, error: 'Canvas context failed.' });
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        let smallestResultBlob: Blob | null = null;

        const getWebpBlob = (quality: number): Promise<Blob | null> => {
            return new Promise(resolve => {
                canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
            });
        };

        // Iterate from high quality to low to find the best result under the target size
        for (let quality = 0.95; quality >= 0; quality -= 0.05) {
            const currentQuality = Math.max(0, quality); // Ensure quality is not negative
            const blob = await getWebpBlob(currentQuality);
            
            if (blob) {
              if (!smallestResultBlob || blob.size < smallestResultBlob.size) {
                  smallestResultBlob = blob;
              }

              if (blob.size <= targetBytes) {
                  const url = URL.createObjectURL(blob);
                  const newName = image.file.name.replace(/\.png$/i, '.webp');
                  const compressedImageInfo: ImageInfo = { url, size: blob.size, name: newName, blob };
                  
                  updateImageState(image.id, { status: ProcessStatus.SUCCESS, compressedImage: compressedImageInfo });
                  return; // Exit on first success
              }
            }
        }
        
        // If loop finishes without meeting target, use the smallest result we found
        if (smallestResultBlob && smallestResultBlob.size < image.originalImage.size) {
            const url = URL.createObjectURL(smallestResultBlob);
            const newName = image.file.name.replace(/\.png$/i, '.webp');
            const compressedImageInfo: ImageInfo = { url, size: smallestResultBlob.size, name: newName, blob: smallestResultBlob };
            updateImageState(image.id, { 
                status: ProcessStatus.OVER_TARGET, 
                compressedImage: compressedImageInfo, 
                error: `Smallest is ${Math.round(smallestResultBlob.size / 1024)}KB` 
            });
        } else {
            // If we couldn't make it smaller or compression failed
            updateImageState(image.id, { status: ProcessStatus.ERROR, error: 'Could not reduce size.' });
        }
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
    const imagesToDownload = images.filter(img => 
        (img.status === ProcessStatus.SUCCESS || img.status === ProcessStatus.OVER_TARGET) && img.compressedImage
    );
    
    if(imagesToDownload.length === 0) return;

    imagesToDownload.forEach(img => {
        zip.file(img.compressedImage!.name, img.compressedImage!.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'webp-compressed.zip';
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

  const downloadableCount = images.filter(img => 
    img.status === ProcessStatus.SUCCESS || img.status === ProcessStatus.OVER_TARGET
  ).length;

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
                        disabled={downloadableCount === 0}
                    >
                        <DownloadIcon />
                        Download All ({downloadableCount}) as ZIP
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
        <p>&copy; {new Date().getFullYear()} WebPSlim. All rights reserved.</p>
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