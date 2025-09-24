
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/s3';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG, BMP' 
      }, { status: 400 });
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 10MB' 
      }, { status: 400 });
    }

    // Convertir archivo a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Subir a S3
    const cloudStoragePath = await uploadFile(buffer, file.name);

    return NextResponse.json({
      success: true,
      cloudStoragePath,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
