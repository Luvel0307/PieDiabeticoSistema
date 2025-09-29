
import { SistemaDifuso, ReglaDifusa, VariableDifusa, FuncionMembresia } from './types';

// Crear universo de discurso
export function crearUniverso(limiteInf: number, limiteSup: number, puntos: number = 101): number[] {
  const step = (limiteSup - limiteInf) / (puntos - 1);
  return Array.from({ length: puntos }, (_, i) => limiteInf + i * step);
}

// Función de membresía trapezoidal
export function trapmf(x: number, abcd: number[]): number {
  const [a, b, c, d] = abcd;
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > c && x < d) return (d - x) / (d - c);
  return 0;
}

// Función de membresía triangular
export function trimf(x: number, abc: number[]): number {
  const [a, b, c] = abc;
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
  return 0;
}

// Evaluar función de membresía
export function evaluarMembresia(x: number, funcion: FuncionMembresia): number {
  switch (funcion.tipo) {
    case 'trapmf':
      return trapmf(x, funcion.parametros);
    case 'trimf':
      return trimf(x, funcion.parametros);
    default:
      return 0;
  }
}

// Inicializar sistema difuso para pie diabético
export function inicializarSistemaDifuso(): SistemaDifuso {
  const variables: { [nombre: string]: VariableDifusa } = {
    Sensibilidad: {
      nombre: 'Sensibilidad',
      universo: crearUniverso(0, 6),
      funcionesMembresia: {
        'Normal': { tipo: 'trapmf', parametros: [4, 5, 6, 6] },
        'Disminuida': { tipo: 'trapmf', parametros: [1, 2, 4, 5] },
        'Ausente': { tipo: 'trapmf', parametros: [0, 0, 1, 2] }
      }
    },
    Area: {
      nombre: 'Area',
      universo: crearUniverso(0, 50), // Ampliado para manejar valores como 20.84
      funcionesMembresia: {
        'Pequena': { tipo: 'trapmf', parametros: [0, 0, 0.5, 1] },
        'Mediana': { tipo: 'trapmf', parametros: [0.5, 1, 2, 3] },
        'Grande': { tipo: 'trapmf', parametros: [2, 3, 50, 50] }
      }
    },
    DesvEstR: {
      nombre: 'DesvEstR',
      universo: crearUniverso(0, 5000), // Ampliado para manejar valores como 3710
      funcionesMembresia: {
        'Baja': { tipo: 'trapmf', parametros: [0, 0, 1.5, 2] },
        'Media': { tipo: 'trapmf', parametros: [1.5, 2, 2.5, 3] },
        'Alta': { tipo: 'trapmf', parametros: [2.5, 3, 5000, 5000] }
      }
    },
    Secrecion: {
      nombre: 'Secrecion',
      universo: crearUniverso(0, 1),
      funcionesMembresia: {
        'No': { tipo: 'trapmf', parametros: [0, 0, 0.4, 0.6] },
        'Si': { tipo: 'trapmf', parametros: [0.4, 0.6, 1, 1] }
      }
    },
    Eritema: {
      nombre: 'Eritema',
      universo: crearUniverso(0, 1),
      funcionesMembresia: {
        'No': { tipo: 'trapmf', parametros: [0, 0, 0.4, 0.6] },
        'Si': { tipo: 'trapmf', parametros: [0.4, 0.6, 1, 1] }
      }
    },
    TiempoEvol: {
      nombre: 'TiempoEvol',
      universo: crearUniverso(0, 50),
      funcionesMembresia: {
        'Reciente': { tipo: 'trapmf', parametros: [0, 0, 5, 7] },
        'Intermedio': { tipo: 'trapmf', parametros: [6, 8, 20, 22] },
        'Prolongado': { tipo: 'trapmf', parametros: [20, 22, 50, 50] }
      }
    },
    ControlGlu: {
      nombre: 'ControlGlu',
      universo: crearUniverso(5, 15),
      funcionesMembresia: {
        'Bueno': { tipo: 'trapmf', parametros: [5, 5, 6.5, 7] },
        'Regular': { tipo: 'trapmf', parametros: [6.8, 7, 8.5, 8.7] },
        'Malo': { tipo: 'trapmf', parametros: [8.5, 9, 15, 15] }
      }
    },
    Riesgo: {
      nombre: 'Riesgo',
      universo: crearUniverso(1, 3),
      funcionesMembresia: {
        'Bajo': { tipo: 'trimf', parametros: [1, 1.3, 1.8] },
        'Moderado': { tipo: 'trimf', parametros: [1.5, 2, 2.5] },
        'Alto': { tipo: 'trimf', parametros: [2.2, 2.7, 3] }
      }
    }
  };

  // Reglas difusas balanceadas - evita dominancia de un solo factor
  const reglasTexto = [
    // REGLAS CRÍTICAS DE ALTO RIESGO (requieren múltiples factores)
    "3 3 0 0 0 0 0, 3", // Sensibilidad Ausente + Area Grande = Riesgo Alto
    "3 0 3 0 0 0 0, 3", // Sensibilidad Ausente + DesvEst Alta = Riesgo Alto
    "3 0 0 2 2 0 0, 3", // Sensibilidad Ausente + Secrecion Si + Eritema Si = Riesgo Alto
    "3 0 0 0 0 0 3, 3", // Sensibilidad Ausente + Control Malo = Riesgo Alto
    "3 0 0 0 0 3 0, 3", // Sensibilidad Ausente + Tiempo Prolongado = Riesgo Alto
    "0 3 3 0 0 0 0, 3", // Area Grande + DesvEst Alta = Riesgo Alto
    "0 3 0 2 2 0 0, 3", // Area Grande + Secrecion Si + Eritema Si = Riesgo Alto
    "0 3 0 0 0 0 3, 3", // Area Grande + Control Malo = Riesgo Alto
    "0 3 0 0 0 3 0, 3", // Area Grande + Tiempo Prolongado = Riesgo Alto
    "0 0 3 2 2 0 0, 3", // DesvEst Alta + Secrecion Si + Eritema Si = Riesgo Alto
    "0 0 3 0 0 0 3, 3", // DesvEst Alta + Control Malo = Riesgo Alto
    "0 0 3 0 0 3 0, 3", // DesvEst Alta + Tiempo Prolongado = Riesgo Alto
    "0 0 0 2 2 3 0, 3", // Secrecion Si + Eritema Si + Tiempo Prolongado = Riesgo Alto
    "0 0 0 2 2 0 3, 3", // Secrecion Si + Eritema Si + Control Malo = Riesgo Alto
    "0 0 0 0 0 3 3, 3", // Tiempo Prolongado + Control Malo = Riesgo Alto
    
    // REGLAS FUERTES DE RIESGO BAJO (factores protectores dominantes)
    "1 0 0 1 1 0 1, 1", // Sensibilidad Normal + Sin Secreción + Sin Eritema + Control Bueno = Riesgo Bajo
    "1 1 0 1 0 0 1, 1", // Sensibilidad Normal + Area Pequeña + Sin Secreción + Control Bueno = Riesgo Bajo
    "1 1 1 1 1 1 1, 1", // Todos los factores normales = Riesgo Bajo
    "1 0 0 1 1 1 1, 1", // Sensibilidad Normal + Sin Secreción + Sin Eritema + Tiempo Reciente + Control Bueno = Riesgo Bajo
    "1 1 1 1 0 0 1, 1", // Sensibilidad Normal + Area Pequeña + DesvEst Baja + Sin Secreción + Control Bueno = Riesgo Bajo
    "1 0 1 1 1 0 1, 1", // Sensibilidad Normal + DesvEst Baja + Sin Secreción + Sin Eritema + Control Bueno = Riesgo Bajo
    "1 1 0 1 1 0 1, 1", // Sensibilidad Normal + Area Pequeña + Sin Secreción + Sin Eritema + Control Bueno = Riesgo Bajo
    "1 0 0 0 0 1 1, 1", // Sensibilidad Normal + Tiempo Reciente + Control Bueno = Riesgo Bajo
    "1 1 0 0 0 1 1, 1", // Sensibilidad Normal + Area Pequeña + Tiempo Reciente + Control Bueno = Riesgo Bajo
    "1 0 1 0 0 1 1, 1", // Sensibilidad Normal + DesvEst Baja + Tiempo Reciente + Control Bueno = Riesgo Bajo
    
    // REGLAS DE RIESGO MODERADO (factores mixtos o individuales de riesgo)
    "2 0 0 0 0 0 0, 2", // Solo Sensibilidad Disminuida = Riesgo Moderado
    "0 2 0 0 0 0 0, 2", // Solo Area Mediana = Riesgo Moderado
    "0 0 2 0 0 0 0, 2", // Solo DesvEst Media = Riesgo Moderado
    "0 0 0 0 0 0 2, 2", // Solo Control Regular = Riesgo Moderado
    "0 0 0 0 0 2 0, 2", // Solo Tiempo Intermedio = Riesgo Moderado
    "0 0 0 2 0 0 0, 2", // Solo Secreción Si = Riesgo Moderado
    "0 0 0 0 2 0 0, 2", // Solo Eritema Si = Riesgo Moderado
    "2 2 0 0 0 0 0, 2", // Sensibilidad Disminuida + Area Mediana = Riesgo Moderado
    "2 0 2 0 0 0 0, 2", // Sensibilidad Disminuida + DesvEst Media = Riesgo Moderado
    "2 0 0 0 0 0 2, 2", // Sensibilidad Disminuida + Control Regular = Riesgo Moderado
    "0 2 2 0 0 0 0, 2", // Area Mediana + DesvEst Media = Riesgo Moderado
    "0 2 0 0 0 0 2, 2", // Area Mediana + Control Regular = Riesgo Moderado
    "0 0 2 0 0 0 2, 2", // DesvEst Media + Control Regular = Riesgo Moderado
    "1 0 0 2 2 0 0, 2", // Sensibilidad Normal pero Secreción + Eritema = Riesgo Moderado
    "1 0 0 0 0 2 2, 2", // Sensibilidad Normal pero Tiempo + Control problemáticos = Riesgo Moderado
    
    // CASOS ESPECIALES - Un solo factor extremo puede ser moderado, pero no alto sin otros factores
    "0 3 0 0 0 0 0, 2", // Solo Area muy Grande = Riesgo Moderado (no Alto)
    "0 0 3 0 0 0 0, 2", // Solo DesvEst muy Alta = Riesgo Moderado (no Alto)
    "3 0 0 0 0 0 0, 2"  // Solo Sensibilidad muy Ausente = Riesgo Moderado (no Alto automáticamente)
  ];

  const mfs = [
    ["Normal", "Disminuida", "Ausente"],
    ["Pequena", "Mediana", "Grande"],
    ["Baja", "Media", "Alta"],
    ["No", "Si"],
    ["No", "Si"],
    ["Reciente", "Intermedio", "Prolongado"],
    ["Bueno", "Regular", "Malo"]
  ];

  const salidas = ["Bajo", "Moderado", "Alto"];

  const reglas: ReglaDifusa[] = [];

  reglasTexto.forEach(reglaTexto => {
    const partes = reglaTexto.split(",");
    if (partes.length < 2) return;

    const condiciones = partes[0].trim().split(" ").map(v => parseInt(v));
    const salida = parseInt(partes[1].trim()) - 1; // Convertir a índice 0-based

    const antecedentes: { [variable: string]: string } = {};
    const nombresVariables = ['Sensibilidad', 'Area', 'DesvEstR', 'Secrecion', 'Eritema', 'TiempoEvol', 'ControlGlu'];

    condiciones.forEach((valor, idx) => {
      if (valor > 0) {
        const nombreVariable = nombresVariables[idx];
        const nombreMf = mfs[idx][valor - 1];
        antecedentes[nombreVariable] = nombreMf;
      }
    });

    if (Object.keys(antecedentes).length > 0) {
      reglas.push({
        antecedentes,
        consecuente: salidas[salida],
        peso: 1.0
      });
    }
  });

  return { variables, reglas };
}

