
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando migración de datos desde CSV...');

  try {
    const csvPath = path.join(process.cwd(), 'public', 'resultados_pacientes.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ Archivo CSV no encontrado en:', csvPath);
      return;
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      console.error('❌ Archivo CSV vacío o inválido');
      return;
    }

    // Obtener headers
    const headers = lines[0].split(',').map(h => h.trim());
    console.log(`📊 Procesando ${lines.length - 1} registros...`);

    let migrados = 0;
    let errores = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',');
        
        if (values.length < headers.length) {
          continue;
        }

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
          console.log(`👤 Nuevo paciente creado: ${paciente.nombre}`);
        }

        // Función helper para parsear valores
        const parseFloatSafe = (value: string | null, defaultValue: number = 0): number => {
          if (!value || value === '' || isNaN(Number(value))) return defaultValue;
          return Number(value);
        };

        const parseBoolSafe = (value: string | null): boolean => {
          if (!value || value === '') return false;
          return parseFloatSafe(value) > 0;
        };

        // Determinar nivel de riesgo y color del semáforo
        const riesgoVal = parseFloatSafe(registro.Riesgo, 2.0);
        let nivelRiesgo = 'MODERADO';
        let semaforoColor = 'amarillo';

        if (riesgoVal < 1.6) {
          nivelRiesgo = 'BAJO';
          semaforoColor = 'verde';
        } else if (riesgoVal >= 2.1) {
          nivelRiesgo = 'ALTO';
          semaforoColor = 'rojo';
        }

        // Verificar si la evaluación ya existe
        const fechaEvaluacion = new Date(registro.FechaHora);
        const evaluacionExistente = await prisma.evaluacion.findFirst({
          where: {
            pacienteId: paciente.id,
            fechaHora: fechaEvaluacion
          }
        });

        if (evaluacionExistente) {
          console.log(`⏭ Evaluación ya existe para ${paciente.nombre} en ${fechaEvaluacion.toISOString()}`);
          continue;
        }

        // Crear evaluación
        const evaluacion = await prisma.evaluacion.create({
          data: {
            pacienteId: paciente.id,
            fechaHora: fechaEvaluacion,
            sensibilidad: parseFloatSafe(registro.Sensibilidad, 0),
            tiempoEvolucion: Math.round(parseFloatSafe(registro.TiempoEvol, 0)),
            controlGlucemico: parseFloatSafe(registro.ControlGlu, 7),
            secrecion: parseBoolSafe(registro.Secrecion),
            eritema: parseBoolSafe(registro.Eritema),
            areaLesion: parseFloatSafe(registro.AreaLesion, 0),
            desvEstR: parseFloatSafe(registro.DesvEstR, 0),
            mediaR: parseFloatSafe(registro.MediaR, 0),
            mediaG: parseFloatSafe(registro.MediaG, 0),
            mediaB: parseFloatSafe(registro.MediaB, 0),
            cloudStoragePath: null, // Las imágenes locales no se migran automáticamente
            riesgo: riesgoVal,
            nivelRiesgo,
            semaforoColor,
            evolArea: registro.EvolArea || null,
            evolDesv: registro.EvolDesv || null
          }
        });

        migrados++;
        console.log(`✅ Evaluación migrada: ${paciente.nombre} - ${nivelRiesgo} (${riesgoVal.toFixed(2)})`);

      } catch (error) {
        errores++;
        console.error(`❌ Error en línea ${i + 1}:`, error);
      }
    }

    console.log('\n🎉 Migración completada:');
    console.log(`   ✅ Registros migrados: ${migrados}`);
    console.log(`   ❌ Errores: ${errores}`);

    // Mostrar estadísticas
    const totalPacientes = await prisma.paciente.count();
    const totalEvaluaciones = await prisma.evaluacion.count();
    
    console.log('\n📊 Estadísticas finales:');
    console.log(`   👤 Total pacientes: ${totalPacientes}`);
    console.log(`   📋 Total evaluaciones: ${totalEvaluaciones}`);

    // Mostrar distribución de riesgo
    const riesgoBajo = await prisma.evaluacion.count({ where: { nivelRiesgo: 'BAJO' } });
    const riesgoModerado = await prisma.evaluacion.count({ where: { nivelRiesgo: 'MODERADO' } });
    const riesgoAlto = await prisma.evaluacion.count({ where: { nivelRiesgo: 'ALTO' } });
    
    console.log('\n🚦 Distribución de riesgo:');
    console.log(`   🟢 Bajo: ${riesgoBajo}`);
    console.log(`   🟡 Moderado: ${riesgoModerado}`);
    console.log(`   🔴 Alto: ${riesgoAlto}`);

  } catch (error) {
    console.error('💥 Error durante la migración:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
