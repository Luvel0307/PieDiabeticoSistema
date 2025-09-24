
# 🚀 Guía de Despliegue - URL Limpia Gratuita

## 🎯 Objetivo: URL como `tudominio.com` GRATIS

### **OPCIÓN 1: Vercel + Dominio Gratis (RECOMENDADO)**

#### Paso 1: Subir a GitHub
```bash
# Desde tu computadora local
git clone [URL-DE-TU-REPO]
cd sistema-pie-diabetico
git add .
git commit -m "Sistema pie diabético completo"
git push origin main
```

#### Paso 2: Conectar a Vercel
1. Ve a [vercel.com](https://vercel.com) 
2. "Continue with GitHub"
3. "Import Project" → Selecciona tu repo
4. **Framework**: Next.js (detectado automático)
5. **Root Directory**: `app`
6. Click "Deploy"

#### Paso 3: URL Limpia GRATIS
Vercel te da URLs como:
- `sistema-pie-diabetico.vercel.app` (automático)
- `pie-diabetico-colegio.vercel.app` (personalizable)

#### Paso 4: Variables de Entorno en Vercel
En el dashboard de Vercel:
- Settings → Environment Variables
- Agregar todas las variables del `.env`

---

### **OPCIÓN 2: Railway + Dominio Gratis**

#### Paso 1: Railway Deploy
1. Ve a [railway.app](https://railway.app)
2. "Deploy from GitHub"
3. Selecciona tu repo
4. Railway detecta Next.js automáticamente

#### Paso 2: Configurar PostgreSQL
1. En Railway: "Add Service" → PostgreSQL
2. Copia la `DATABASE_URL` generada
3. Agrégala en Environment Variables

#### Paso 3: URL Limpia
Railway da URLs como:
- `sistema-pie-diabetico-production.up.railway.app`

---

### **OPCIÓN 3: Render + PostgreSQL Gratis**

#### Paso 1: Base de Datos en Render
1. [render.com](https://render.com) → "New PostgreSQL"
2. Nombre: `pie-diabetico-db`
3. Plan: **Free** (gratis)
4. Copia la URL de conexión

#### Paso 2: Deploy Web Service
1. "New Web Service" → GitHub repo
2. **Environment**: Node
3. **Build Command**: `cd app && yarn install && yarn build`
4. **Start Command**: `cd app && yarn start`

#### Paso 3: Variables de Entorno
Agregar en Render Environment:
```
DATABASE_URL=postgresql://...
NODE_ENV=production
```

---

## 🌐 DOMINIO PERSONALIZADO GRATIS

### **Opción A: Subdominios Gratuitos**
- [freenom.com](http://freenom.com) → `.tk`, `.ml`, `.ga` gratis
- [no-ip.com](http://no-ip.com) → subdominios gratis
- [duckdns.org](http://duckdns.org) → subdominios gratis

### **Opción B: GitHub Student Pack**
Si eres estudiante:
- [education.github.com](https://education.github.com)
- Dominio `.me` gratis por 1 año
- Créditos de Vercel Pro gratis

### **Configurar Dominio Personalizado:**

#### En Vercel:
1. Project Settings → Domains  
2. Add Domain → `tudominio.com`
3. Configurar DNS:
   - Type: `A` → Value: `76.76.19.61`
   - Type: `CNAME` → `www` → `tudominio.vercel.app`

#### En Railway:
1. Project → Settings → Domains
2. Custom Domain → `tudominio.com`
3. Configurar DNS según instrucciones

---

## 🔄 ACTUALIZACIONES FUTURAS

### Método Automático (GitHub):
```bash
# Hacer cambios en tu código
git add .
git commit -m "Nueva funcionalidad"
git push origin main
# ¡Deploy automático!
```

### Método Manual:
1. Descargar proyecto actualizado
2. Subir archivos a GitHub
3. Deploy automático

---

## ⚡ URLS DE EJEMPLO RESULTANTES

### Con Vercel:
- `https://sistema-pie-diabetico.vercel.app`
- `https://evaluacion-pie-diabetico.vercel.app` 
- `https://colegio-mexico-diabetes.vercel.app`

### Con Railway:
- `https://sistema-pie-diabetico-production.up.railway.app`

### Con Dominio Personalizado:
- `https://evaluaciondiabetes.tk` (Freenom)
- `https://piediabetico.duckdns.org` (DuckDNS)
- `https://colegiomexico-diabetes.com` (comprado)

---

## 💡 TIPS IMPORTANTES

1. **Performance**: Vercel es el más rápido para Next.js
2. **Base de Datos**: Railway incluye PostgreSQL gratis
3. **Almacenamiento**: Usar Cloudinary o ImageKit gratis para imágenes
4. **Dominio**: `.tk` y `.ml` son completamente gratis
5. **SSL**: Todos los servicios incluyen HTTPS automático

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Build Errors:
```bash
# Verificar en local primero
cd app
yarn build
```

### Database Connection:
- Verificar `DATABASE_URL` en variables de entorno
- Ejecutar `npx prisma db push` después del deploy

### Images Not Loading:
- Configurar `next.config.js` para dominio personalizado
- Verificar AWS S3 configuration

---

**¡Tu sistema estará online en menos de 10 minutos!** 🚀
