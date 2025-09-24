
'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';

interface SemaforoResultProps {
  riesgo: number;
  nivelRiesgo: string;
  semaforoColor: string;
  nombre?: string;
  className?: string;
}

export default function SemaforoResult({
  riesgo,
  nivelRiesgo,
  semaforoColor,
  nombre,
  className = ''
}: SemaforoResultProps) {
  const getIcon = () => {
    switch (semaforoColor) {
      case 'verde':
        return <CheckCircle className="w-8 h-8" />;
      case 'amarillo':
        return <AlertTriangle className="w-8 h-8" />;
      case 'rojo':
        return <XCircle className="w-8 h-8" />;
      default:
        return <Activity className="w-8 h-8" />;
    }
  };

  const getColorClasses = () => {
    switch (semaforoColor) {
      case 'verde':
        return 'semaforo-verde';
      case 'amarillo':
        return 'semaforo-amarillo';
      case 'rojo':
        return 'semaforo-rojo';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getGradientClasses = () => {
    switch (semaforoColor) {
      case 'verde':
        return 'from-green-500 to-green-600';
      case 'amarillo':
        return 'from-yellow-500 to-yellow-600';
      case 'rojo':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`card-shadow rounded-lg border-2 p-6 ${getColorClasses()} ${className}`}
    >
      <div className="flex items-center space-x-4">
        <div className={`rounded-full p-3 bg-gradient-to-r ${getGradientClasses()} text-white`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          {nombre && (
            <p className="text-sm font-medium opacity-80 mb-1">
              Paciente: {nombre}
            </p>
          )}
          <h3 className="text-xl font-bold">
            Riesgo: {nivelRiesgo}
          </h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold opacity-90"
          >
            Puntuación: {riesgo.toFixed(2)}
          </motion.p>
        </div>
        <div className="text-right">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getGradientClasses()}`}></div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-current/20">
        <p className="text-sm opacity-75">
          {semaforoColor === 'verde' && '✓ Bajo riesgo - Continúe con cuidados preventivos'}
          {semaforoColor === 'amarillo' && '⚠ Riesgo moderado - Monitoreo frecuente requerido'}
          {semaforoColor === 'rojo' && '⚡ Alto riesgo - Evaluación médica inmediata necesaria'}
        </p>
      </div>
    </motion.div>
  );
}
