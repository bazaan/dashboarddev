# Solución de Problemas: Login se queda cargando

## 🔍 Diagnóstico Rápido

Si el login se queda en "Sign In" sin cargar, sigue estos pasos:

### 1. Verificar Variables de Entorno en Netlify

**CRÍTICO:** Ve a Netlify Dashboard → Site settings → Environment variables

Debes tener estas variables configuradas:

```
DATABASE_URL = postgresql://usuario:contraseña@host:5432/database?sslmode=require
DIRECT_URL = postgresql://usuario:contraseña@host:5432/database?sslmode=require
JWT_SECRET = un_secreto_muy_largo_y_seguro_al_menos_32_caracteres
JWT_REFRESH_SECRET = otro_secreto_diferente_al_menos_32_caracteres
NODE_ENV = production
```

**⚠️ Si falta DATABASE_URL, el login NO funcionará.**

### 2. Verificar Logs en Netlify

1. Ve a **Deploys** → Selecciona el último deploy
2. Haz clic en **Functions** o busca errores en los logs
3. Busca errores como:
   - `Can't reach database server`
   - `Environment variable not found: DATABASE_URL`
   - `P1001: Can't reach database server`

### 3. Verificar Consola del Navegador

1. Abre la página de login
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Haz clic en "Sign In"
5. Busca errores en rojo

### 4. Probar la API Directamente

Abre la consola del navegador (F12) y ejecuta:

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@alef.com', password: 'admin123' })
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(text => {
  console.log('Response:', text);
  try {
    console.log('Parsed:', JSON.parse(text));
  } catch(e) {
    console.error('No es JSON:', text);
  }
})
.catch(err => console.error('Error:', err));
```

Esto te mostrará el error exacto.

### 5. Verificar que Existe un Usuario en la Base de Datos

Si es la primera vez, necesitas crear un usuario admin:

**Opción A: Desde Supabase Dashboard**
1. Ve a tu proyecto en Supabase
2. SQL Editor
3. Ejecuta:

```sql
-- Primero, necesitas el hash de la contraseña 'admin123'
-- Puedes generarlo localmente con:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 12).then(console.log)"

INSERT INTO "User" (id, email, "passwordHash", role, name)
VALUES (
  gen_random_uuid(),
  'admin@alef.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5GyY5GyY5', -- Reemplaza con el hash real
  'ADMIN',
  'Super Admin'
);
```

**Opción B: Ejecutar seed localmente**
```bash
# En tu máquina local, con .env configurado
npx prisma db seed
```

Luego verifica que el usuario existe en Supabase.

### 6. Verificar Conexión a Supabase

1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection string** (URI)
3. Debe tener este formato:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require
   ```
4. Úsala como `DATABASE_URL` y `DIRECT_URL` en Netlify

### 7. Verificar que Supabase Permite Conexiones Externas

1. Ve a Supabase Dashboard → Settings → Database
2. Verifica que **Connection pooling** esté activado
3. Usa la **Connection string** con `?pgbouncer=true` si está disponible

## 🛠️ Soluciones Comunes

### Problema: "DATABASE_URL no está configurada"

**Solución:**
1. Ve a Netlify → Site settings → Environment variables
2. Agrega `DATABASE_URL` con la URL de Supabase
3. Agrega `DIRECT_URL` con la misma URL
4. Haz un nuevo deploy

### Problema: "Can't reach database server"

**Solución:**
1. Verifica que la URL de Supabase sea correcta
2. Verifica que la contraseña en la URL sea correcta
3. Verifica que Supabase permita conexiones externas
4. Prueba la conexión desde tu máquina local primero

### Problema: "No hay usuarios en la base de datos"

**Solución:**
1. Ejecuta el seed: `npx prisma db seed` (localmente)
2. O crea el usuario manualmente en Supabase SQL Editor

### Problema: "La solicitud tardó demasiado"

**Solución:**
1. Verifica que DATABASE_URL esté correcta
2. Verifica la conexión a internet
3. Verifica que Supabase no esté bloqueando las IPs de Netlify

## 📋 Checklist de Verificación

- [ ] DATABASE_URL configurada en Netlify
- [ ] DIRECT_URL configurada en Netlify
- [ ] JWT_SECRET configurado en Netlify
- [ ] JWT_REFRESH_SECRET configurado en Netlify
- [ ] NODE_ENV=production en Netlify
- [ ] Usuario admin existe en la base de datos
- [ ] Supabase permite conexiones externas
- [ ] URL de Supabase es correcta
- [ ] Deploy reciente en Netlify

## 🚨 Si Nada Funciona

1. **Revisa los logs de Netlify Functions:**
   - Deploys → Functions → Ver logs del último deploy

2. **Prueba crear un endpoint de prueba:**
   ```typescript
   // app/api/test/route.ts
   export async function GET() {
     return NextResponse.json({ 
       dbUrl: process.env.DATABASE_URL ? 'Configurada' : 'NO CONFIGURADA',
       nodeEnv: process.env.NODE_ENV 
     });
   }
   ```
   Visita: `https://dashboardvealef.netlify.app/api/test`

3. **Contacta soporte de Netlify** si el problema persiste
