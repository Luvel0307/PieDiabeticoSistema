
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { evaluarRiesgo } from '@/lib/fuzzy-logic';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      sensibilidad,
      tiempoEvolucion,
      controlGlucemico,
      secrecion,
      eritema,
      areaLesion,
      desvEstR,
      mediaR,
      mediaG,
      mediaB,
      cloudStoragePath
    } = body;

    // Validar datos de entrada
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre del paciente es requerido' }, { status: 400 });
    }

    if (sensibilidad < 0 || sensibilidad > 6) {
      return NextResponse.json({ error: 'La sensibilidad debe estar entre 0 y 6' }, { status: 400 });
    }

    if (tiempoEvolucion < 0 || tiempoEvolucion > 35) {
      return NextResponse.json({ error: 'El tiempo de evolución debe estar entre 0 y 35 días' }, { status: 400 });
    }

    if (controlGlucemico < 5 || controlGlucemico > 12) {
      return NextResponse.json({ error: 'El control glucémico debe estar entre 5 y 12' }, { status: 400 });
    }

    // Buscar o crear paciente
    let paciente = await prisma.paciente.findFirst({
      where: { nombre: nombre.trim() }
    });

    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: { nombre: nombre.trim() }
      });
    }

    // Obtener última evaluación para comparación
    const ultimaEvaluacion = await prisma.evaluacion.findFirst({
      where: { pacienteId: paciente.id },
      orderBy: { fechaHora: 'desc' }
    });

    // Evaluar riesgo usando sistema difuso
    const resultadoRiesgo = evaluarRiesgo(
      sensibilidad,
      areaLesion,
      desvEstR,
      secrecion,
      eritema,
      tiempoEvolucion,
      controlGlucemico
    );

    // Calcular evolución si hay evaluación previa
    let evolArea = '';
    let evolDesv = '';

    if (ultimaEvaluacion) {
      const difArea = areaLesion - ultimaEvaluacion.areaLesion;
      const difDesv = desvEstR - ultimaEvaluacion.desvEstR;
      
      evolArea = `(${difArea >= 0 ? '+' : ''}${difArea.toFixed(2)})`;
      evolDesv = `(${difDesv >= 0 ? '+' : ''}${difDesv.toFixed(2)})`;
    }

    // Crear nueva evaluación
    const evaluacion = await prisma.evaluacion.create({
      data: {
        pacienteId: paciente.id,
        sensibilidad,
        tiempoEvolucion,
        controlGlucemico,
        secrecion,
        eritema,
        areaLesion,
        desvEstR,
        mediaR,
        mediaG,
        mediaB,
        cloudStoragePath,
        riesgo: resultadoRiesgo.riesgo,
        nivelRiesgo: resultadoRiesgo.nivelRiesgo,
        semaforoColor: resultadoRiesgo.semaforoColor,
        evolArea,
        evolDesv
      }
    });

    return NextResponse.json({
      success: true,
      evaluacion: {
        ...evaluacion,
        riesgo: Number(evaluacion.riesgo),
        areaLesion: Number(evaluacion.areaLesion),
        desvEstR: Number(evaluacion.desvEstR),
        mediaR: Number(evaluacion.mediaR),
        mediaG: Number(evaluacion.mediaG),
        mediaB: Number(evaluacion.mediaB)
      },
      paciente
    });

  } catch (error) {
    console.error('Error creating evaluation:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get('pacienteId');
    const nombre = searchParams.get('nombre');

    let evaluaciones;

    if (pacienteId) {
      evaluaciones = await prisma.evaluacion.findMany({
        where: { pacienteId: parseInt(pacienteId) },
        include: { paciente: true },
        orderBy: { fechaHora: 'desc' }
      });
    } else if (nombre) {
      const paciente = await prisma.paciente.findFirst({
        where: { nombre: nombre.trim() }
      });

      if (!paciente) {
        return NextResponse.json({ evaluaciones: [] });
      }

      evaluaciones = await prisma.evaluacion.findMany({
        where: { pacienteId: paciente.id },
        include: { paciente: true },
        orderBy: { fechaHora: 'desc' }
      });
    } else {
      evaluaciones = await prisma.evaluacion.findMany({
        include: { paciente: true },
        orderBy: { fechaHora: 'desc' },
        take: 50 // Límite para rendimiento
      });
    }

    // Convertir BigInt a Number para serialización JSON
    const evaluacionesSerializadas = evaluaciones.map((evaluacion: any) => ({
      ...evaluacion,
      riesgo: Number(evaluacion.riesgo),
      areaLesion: Number(evaluacion.areaLesion),
      desvEstR: Number(evaluacion.desvEstR),
      mediaR: Number(evaluacion.mediaR),
      mediaG: Number(evaluacion.mediaG),
      mediaB: Number(evaluacion.mediaB)
    }));

    return NextResponse.json({ evaluaciones: evaluacionesSerializadas });

  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
