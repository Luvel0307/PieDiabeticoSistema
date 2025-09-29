
# 🏥 Sistema de Evaluación de Pie Diabético

Sistema web inteligente para la evaluación de riesgo en pie diabético desarrollado en colaboración con el **Colegio México**. Utiliza lógica difusa para análisis médico automatizado y genera reportes PDF profesionales.

## ✨ Características Principales

- 📸 **Captura de imágenes** desde cámara o archivos
- 🧠 **Análisis inteligente** con lógica difusa 
- 🚦 **Sistema de semáforo** (Verde/Amarillo/Rojo)
- 📄 **PDFs médicos profesionales** 
- 👥 **Gestión de pacientes** y historial
- 📊 **Dashboard médico** completo
- 📱 **Responsive** para móviles y tablets

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: API Routes (Next.js), Prisma ORM
- **Base de Datos**: PostgreSQL
- **Almacenamiento**: AWS S3 compatible
- **PDFs**: jsPDF, html2canvas
- **Despliegue**: Vercel, Railway, Render

## 🚀 Despliegue Rápido

### Opción 1: Vercel (Recomendado)
1. Conecta este repo a [Vercel](https://vercel.com)
2. Configura las variables de entorno
3. Deploy automático

### Opción 2: Railway
1. Conecta a [Railway](https://railway.app)
2. Configura PostgreSQL
3. Deploy con un click

### Opción 3: Render
1. Conecta a [Render](https://render.com)
2. Configura base de datos
3. Deploy gratuito

## ⚙️ Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# Almacenamiento
AWS_BUCKET_NAME="tu-bucket"
AWS_FOLDER_PREFIX="uploads/"

# Auth (generado automáticamente)
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="tu-secret"
```

## 📱 Instalación Local

```bash
# Clonar repositorio
git clone https://tu-repo.git
cd sistema-pie-diabetico/app

# Instalar dependencias
yarn install

# Configurar base de datos
npx prisma generate
npx prisma db push

# Migrar datos existentes (opcional)
yarn tsx scripts/seed.ts

# Ejecutar en desarrollo
yarn dev
```

## 👨‍⚕️ Uso del Sistema

### Para Enfermeras/Personal Médico:
1. **Nueva Evaluación**: Capturar foto y datos clínicos
2. **Análisis Automático**: El sistema evalúa el riesgo
3. **Generar PDF**: Crear reporte médico profesional
4. **Entregar a Médico**: PDF listo para revisión

### Parámetros de Evaluación:
- Sensibilidad (0-6)
- Tiempo de evolución (días)
- Control glucémico (5-12)
- Secreción (Sí/No)
- Eritema (Sí/No)
- Análisis de imagen automático

## 🎯 Resultados de Evaluación

### 🟢 Verde (Bajo Riesgo)
- Cuidados preventivos regulares
- Revisión cada 3-6 meses

### 🟡 Amarillo (Riesgo Moderado) 
- Vigilancia cada 2-4 semanas
- Posible interconsulta

### 🔴 Rojo (Alto Riesgo)
- **ATENCIÓN URGENTE**
- Interconsulta inmediata
- Seguimiento semanal

## 📄 Reportes PDF

Los PDFs generados incluyen:
- Información completa del paciente
- Parámetros clínicos evaluados
- Análisis de imagen detallado
- Nivel de riesgo con semáforo
- Recomendaciones específicas
- Logo institucional

## 🔒 Seguridad

- Validación de archivos de imagen
- Protección CORS configurada  
- Almacenamiento seguro en la nube
- Encriptación de datos sensibles

## 📞 Soporte

Para soporte técnico o mejoras, contactar al equipo de desarrollo.

---

**Desarrollado en colaboración con Colegio México**  
*Análisis inteligente con lógica difusa*
