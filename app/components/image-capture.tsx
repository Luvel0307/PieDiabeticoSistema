
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, Circle, CheckCircle, Smartphone, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ImageCaptureProps {
  onImageCapture: (file: File) => void;
  className?: string;
}

export default function ImageCapture({ onImageCapture, className = '' }: ImageCaptureProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview' | 'native-camera'>('select');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showCaptureButton, setShowCaptureButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'unknown'>('unknown');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detectar tipo de dispositivo al cargar
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      const isMobileResult = isMobileDevice || (hasTouch && isSmallScreen);
      const deviceTypeResult = isMobileResult ? 'mobile' : 'desktop';
      
      console.log('🔍 Detectando dispositivo:', {
        userAgent: userAgent.slice(0, 50) + '...',
        isMobileDevice,
        hasTouch,
        isSmallScreen,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        finalResult: deviceTypeResult
      });
      
      setIsMobile(isMobileResult);
      setDeviceType(deviceTypeResult);
      
      toast.info(`📱 Dispositivo detectado: ${deviceTypeResult === 'mobile' ? 'Móvil' : 'Escritorio'}`, {
        duration: 2000
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Auto-mostrar botón de captura después de que la cámara esté lista
  useEffect(() => {
    if (cameraReady && mode === 'camera') {
      const timer = setTimeout(() => {
        setShowCaptureButton(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cameraReady, mode]);

  // Abrir cámara nativa en móviles
  const openNativeCamera = useCallback(() => {
    console.log('📱 Abriendo cámara nativa del dispositivo...');
    toast.info('📱 Abriendo la aplicación de cámara...');
    
    if (nativeCameraInputRef.current) {
      nativeCameraInputRef.current.click();
    }
  }, []);

  // Abrir cámara nativa en escritorio (diferente implementación)
  const openDesktopNativeCamera = useCallback(() => {
    console.log('💻 Intentando abrir cámara nativa de escritorio...');
    
    // Intentar diferentes métodos para abrir la cámara nativa en escritorio
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('windows')) {
      // Windows - intenta abrir Windows Camera
      try {
        window.open('ms-camera:', '_blank');
        toast.success('📷 Abriendo Windows Camera...');
      } catch (error) {
        // Fallback: usar input file con capture como alternativa
        console.log('Fallback: usando input file...');
        if (nativeCameraInputRef.current) {
          nativeCameraInputRef.current.click();
        }
        toast.info('📁 Si no abrió la cámara, use "Preview Web"');
      }
    } else if (userAgent.includes('mac')) {
      // macOS - no hay protocolo directo, usar fallback
      console.log('macOS detectado, usando fallback...');
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      }
      toast.info('💡 En Mac, recomendamos usar "Preview Web" para mejor experiencia');
    } else {
      // Linux u otros - usar fallback
      console.log('Sistema no Windows/Mac, usando fallback...');
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      }
      toast.info('💡 Use "Preview Web" para acceso directo a la cámara');
    }
  }, []);

  // Abrir galería/archivos
  const openGallery = useCallback(() => {
    console.log('📁 Abriendo galería/archivos...');
    toast.info('📁 Selecciona una imagen...');
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      setCameraReady(false);
      setShowCaptureButton(false);

      // Verificar si getUserMedia está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de cámara no disponible en este navegador');
      }

      // Intentar diferentes configuraciones de cámara
      let stream: MediaStream | null = null;
      
      // Primer intento: cámara trasera para móviles
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        });
        console.log('✅ Cámara trasera activada');
      } catch (error) {
        console.log('⚠️ Cámara trasera no disponible, probando cámara frontal...');
        
        // Segundo intento: cualquier cámara disponible
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            }
          });
          console.log('✅ Cámara frontal activada');
        } catch (error2) {
          console.log('⚠️ Configuración específica falló, usando configuración básica...');
          
          // Tercer intento: configuración mínima
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          console.log('✅ Cámara básica activada');
        }
      }

      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata cargado');
          setCameraReady(true);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('▶️ Video listo para reproducir');
          setCameraReady(true);
        };
        
        setMode('camera');
        toast.success('📱 Cámara activada - Presiona el círculo para capturar');
      }
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      let errorMessage = 'No se pudo acceder a la cámara. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += '🚫 Permisos de cámara denegados. Por favor, permita el acceso a la cámara en su navegador.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += '📷 No se encontró una cámara en su dispositivo.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += '🌐 Su navegador no soporta el acceso a la cámara.';
        } else {
          errorMessage += error.message;
        }
      }
      
      toast.error(errorMessage);
      
      // Mostrar alternativas
      toast.info('💡 Puede usar "Cargar Imagen" como alternativa');
      setMode('select');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Decidir qué método de captura usar basado en el dispositivo
  const handleCameraCapture = useCallback(() => {
    if (deviceType === 'mobile') {
      console.log('📱 Usando cámara nativa para móvil');
      openNativeCamera();
    } else {
      console.log('🖥️ Usando cámara web para escritorio');
      startCamera();
    }
  }, [deviceType, openNativeCamera, startCamera]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Deteniendo cámara...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔌 Track detenido:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setShowCaptureButton(false);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      toast.error('⚠️ Cámara no está lista para capturar');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      toast.error('❌ Error al acceder al canvas');
      return;
    }

    try {
      // Verificar que el video tiene dimensiones válidas
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error('⚠️ Video sin dimensiones válidas. Reintente en un momento.');
        return;
      }

      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log(`📐 Capturando imagen: ${video.videoWidth}x${video.videoHeight}`);

      // Dibujar el frame actual del video en el canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir a blob y crear archivo
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().getTime();
          const file = new File([blob], `lesion_captura_${timestamp}.jpg`, { 
            type: 'image/jpeg',
            lastModified: timestamp 
          });
          
          console.log('📷 Imagen capturada:', file.name, `${(file.size / 1024).toFixed(1)} KB`);
          
          setImageFile(file);
          setImageUrl(URL.createObjectURL(file));
          setMode('preview');
          stopCamera();
          
          toast.success('✅ ¡Foto capturada exitosamente!');
        } else {
          toast.error('❌ Error al crear archivo de imagen');
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('❌ Error capturing image:', error);
      toast.error('Error al capturar la imagen. Inténtelo nuevamente.');
    }
  }, [cameraReady, stopCamera]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Archivo seleccionado:', file.name, file.type, `${(file.size / 1024).toFixed(1)} KB`);

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('⚠️ Por favor seleccione un archivo de imagen válido (JPG, PNG, etc.)');
      return;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('📏 El archivo es demasiado grande. Máximo 10MB permitido');
      return;
    }

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setMode('preview');
    toast.success('✅ Imagen cargada correctamente');
  };

  const confirmImage = () => {
    if (imageFile) {
      console.log('✔️ Confirmando imagen:', imageFile.name);
      onImageCapture(imageFile);
      toast.success('🎯 Imagen enviada para análisis');
    }
  };

  const resetCapture = () => {
    console.log('🔄 Reiniciando captura...');
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageFile(null);
    setImageUrl('');
    setMode('select');
    stopCamera();
    toast.info('🔄 Listo para nueva captura');
  };

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando recursos del componente ImageCapture...');
      stopCamera();
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [stopCamera, imageUrl]);

  return (
    <div className={`space-y-4 ${className}`}>
      {mode === 'select' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-muted-foreground mb-6">
            📸 Capture o seleccione una imagen de la lesión para análisis
          </p>
          
          {/* Indicador de dispositivo */}
          {deviceType !== 'unknown' && (
            <div className="flex items-center justify-center gap-2 mb-4">
              {deviceType === 'mobile' ? (
                <>
                  <Smartphone size={16} className="text-blue-600" />
                  <span className="text-sm text-muted-foreground">
                    📱 Dispositivo móvil detectado
                  </span>
                </>
              ) : (
                <>
                  <Monitor size={16} className="text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    🖥️ Escritorio detectado
                  </span>
                </>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {deviceType === 'mobile' ? (
              // Botones optimizados para móvil
              <>
                <div className="text-center">
                  <button
                    onClick={openNativeCamera}
                    className="btn-primary flex items-center justify-center gap-3 px-6 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Camera size={24} />
                    📱 Tomar Foto
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">Abre tu cámara nativa</p>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={openGallery}
                    className="btn-secondary flex items-center justify-center gap-3 px-6 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Upload size={24} />
                    📁 Cargar Imagen
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">Selecciona de tu galería</p>
                </div>
              </>
            ) : (
              // Botones para escritorio
              <>
                <div className="text-center">
                  <button
                    onClick={startCamera}
                    disabled={isCapturing}
                    className="btn-primary flex items-center justify-center gap-3 px-6 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    <Camera size={24} />
                    {isCapturing ? '⏳ Iniciando...' : '🖥️ Tomar Foto'}
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">Vista previa con captura</p>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={openGallery}
                    className="btn-secondary flex items-center justify-center gap-3 px-6 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Upload size={24} />
                    📁 Cargar Archivo
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">Selecciona archivo existente</p>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            💡 Asegúrese de tener buena iluminación para mejores resultados
          </p>

          {/* Input para galería/archivos (SIN capture) - Solo abre galería */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/heic,image/heif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Input para cámara nativa (CON capture) - Abre cámara directamente */}
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onClick={cameraReady ? captureImage : undefined}
              className={`w-full h-auto max-h-[70vh] object-cover ${
                cameraReady ? 'cursor-pointer hover:brightness-110' : ''
              } transition-all`}
              style={{ minHeight: '300px' }}
            />
            
            {/* Guía de enfoque */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-lg flex items-center justify-center">
                <div className="bg-black/40 px-3 py-1 rounded-full">
                  <span className="text-white text-sm">
                    {deviceType === 'desktop' 
                      ? '🖱️ Haz clic aquí para capturar' 
                      : '🎯 Enfoque la lesión aquí'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Estado de la cámara */}
            <div className="absolute top-4 left-4 z-10">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                cameraReady ? 'bg-green-600/80 text-white' : 'bg-orange-600/80 text-white'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  cameraReady ? 'bg-green-300 animate-pulse' : 'bg-orange-300'
                }`} />
                {cameraReady ? '✅ Listo' : '⏳ Preparando...'}
              </div>
            </div>

            {/* Indicador de clic para escritorio */}
            {cameraReady && deviceType === 'desktop' && (
              <div className="absolute bottom-4 right-4 z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  <Circle size={12} className="fill-current" />
                  Clic para capturar
                </motion.div>
              </div>
            )}
          </div>
          
          {/* Botones de captura - Estilo móvil */}
          <div className="flex items-center justify-center gap-6 py-4">
            <button
              onClick={resetCapture}
              className="flex items-center justify-center w-16 h-16 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              <X size={24} />
            </button>
            
            {/* Botón de captura principal - estilo cámara móvil */}
            <motion.button
              onClick={captureImage}
              disabled={!cameraReady}
              className={`flex items-center justify-center w-20 h-20 rounded-full transition-all shadow-xl ${
                cameraReady 
                  ? 'bg-white hover:bg-gray-100 text-gray-800 cursor-pointer hover:scale-105 active:scale-95' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
              }`}
              whileHover={{ scale: cameraReady ? 1.05 : 1 }}
              whileTap={{ scale: cameraReady ? 0.95 : 1 }}
              animate={cameraReady ? { 
                boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0.4)", "0 0 0 20px rgba(59, 130, 246, 0)"] 
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                cameraReady ? 'border-blue-500 bg-blue-500' : 'border-gray-500 bg-gray-500'
              }`}>
                <Circle size={32} className="text-white fill-current" />
              </div>
            </motion.button>
            
            <div className="w-16 h-16"></div> {/* Espaciador para centrar */}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {!cameraReady 
                ? '⏳ Preparando cámara web, por favor espere...' 
                : deviceType === 'desktop'
                  ? '🖱️ Enfoca la lesión y haz clic en la pantalla para capturar'
                  : '📷 Enfoca la lesión y presiona el círculo para capturar'
              }
            </p>
            {cameraReady && (
              <p className="text-xs text-muted-foreground mt-1">
                💡 Asegúrate de que la lesión esté dentro del recuadro punteado
              </p>
            )}
          </div>
        </motion.div>
      )}

      {mode === 'preview' && imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={imageUrl}
              alt="Vista previa de la imagen capturada"
              fill
              className="object-contain"
            />
            
            {/* Overlay de confirmación */}
            <div className="absolute top-4 right-4 bg-green-600/90 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm">
              <CheckCircle size={16} />
              Capturada
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={confirmImage}
              className="btn-primary flex items-center justify-center gap-3 px-8 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <CheckCircle size={24} />
              ✅ Analizar Imagen
            </button>
            
            <button
              onClick={resetCapture}
              className="btn-secondary flex items-center justify-center gap-3 px-8 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <RotateCcw size={24} />
              🔄 Tomar Otra
            </button>
          </div>

          {imageFile && (
            <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p>📋 <strong>Archivo:</strong> {imageFile.name}</p>
              <p>📏 <strong>Tamaño:</strong> {(imageFile.size / 1024).toFixed(1)} KB</p>
              <p>🖼️ <strong>Tipo:</strong> {imageFile.type}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
