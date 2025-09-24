
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
  if (x > b && x < c) return (c - x) / (c - a);
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
      universo: crearUniverso(0, 4),
      funcionesMembresia: {
        'Pequena': { tipo: 'trapmf', parametros: [0, 0, 0.3, 0.7] },
        'Mediana': { tipo: 'trapmf', parametros: [0.5, 1, 1.5, 2] },
        'Grande': { tipo: 'trapmf', parametros: [1.8, 2.5, 4, 4] }
      }
    },
    DesvEstR: {
      nombre: 'DesvEstR',
      universo: crearUniverso(0, 4),
      funcionesMembresia: {
        'Baja': { tipo: 'trapmf', parametros: [0, 0, 1, 1.5] },
        'Media': { tipo: 'trapmf', parametros: [1.2, 1.5, 2.5, 2.8] },
        'Alta': { tipo: 'trapmf', parametros: [2.3, 2.5, 4, 4] }
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
      universo: crearUniverso(0, 35),
      funcionesMembresia: {
        'Reciente': { tipo: 'trapmf', parametros: [0, 0, 5, 7] },
        'Intermedio': { tipo: 'trapmf', parametros: [6, 8, 20, 22] },
        'Prolongado': { tipo: 'trapmf', parametros: [20, 22, 35, 35] }
      }
    },
    ControlGlu: {
      nombre: 'ControlGlu',
      universo: crearUniverso(5, 12),
      funcionesMembresia: {
        'Bueno': { tipo: 'trapmf', parametros: [5, 5, 6.5, 7] },
        'Regular': { tipo: 'trapmf', parametros: [6.8, 7, 8.5, 8.7] },
        'Malo': { tipo: 'trapmf', parametros: [8.5, 9, 12, 12] }
      }
    },
    Riesgo: {
      nombre: 'Riesgo',
      universo: crearUniverso(1, 3),
      funcionesMembresia: {
        'Bajo': { tipo: 'trimf', parametros: [1, 1.3, 2] },
        'Moderado': { tipo: 'trimf', parametros: [1.6, 2, 2.4] },
        'Alto': { tipo: 'trimf', parametros: [2.1, 2.5, 3] }
      }
    }
  };

  // Reglas difusas basadas en el código Python original
  const reglasTexto = [
    "3 3 0 0 0 0 0, 3", // Sensibilidad Ausente + Area Grande = Riesgo Alto
    "0 0 0 2 2 0 0, 3", // Secrecion Si + Eritema Si = Riesgo Alto
    "0 0 3 0 0 0 3, 3", // DesvEst Alta + Control Malo = Riesgo Alto
    "0 3 0 0 0 3 0, 3", // Area Grande + Tiempo Prolongado = Riesgo Alto
    "2 2 0 0 0 0 0, 2", // Sensibilidad Disminuida + Area Mediana = Riesgo Moderado
    "2 0 2 0 0 0 0, 2", // Sensibilidad Disminuida + DesvEst Media = Riesgo Moderado
    "1 1 0 1 0 0 0, 1", // Sensibilidad Normal + Area Pequeña + Secrecion No = Riesgo Bajo
    "1 0 1 0 1 0 0, 1", // Sensibilidad Normal + DesvEst Baja + Eritema No = Riesgo Bajo
    "0 1 0 0 0 1 0, 1", // Area Pequeña + Tiempo Reciente = Riesgo Bajo
    "1 0 0 0 0 0 0, 1"  // Sensibilidad Normal = Riesgo Bajo
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

// Evaluar sistema difuso usando centroide
export function evaluarSistemaDifuso(
  entradas: { [variable: string]: number },
  sistema: SistemaDifuso
): number {
  const universoSalida = sistema.variables.Riesgo.universo;
  const funcionesSalida = sistema.variables.Riesgo.funcionesMembresia;
  
  // Agregar activaciones de reglas
  const activacionesReglas: number[] = [];
  const consecuentesReglas: string[] = [];

  sistema.reglas.forEach(regla => {
    let activacion = 1.0;

    // Evaluar cada antecedente usando operación AND (mínimo)
    Object.entries(regla.antecedentes).forEach(([variable, funcionMf]) => {
      const valorEntrada = entradas[variable];
      if (valorEntrada !== undefined) {
        const funcionMembresia = sistema.variables[variable].funcionesMembresia[funcionMf];
        const gradoMembresia = evaluarMembresia(valorEntrada, funcionMembresia);
        activacion = Math.min(activacion, gradoMembresia);
      }
    });

    activacionesReglas.push(activacion * regla.peso);
    consecuentesReglas.push(regla.consecuente);
  });

  // Calcular centroide
  let numerador = 0;
  let denominador = 0;

  universoSalida.forEach(x => {
    let gradoMembresiaTotal = 0;

    // Combinar todas las reglas usando OR (máximo)
    activacionesReglas.forEach((activacion, idx) => {
      const consecuente = consecuentesReglas[idx];
      const funcionSalida = funcionesSalida[consecuente];
      const gradoMembresia = Math.min(activacion, evaluarMembresia(x, funcionSalida));
      gradoMembresiaTotal = Math.max(gradoMembresiaTotal, gradoMembresia);
    });

    numerador += x * gradoMembresiaTotal;
    denominador += gradoMembresiaTotal;
  });

  return denominador > 0 ? numerador / denominador : 2.0; // Valor por defecto
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
): { riesgo: number; nivelRiesgo: string; semaforoColor: string } {
  const sistema = inicializarSistemaDifuso();
  
  const entradas = {
    'Sensibilidad': Math.max(0, Math.min(6, sensibilidad)),
    'Area': Math.max(0, Math.min(4, area)),
    'DesvEstR': Math.max(0, Math.min(4, desvEstr)),
    'Secrecion': secrecion ? 1 : 0,
    'Eritema': eritema ? 1 : 0,
    'TiempoEvol': Math.max(0, Math.min(35, tiempoEvol)),
    'ControlGlu': Math.max(5, Math.min(12, controlGlu))
  };

  const riesgo = evaluarSistemaDifuso(entradas, sistema);
  const riesgoFinal = Math.max(1.0, Math.min(3.0, riesgo));

  let nivelRiesgo: string;
  let semaforoColor: string;

  if (riesgoFinal < 1.6) {
    nivelRiesgo = 'BAJO';
    semaforoColor = 'verde';
  } else if (riesgoFinal < 2.1) {
    nivelRiesgo = 'MODERADO';
    semaforoColor = 'amarillo';
  } else {
    nivelRiesgo = 'ALTO';
    semaforoColor = 'rojo';
  }

  return {
    riesgo: riesgoFinal,
    nivelRiesgo,
    semaforoColor
  };
}
