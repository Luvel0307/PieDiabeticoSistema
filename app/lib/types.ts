
export interface DatosEvaluacion {
  nombre: string;
  sensibilidad: number; // 0-6
  tiempoEvolucion: number; // días 0-35
  controlGlucemico: number; // 5-12
  secrecion: boolean;
  eritema: boolean;
}

export interface ResultadosImagen {
  areaLesion: number;
  desvEstR: number;
  mediaR: number;
  mediaG: number;
  mediaB: number;
  cloudStoragePath: string;
}

export interface ResultadoEvaluacion {
  riesgo: number;
  nivelRiesgo: 'BAJO' | 'MODERADO' | 'ALTO';
  semaforoColor: 'verde' | 'amarillo' | 'rojo';
  evolArea?: string;
  evolDesv?: string;
}

export interface VariableDifusa {
  nombre: string;
  universo: number[];
  funcionesMembresia: { [key: string]: FuncionMembresia };
}

export interface FuncionMembresia {
  tipo: 'trapmf' | 'trimf';
  parametros: number[];
}

export interface ReglaDifusa {
  antecedentes: { [variable: string]: string };
  consecuente: string;
  peso: number;
}

export interface SistemaDifuso {
  variables: { [nombre: string]: VariableDifusa };
  reglas: ReglaDifusa[];
}

export interface Evaluacion {
  id: number;
  fechaHora: Date;
  pacienteId: number;
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
  cloudStoragePath: string | null;
  riesgo: number;
  nivelRiesgo: string;
  semaforoColor: string;
  evolArea: string | null;
  evolDesv: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Paciente {
  id: number;
  nombre: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  evaluaciones?: Evaluacion[];
}