// Evaluar sistema difuso usando centroide (método mejorado basado en Python)
export function evaluarSistemaDifuso(
  entradas: { [variable: string]: number },
  sistema: SistemaDifuso
): number {
  const universoSalida = sistema.variables.Riesgo.universo;
  const funcionesSalida = sistema.variables.Riesgo.funcionesMembresia;
  
  // Mapear activaciones por consecuente
  const activacionesPorConsecuente: { [consecuente: string]: number } = {
    'Bajo': 0,
    'Moderado': 0,
    'Alto': 0
  };

  // Evaluar cada regla
  sistema.reglas.forEach(regla => {
    let activacion = 1.0;

    // Evaluar antecedentes usando AND (mínimo)
    Object.entries(regla.antecedentes).forEach(([variable, funcionMf]) => {
      const valorEntrada = entradas[variable];
      if (valorEntrada !== undefined) {
        const funcionMembresia = sistema.variables[variable].funcionesMembresia[funcionMf];
        const gradoMembresia = evaluarMembresia(valorEntrada, funcionMembresia);
        activacion = Math.min(activacion, gradoMembresia);
      }
    });

    // Acumular activación usando OR (máximo) por consecuente
    const consecuente = regla.consecuente;
    activacionesPorConsecuente[consecuente] = Math.max(
      activacionesPorConsecuente[consecuente],
      activacion * regla.peso
    );
  });

  // Calcular centroide usando las activaciones agregadas
  let numerador = 0;
  let denominador = 0;

  universoSalida.forEach(x => {
    let gradoMembresiaTotal = 0;

    // Para cada nivel de riesgo, calcular el grado de membresía recortado
    Object.entries(activacionesPorConsecuente).forEach(([consecuente, activacion]) => {
      if (activacion > 0) {
        const funcionSalida = funcionesSalida[consecuente];
        const gradoMembresia = Math.min(activacion, evaluarMembresia(x, funcionSalida));
        gradoMembresiaTotal = Math.max(gradoMembresiaTotal, gradoMembresia);
      }
    });

    numerador += x * gradoMembresiaTotal;
    denominador += gradoMembresiaTotal;
  });

  const resultado = denominador > 0 ? numerador / denominador : 2.0;
  
  // Asegurar que esté en el rango correcto [1, 3]
  return Math.max(1.0, Math.min(3.0, resultado));
}

