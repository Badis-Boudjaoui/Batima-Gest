import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../lib/cropImage';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropCompleteAction: (croppedFile: File) => void;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for banner
  title?: string;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropCompleteAction,
  aspectRatio = 1,
  title = "Recadrer l'image"
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    
    try {
      setIsProcessing(true);
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropCompleteAction(croppedFile);
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors du recadrage.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && imageSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h2>
              <button 
                onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative w-full h-[60vh] max-h-[500px] bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-500">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Confirmer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
