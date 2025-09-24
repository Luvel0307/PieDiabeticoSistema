
'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ImageCaptureProps {
  onImageCapture: (file: File) => void;
  className?: string;
}

export default function ImageCapture({ onImageCapture, className = '' }: ImageCaptureProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Cámara trasera preferida
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setMode('camera');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('No se pudo acceder a la cámara. Por favor, seleccione un archivo.');
      setMode('select');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    ctx.drawImage(video, 0, 0);

    // Convertir a blob y crear archivo
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `captura_${timestamp}.jpg`, { type: 'image/jpeg' });
        
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setMode('preview');
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccione un archivo de imagen válido');
      return;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setMode('preview');
  };

  const confirmImage = () => {
    if (imageFile) {
      onImageCapture(imageFile);
      toast.success('Imagen capturada correctamente');
    }
  };

  const resetCapture = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageFile(null);
    setImageUrl('');
    setMode('select');
    stopCamera();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {mode === 'select' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-muted-foreground">
            Sube una imagen de la lesión para análisis
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={startCamera}
              disabled={isCapturing}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              {isCapturing ? 'Iniciando cámara...' : 'Tomar Foto'}
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Cargar Imagen
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      )}

      {mode === 'camera' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-96 object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-white/50 m-4 rounded-lg pointer-events-none" />
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={captureImage}
              className="btn-primary flex items-center gap-2"
            >
              <Camera size={20} />
              Capturar
            </button>
            
            <button
              onClick={resetCapture}
              className="btn-secondary flex items-center gap-2"
            >
              <X size={20} />
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {mode === 'preview' && imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt="Vista previa de la imagen capturada"
              fill
              className="object-contain"
            />
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={confirmImage}
              className="btn-primary flex items-center gap-2"
            >
              <Camera size={20} />
              Analizar Imagen
            </button>
            
            <button
              onClick={resetCapture}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw size={20} />
              Tomar Otra
            </button>
          </div>
        </motion.div>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