// Función de depuración para verificar activación de reglas
export function debugEvaluacion(
  entradas: { [variable: string]: number },
  sistema: SistemaDifuso
): any {
  const debug: any = {
    entradas,
    reglasActivadas: []
  };

  sistema.reglas.forEach((regla, idx) => {
    let activacion = 1.0;
    const detallesAntecedentes: any = {};

    Object.entries(regla.antecedentes).forEach(([variable, funcionMf]) => {
      const valorEntrada = entradas[variable];
      if (valorEntrada !== undefined) {
        const funcionMembresia = sistema.variables[variable].funcionesMembresia[funcionMf];
        const gradoMembresia = evaluarMembresia(valorEntrada, funcionMembresia);
        activacion = Math.min(activacion, gradoMembresia);
        detallesAntecedentes[variable] = {
          valor: valorEntrada,
          funcion: funcionMf,
          grado: gradoMembresia
        };
      }
    });

    if (activacion > 0) {
      debug.reglasActivadas.push({
        indice: idx,
        antecedentes: detallesAntecedentes,
        consecuente: regla.consecuente,
        activacion
      });
    }
  });

  return debug;
}

// Función principal para evaluar riesgo de pie diabético
export function evaluarRiesgo(
  sensibilidad: number,
  area: number,
  desvEstr: number,
  secrecion: boolean,
  eritema: boolean,
  tiempoEvol: number,
  controlGlu: number
): { riesgo: number; nivelRiesgo: string; semaforoColor: string; debug?: any } {
  const sistema = inicializarSistemaDifuso();
  
  // Procesamiento con rangos ampliados para manejar valores extremos
  const entradas = {
    'Sensibilidad': Math.max(0, Math.min(6, sensibilidad)),
    'Area': Math.max(0, Math.min(50, area)), // Ampliado de 4 a 50
    'DesvEstR': Math.max(0, Math.min(5000, desvEstr)), // Ampliado de 4 a 5000
    'Secrecion': secrecion ? 1 : 0,
    'Eritema': eritema ? 1 : 0,
    'TiempoEvol': Math.max(0, Math.min(50, tiempoEvol)), // Ampliado de 35 a 50
    'ControlGlu': Math.max(5, Math.min(15, controlGlu)) // Ampliado de 12 a 15
  };

  console.log('🔍 ENTRADAS PROCESADAS PARA SISTEMA DIFUSO:', entradas);

  const riesgo = evaluarSistemaDifuso(entradas, sistema);
  const riesgoFinal = Math.max(1.0, Math.min(3.0, riesgo));

  // Debug información (solo en desarrollo)
  const debugInfo = debugEvaluacion(entradas, sistema);
  
  console.log('📊 DEBUG INFO - Reglas activadas:', debugInfo.reglasActivadas?.length || 0);
  debugInfo.reglasActivadas?.forEach((regla: any, idx: number) => {
    if (regla.activacion > 0) {
      console.log(`   Regla ${regla.indice}: ${JSON.stringify(regla.antecedentes)} → ${regla.consecuente} (activación: ${regla.activacion.toFixed(3)})`);
    }
  });

  let nivelRiesgo: string;
  let semaforoColor: string;

  // Clasificación balanceada que permite detección correcta de todos los niveles:
  // Bajo: [1, 1.3, 1.8] -> centro en 1.37
  // Moderado: [1.5, 2, 2.5] -> centro en 2  
  // Alto: [2.2, 2.7, 3] -> centro en 2.63
  
  if (riesgoFinal <= 1.7) {
    nivelRiesgo = 'BAJO';
    semaforoColor = 'verde';
  } else if (riesgoFinal <= 2.4) {
    nivelRiesgo = 'MODERADO';
    semaforoColor = 'amarillo';
  } else {
    nivelRiesgo = 'ALTO';
    semaforoColor = 'rojo';
  }

  console.log(`🎯 RESULTADO FINAL: Riesgo = ${riesgoFinal.toFixed(3)} → ${nivelRiesgo}`);

  return {
    riesgo: riesgoFinal,
    nivelRiesgo,
    semaforoColor,
    debug: debugInfo  // Solo para desarrollo, remove en producción si es necesario
  };
}
