
import { NextRequest, NextResponse } from 'next/server';
// Archivo migrate deshabilitado para evitar problemas con fs en Vercel
// import * as fs from 'fs';
// import * as path from 'path';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Ruta de migración deshabilitada - fs no disponible en Vercel serverless
  return NextResponse.json({ 
    error: 'Migración no disponible en entorno serverless',
    message: 'Use la interfaz web para cargar datos manualmente'
  }, { status: 503 });
}
