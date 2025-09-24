
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { evaluacionId } = await request.json();
    
    if (!evaluacionId) {
      return NextResponse.json({ error: 'ID de evaluación requerido' }, { status: 400 });
    }

    // Obtener la evaluación con datos del paciente
    const evaluacion = await prisma.evaluacion.findUnique({
      where: { id: parseInt(evaluacionId) },
      include: { paciente: true }
    });

    if (!evaluacion) {
      return NextResponse.json({ error: 'Evaluación no encontrada' }, { status: 404 });
    }

    // Convertir BigInt a Number para serialización
    const evaluacionData = {
      ...evaluacion,
      riesgo: Number(evaluacion.riesgo),
      areaLesion: Number(evaluacion.areaLesion),
      desvEstR: Number(evaluacion.desvEstR),
      mediaR: Number(evaluacion.mediaR),
      mediaG: Number(evaluacion.mediaG),
      mediaB: Number(evaluacion.mediaB)
    };

    return NextResponse.json({ 
      success: true, 
      evaluacion: evaluacionData 
    });

  } catch (error) {
    console.error('Error getting evaluation for PDF:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
