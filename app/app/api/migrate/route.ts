
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'resultados_pacientes.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'Archivo CSV no encontrado' }, { status: 404 });
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'Archivo CSV vacío o inválido' }, { status: 400 });
    }

    // Obtener headers
    const headers = lines[0].split(',').map(h => h.trim());
    const migrados = [];
    const errores = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',');
        
        if (values.length < headers.length) continue;

        const registro: any = {};
        headers.forEach((header, idx) => {
          registro[header] = values[idx]?.trim() || null;
        });

        // Solo procesar registros con comparacion 'actual' o sin comparacion
        if (registro.Comparacion && registro.Comparacion !== 'actual') {
          continue;
        }

        if (!registro.Paciente || !registro.FechaHora) {
          continue;
        }

        // Buscar o crear paciente
        let paciente = await prisma.paciente.findFirst({
          where: { nombre: registro.Paciente }
        });

        if (!paciente) {
          paciente = await prisma.paciente.create({
            data: { nombre: registro.Paciente }
          });
        }

        // Parsear valores numéricos con valores por defecto
        const parseFloat = (value: string | null, defaultValue: number = 0) => {
          if (!value || value === '' || isNaN(Number(value))) return defaultValue;
          return Number(value);
        };

        const parseBool = (value: string | null) => {
          if (!value || value === '') return false;
          return parseFloat(value) > 0;
        };

        // Determinar nivel de riesgo y color del semáforo
        const riesgoVal = parseFloat(registro.Riesgo, 2.0);
        let nivelRiesgo = 'MODERADO';
        let semaforoColor = 'amarillo';

        if (riesgoVal < 1.6) {
          nivelRiesgo = 'BAJO';
          semaforoColor = 'verde';
        } else if (riesgoVal >= 2.1) {
          nivelRiesgo = 'ALTO';
          semaforoColor = 'rojo';
        }

        // Crear evaluación
        const evaluacion = await prisma.evaluacion.create({
          data: {
            pacienteId: paciente.id,
            fechaHora: new Date(registro.FechaHora),
            sensibilidad: parseFloat(registro.Sensibilidad, 0),
            tiempoEvolucion: Math.round(parseFloat(registro.TiempoEvol, 0)),
            controlGlucemico: parseFloat(registro.ControlGlu, 7),
            secrecion: parseBool(registro.Secrecion),
            eritema: parseBool(registro.Eritema),
            areaLesion: parseFloat(registro.AreaLesion, 0),
            desvEstR: parseFloat(registro.DesvEstR, 0),
            mediaR: parseFloat(registro.MediaR, 0),
            mediaG: parseFloat(registro.MediaG, 0),
            mediaB: parseFloat(registro.MediaB, 0),
            cloudStoragePath: null, // Las imágenes locales no se migran
            riesgo: riesgoVal,
            nivelRiesgo,
            semaforoColor,
            evolArea: registro.EvolArea || null,
            evolDesv: registro.EvolDesv || null
          }
        });

        migrados.push({
          paciente: paciente.nombre,
          evaluacionId: evaluacion.id,
          fecha: evaluacion.fechaHora
        });

      } catch (error) {
        errores.push({
          linea: i + 1,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      migrados: migrados.length,
      errores: errores.length,
      detalles: {
        migrados,
        errores: errores.slice(0, 10) // Solo primeros 10 errores
      }
    });

  } catch (error) {
    console.error('Error migrating CSV:', error);
    return NextResponse.json({ error: 'Error interno durante migración' }, { status: 500 });
  }
}
