# Guía de Despliegue en Netlify - dev.alef.company

Esta guía te ayudará a desplegar tu aplicación Next.js en Netlify y configurar el dominio personalizado `dev.alef.company`.

## 📋 Requisitos Previos

1. Cuenta en [Netlify](https://www.netlify.com) (gratis)
2. Repositorio Git (GitHub, GitLab, o Bitbucket)
3. Acceso al DNS de tu dominio `alef.company`

---

## 🚀 Paso 1: Preparar el Proyecto

### 1.1 Verificar archivos necesarios

Asegúrate de tener estos archivos en tu proyecto:

- ✅ `netlify.toml` (ya creado)
- ✅ `package.json` con scripts de build
- ✅ `.env.example` (opcional, para documentar variables)

### 1.2 Verificar scripts en package.json

Tu `package.json` debe tener:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

---

## 📤 Paso 2: Desplegar en Netlify

### Opción A: Desde el Dashboard de Netlify (Recomendado)

1. **Inicia sesión en Netlify**
   - Ve a https://app.netlify.com
   - Inicia sesión o crea una cuenta

2. **Conectar repositorio**
   - Haz clic en **"Add new site"** → **"Import an existing project"**
   - Conecta tu repositorio (GitHub, GitLab, o Bitbucket)
   - Selecciona el repositorio de tu proyecto

3. **Configurar build settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `.next` (o deja en blanco, Netlify lo detectará automáticamente)
   - **Base directory**: (deja en blanco si está en la raíz)

4. **Configurar variables de entorno**
   - En la sección **"Environment variables"**, agrega:
     ```
     NODE_ENV=production
     DATABASE_URL=tu_url_de_supabase
     DIRECT_URL=tu_direct_url_de_supabase
     JWT_SECRET=tu_secreto_jwt
     JWT_REFRESH_SECRET=tu_secreto_refresh_jwt
     ```
   - ⚠️ **Importante**: No expongas estos valores en el código

5. **Desplegar**
   - Haz clic en **"Deploy site"**
   - Netlify comenzará a construir tu aplicación
   - Espera a que termine el build (puede tardar 2-5 minutos)

### Opción B: Usando Netlify CLI

```bash
# Instalar Netlify CLI globalmente
npm install -g netlify-cli

# Iniciar sesión
netlify login

# Inicializar el proyecto
netlify init

# Desplegar
netlify deploy --prod
```

---

## 🌐 Paso 3: Configurar Dominio Personalizado

### 3.1 Agregar dominio en Netlify

1. Ve a tu sitio en Netlify Dashboard
2. Navega a **Site settings** → **Domain management**
3. Haz clic en **"Add custom domain"**
4. Ingresa: `dev.alef.company`
5. Netlify te mostrará los registros DNS que necesitas

### 3.2 Configurar DNS

Netlify te dará dos opciones:

#### Opción 1: Usar Netlify DNS (Más fácil)

1. En Netlify, ve a **Domain settings** → **DNS**
2. Netlify te dará nameservers:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```
3. Ve a tu proveedor de dominio y cambia los nameservers a los de Netlify

#### Opción 2: Configurar DNS en tu proveedor actual (Recomendado)

Agrega estos registros DNS en tu proveedor de dominio:

**Registro A (si Netlify te da una IP):**
```
Tipo: A
Nombre/Host: dev
Valor: [IP que te da Netlify]
TTL: 3600
```

**Registro CNAME (Recomendado):**
```
Tipo: CNAME
Nombre/Host: dev
Valor: [tu-sitio].netlify.app
TTL: 3600
```

**O si Netlify te da un dominio específico:**
```
Tipo: CNAME
Nombre/Host: dev
Valor: [nombre-aleatorio].netlify.app
TTL: 3600
```

### 3.3 Verificar SSL

1. Netlify configurará automáticamente SSL/HTTPS con Let's Encrypt
2. Ve a **Domain settings** → **HTTPS**
3. Espera a que se genere el certificado (puede tardar unos minutos)
4. Verás un ✅ cuando esté listo

---

## 🔧 Paso 4: Configurar Variables de Entorno

### Variables necesarias en Netlify:

1. Ve a **Site settings** → **Environment variables**
2. Agrega estas variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://usuario:contraseña@host:5432/database
DIRECT_URL=postgresql://usuario:contraseña@host:5432/database
JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_REFRESH_SECRET=tu_secreto_refresh_jwt_muy_seguro
```

### ⚠️ Importante sobre Supabase:

Si usas Supabase, asegúrate de:
- Usar la **connection string** correcta
- Configurar las variables `DATABASE_URL` y `DIRECT_URL`
- Verificar que Supabase permita conexiones desde Netlify

---

## 📝 Paso 5: Configurar Prisma en Netlify

### 5.1 Agregar script de build

Asegúrate de que tu `package.json` tenga:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 5.2 Verificar que Prisma se genera

Netlify ejecutará `prisma generate` automáticamente si tienes el script `postinstall`.

---

## ✅ Paso 6: Verificar el Despliegue

### 6.1 Verificar que el sitio carga

1. Visita `https://dev.alef.company`
2. Deberías ver tu aplicación Next.js

### 6.2 Verificar logs

1. En Netlify Dashboard, ve a **Deploys**
2. Haz clic en el último deploy
3. Revisa los logs para verificar que no hay errores

### 6.3 Verificar funciones

Si usas API routes, verifica que funcionen:
- `https://dev.alef.company/api/tasks`
- `https://dev.alef.company/api/projects`
- etc.

---

## 🔄 Paso 7: Configurar Deploy Automático

### 7.1 Deploy automático desde Git

Netlify se conecta automáticamente a tu repositorio Git y despliega cada vez que haces push a la rama principal.

### 7.2 Configurar rama de producción

1. Ve a **Site settings** → **Build & deploy**
2. En **Branch deploys**, selecciona tu rama principal (usualmente `main` o `master`)
3. En **Production branch**, selecciona la misma rama

---

## 🐛 Troubleshooting

### Error: "Build failed"

**Solución:**
1. Revisa los logs del build en Netlify
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que `prisma generate` se ejecute correctamente

### Error: "Function not found"

**Solución:**
1. Verifica que `netlify.toml` esté configurado correctamente
2. Asegúrate de tener el plugin `@netlify/plugin-nextjs` instalado
3. Revisa que las rutas API estén en `/app/api/`

### Error: "Database connection failed"

**Solución:**
1. Verifica las variables `DATABASE_URL` y `DIRECT_URL` en Netlify
2. Asegúrate de que Supabase permita conexiones desde las IPs de Netlify
3. Verifica que la URL de conexión sea correcta

### El dominio no carga

**Solución:**
1. Verifica que el DNS esté configurado correctamente
2. Espera hasta 48 horas para la propagación DNS
3. Verifica en Netlify que el dominio esté verificado

### Error SSL/HTTPS

**Solución:**
1. Netlify configura SSL automáticamente
2. Espera unos minutos después de agregar el dominio
3. Verifica en **Domain settings** → **HTTPS** que el certificado esté activo

---

## 📊 Configuración Avanzada

### Configurar redirects personalizados

Edita `netlify.toml`:

```toml
[[redirects]]
  from = "/old-path"
  to = "/new-path"
  status = 301
```

### Configurar headers personalizados

Ya están configurados en `netlify.toml`, pero puedes agregar más:

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
```

---

## 🎯 Resumen Rápido

1. ✅ **Preparar proyecto**: Tener `netlify.toml` y scripts correctos
2. ✅ **Desplegar**: Conectar repositorio en Netlify Dashboard
3. ✅ **Configurar variables**: Agregar DATABASE_URL, JWT_SECRET, etc.
4. ✅ **Agregar dominio**: `dev.alef.company` en Domain settings
5. ✅ **Configurar DNS**: Agregar registro CNAME o A en tu proveedor
6. ✅ **Esperar SSL**: Netlify lo configura automáticamente
7. ✅ **Verificar**: Visitar `https://dev.alef.company`

---

## 📚 Recursos Adicionales

- [Documentación de Netlify](https://docs.netlify.com/)
- [Next.js en Netlify](https://docs.netlify.com/integrations/frameworks/nextjs/)
- [Netlify DNS](https://docs.netlify.com/domains-https/netlify-dns/)

¡Listo para desplegar! 🚀
