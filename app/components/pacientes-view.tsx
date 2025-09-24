
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Calendar, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface Paciente {
  id: number;
  nombre: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  evaluaciones: Array<{
    id: number;
    fechaHora: string;
    riesgo: number;
    nivelRiesgo: string;
    semaforoColor: string;
    areaLesion: number;
    desvEstR: number;
  }>;
}

export default function PacientesView() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pacientes');
      
      if (!response.ok) {
        throw new Error('Error al cargar pacientes');
      }

      const data = await response.json();
      setPacientes(data.pacientes || []);

    } catch (error) {
      console.error('Error loading pacientes:', error);
      toast.error('Error al cargar los pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPacientes = pacientes.filter(paciente =>
    paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRiskBadge = (nivelRiesgo: string, semaforoColor: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (semaforoColor) {
      case 'verde':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'amarillo':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rojo':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Cargando pacientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Pacientes</h2>
          <span className="text-sm text-muted-foreground">
            ({filteredPacientes.length} {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'})
          </span>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9 max-w-xs"
            />
          </div>
        </div>
      </div>

      {filteredPacientes.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay pacientes</h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'No se encontraron pacientes que coincidan con la búsqueda'
              : 'Aún no hay pacientes registrados en el sistema'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPacientes.map((paciente, index) => {
            const ultimaEvaluacion = paciente.evaluaciones[0];
            
            return (
              <motion.div
                key={paciente.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-lg border card-shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{paciente.nombre}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Registrado: {formatDate(paciente.fechaCreacion)}
                    </p>
                  </div>
                  
                  {ultimaEvaluacion && (
                    <span className={getRiskBadge(ultimaEvaluacion.nivelRiesgo, ultimaEvaluacion.semaforoColor)}>
                      {ultimaEvaluacion.nivelRiesgo}
                    </span>
                  )}
                </div>

                {ultimaEvaluacion ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity className="w-4 h-4" />
                      Última evaluación: {formatDate(ultimaEvaluacion.fechaHora)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Riesgo:</span>
                        <div className="font-semibold">{ultimaEvaluacion.riesgo.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Área:</span>
                        <div className="font-semibold">{ultimaEvaluacion.areaLesion.toFixed(2)} cm²</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Total evaluaciones: {paciente.evaluaciones.length}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">
                      Sin evaluaciones registradas
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
