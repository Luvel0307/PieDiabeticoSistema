
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let pacientes;

    if (search) {
      pacientes = await prisma.paciente.findMany({
        where: {
          nombre: {
            contains: search,
            mode: 'insensitive'
          }
        },
        include: {
          evaluaciones: {
            orderBy: { fechaHora: 'desc' },
            take: 1 // Solo la evaluación más reciente
          }
        },
        orderBy: { fechaActualizacion: 'desc' }
      });
    } else {
      pacientes = await prisma.paciente.findMany({
        include: {
          evaluaciones: {
            orderBy: { fechaHora: 'desc' },
            take: 1 // Solo la evaluación más reciente
          }
        },
        orderBy: { fechaActualizacion: 'desc' },
        take: 50 // Límite para rendimiento
      });
    }

    // Serializar datos para JSON
    const pacientesSerializados = pacientes.map(paciente => ({
      ...paciente,
      evaluaciones: paciente.evaluaciones.map(evaluacion => ({
        ...evaluacion,
        riesgo: Number(evaluacion.riesgo),
        areaLesion: Number(evaluacion.areaLesion),
        desvEstR: Number(evaluacion.desvEstR),
        mediaR: Number(evaluacion.mediaR),
        mediaG: Number(evaluacion.mediaG),
        mediaB: Number(evaluacion.mediaB)
      }))
    }));

    return NextResponse.json({ pacientes: pacientesSerializados });

  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre del paciente es requerido' }, { status: 400 });
    }

    // Verificar si el paciente ya existe
    const pacienteExistente = await prisma.paciente.findFirst({
      where: { nombre: nombre.trim() }
    });

    if (pacienteExistente) {
      return NextResponse.json({ error: 'Ya existe un paciente con ese nombre' }, { status: 400 });
    }

    const paciente = await prisma.paciente.create({
      data: { nombre: nombre.trim() }
    });

    return NextResponse.json({ success: true, paciente });

  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
