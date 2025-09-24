
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Activity, Clock, Heart, FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ImageCapture from '@/components/image-capture';
import SemaforoResult from '@/components/ui/semaforo-result';
import { analyzeImage, ImageAnalysisResult } from '@/lib/image-analysis';

interface FormData {
  nombre: string;
  sensibilidad: number;
  tiempoEvolucion: number;
  controlGlucemico: number;
  secrecion: boolean;
  eritema: boolean;
}

interface EvaluationResult {
  riesgo: number;
  nivelRiesgo: string;
  semaforoColor: string;
  evolArea?: string;
  evolDesv?: string;
}

export default function EvaluacionForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    sensibilidad: 0,
    tiempoEvolucion: 0,
    controlGlucemico: 5,
    secrecion: false,
    eritema: false
  });

  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageCapture = async (file: File) => {
    try {
      setIsLoading(true);
      toast.info('Analizando imagen...');

      // Analizar imagen localmente
      const analysis = await analyzeImage(file);
      setImageAnalysis(analysis);
      setHasImage(true);

      // Subir imagen al servidor
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir imagen');
      }

      const uploadData = await uploadResponse.json();
      
      toast.success('Imagen analizada correctamente');
      setIsLoading(false);

    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Error al analizar la imagen');
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!formData.nombre.trim()) {
      toast.error('Por favor ingrese el nombre del paciente');
      return;
    }

    if (!hasImage || !imageAnalysis) {
      toast.error('Por favor capture o seleccione una imagen de la lesión');
      return;
    }

    try {
      setIsLoading(true);
      toast.info('Evaluando riesgo...');

      const response = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          ...imageAnalysis,
          cloudStoragePath: null // Se actualizará cuando la imagen se suba
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al evaluar');
      }

      const data = await response.json();
      
      setEvaluationResult({
        riesgo: data.evaluacion.riesgo,
        nivelRiesgo: data.evaluacion.nivelRiesgo,
        semaforoColor: data.evaluacion.semaforoColor,
        evolArea: data.evaluacion.evolArea,
        evolDesv: data.evaluacion.evolDesv
      });

      toast.success('Evaluación completada');

    } catch (error) {
      console.error('Error evaluating:', error);
      toast.error(error instanceof Error ? error.message : 'Error al evaluar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      nombre: '',
      sensibilidad: 0,
      tiempoEvolucion: 0,
      controlGlucemico: 5,
      secrecion: false,
      eritema: false
    });
    setImageAnalysis(null);
    setEvaluationResult(null);
    setHasImage(false);
    toast.info('Formulario limpiado');
  };

  return (
    <div className="space-y-6">
      {evaluationResult && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <SemaforoResult
            riesgo={evaluationResult.riesgo}
            nivelRiesgo={evaluationResult.nivelRiesgo}
            semaforoColor={evaluationResult.semaforoColor}
            nombre={formData.nombre}
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel izquierdo: Datos del Paciente */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-lg border card-shadow p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Datos del Paciente</h2>
          </div>

          <div className="space-y-4">
            {/* Nombre del Paciente */}
            <div className="input-group">
              <label className="form-label">Nombre del Paciente</label>
              <input
                type="text"
                placeholder="Ingrese el nombre completo"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className="form-input"
              />
            </div>

            {/* Sensibilidad */}
            <div className="input-group">
              <label className="form-label">
                <Activity className="w-4 h-4 inline mr-1" />
                Sensibilidad (0-6)
              </label>
              <input
                type="number"
                min="0"
                max="6"
                step="0.1"
                value={formData.sensibilidad}
                onChange={(e) => handleInputChange('sensibilidad', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
              <p className="text-xs text-muted-foreground">
                0 = Ausente, 6 = Normal
              </p>
            </div>

            {/* Tiempo Evolución */}
            <div className="input-group">
              <label className="form-label">
                <Clock className="w-4 h-4 inline mr-1" />
                Tiempo Evolución [días]
              </label>
              <input
                type="number"
                min="0"
                max="35"
                value={formData.tiempoEvolucion}
                onChange={(e) => handleInputChange('tiempoEvolucion', parseInt(e.target.value) || 0)}
                className="form-input"
              />
            </div>

            {/* Control Glucémico */}
            <div className="input-group">
              <label className="form-label">
                <Heart className="w-4 h-4 inline mr-1" />
                Control Glucémico (5-12)
              </label>
              <input
                type="number"
                min="5"
                max="12"
                step="0.1"
                value={formData.controlGlucemico}
                onChange={(e) => handleInputChange('controlGlucemico', parseFloat(e.target.value) || 5)}
                className="form-input"
              />
              <p className="text-xs text-muted-foreground">
                HbA1c en porcentaje
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="secrecion"
                  checked={formData.secrecion}
                  onChange={(e) => handleInputChange('secrecion', e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="secrecion" className="form-label">
                  ¿Secreción?
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="eritema"
                  checked={formData.eritema}
                  onChange={(e) => handleInputChange('eritema', e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="eritema" className="form-label">
                  ¿Eritema?
                </label>
              </div>
            </div>

            {/* Resultados del análisis */}
            {imageAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 rounded-lg p-4 space-y-2"
              >
                <h3 className="font-semibold text-sm">Resultados del Análisis:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Área lesión:</span>
                    <br />
                    <span className="font-semibold">{imageAnalysis.areaLesion.toFixed(2)} cm²</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Desv. Estándar R:</span>
                    <br />
                    <span className="font-semibold">{imageAnalysis.desvEstR.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Media RGB:</span>
                    <br />
                    <span className="font-semibold text-xs">
                      R:{imageAnalysis.mediaR.toFixed(0)} G:{imageAnalysis.mediaG.toFixed(0)} B:{imageAnalysis.mediaB.toFixed(0)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Panel derecho: Análisis de Imagen */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-lg border card-shadow p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-semibold">Análisis de Imagen</h2>
          </div>

          <ImageCapture onImageCapture={handleImageCapture} />
        </motion.div>
      </div>

      {/* Botones de acción */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3 justify-center pt-6 border-t"
      >
        <button
          onClick={handleEvaluate}
          disabled={isLoading || !hasImage || !formData.nombre.trim()}
          className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5" />
          {isLoading ? 'Evaluando...' : 'Evaluar Riesgo'}
        </button>

        <button
          onClick={handleClear}
          disabled={isLoading}
          className="btn-secondary flex items-center justify-center gap-2 px-8 py-3 text-lg"
        >
          <FileText className="w-5 h-5" />
          Limpiar Formulario
        </button>
      </motion.div>
    </div>
  );
}
