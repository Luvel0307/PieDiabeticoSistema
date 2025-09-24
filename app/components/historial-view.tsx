
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, TrendingUp, TrendingDown, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import SemaforoResult from '@/components/ui/semaforo-result';
import { generateMedicalPDF } from '@/lib/pdf-generator';

interface Evaluacion {
  id: number;
  fechaHora: string;
  paciente: {
    id: number;
    nombre: string;
  };
  sensibilidad: number;
  tiempoEvolucion: number;
  controlGlucemico: number;
  secrecion: boolean;
  eritema: boolean;
  areaLesion: number;
  desvEstR: number;
  mediaR: number;
  mediaG: number;
  mediaB: number;
  riesgo: number;
  nivelRiesgo: string;
  semaforoColor: string;
  evolArea?: string;
  evolDesv?: string;
  cloudStoragePath?: string;
}

export default function HistorialView() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistorial();
  }, []);

  const loadHistorial = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/evaluaciones');
      
      if (!response.ok) {
        throw new Error('Error al cargar historial');
      }

      const data = await response.json();
      setEvaluaciones(data.evaluaciones || []);

    } catch (error) {
      console.error('Error loading historial:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvaluaciones = evaluaciones.filter(evaluacion =>
    evaluacion.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGeneratePDF = async (evaluacion: Evaluacion) => {
    try {
      toast.info('Generando PDF médico...');
      
      // Prepare data for PDF generation
      const evaluacionData = {
        ...evaluacion,
        paciente: {
          nombre: evaluacion.paciente.nombre
        },
        evolArea: evaluacion.evolArea || '',
        evolDesv: evaluacion.evolDesv || ''
      };
      
      await generateMedicalPDF(evaluacionData);
      toast.success('PDF generado exitosamente');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF médico');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Historial de Evaluaciones</h2>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre de paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input max-w-xs"
          />
        </div>
      </div>

      {filteredEvaluaciones.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay evaluaciones</h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'No se encontraron evaluaciones que coincidan con la búsqueda'
              : 'Aún no hay evaluaciones registradas en el sistema'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvaluaciones.map((evaluacion, index) => (
            <motion.div
              key={evaluacion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-lg border card-shadow p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <h3 className="text-lg font-semibold">{evaluacion.paciente.nombre}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {formatDate(evaluacion.fechaHora)}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sensibilidad:</span>
                      <br />
                      <span className="font-medium">{evaluacion.sensibilidad}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Área lesión:</span>
                      <br />
                      <span className="font-medium">{evaluacion.areaLesion.toFixed(2)} cm²</span>
                      {evaluacion.evolArea && (
                        <div className={`text-xs flex items-center gap-1 mt-1 ${
                          evaluacion.evolArea.includes('+') 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {evaluacion.evolArea.includes('+') 
                            ? <TrendingUp className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />
                          }
                          {evaluacion.evolArea}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Desv. R:</span>
                      <br />
                      <span className="font-medium">{evaluacion.desvEstR.toFixed(2)}</span>
                      {evaluacion.evolDesv && (
                        <div className={`text-xs flex items-center gap-1 mt-1 ${
                          evaluacion.evolDesv.includes('+') 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {evaluacion.evolDesv.includes('+') 
                            ? <TrendingUp className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />
                          }
                          {evaluacion.evolDesv}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Control Gluc:</span>
                      <br />
                      <span className="font-medium">{evaluacion.controlGlucemico}%</span>
                    </div>
                  </div>
                </div>

                <div className="lg:w-72 space-y-3">
                  <SemaforoResult
                    riesgo={evaluacion.riesgo}
                    nivelRiesgo={evaluacion.nivelRiesgo}
                    semaforoColor={evaluacion.semaforoColor}
                    className="text-sm"
                  />
                  
                  <button
                    onClick={() => handleGeneratePDF(evaluacion)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Generar PDF
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
