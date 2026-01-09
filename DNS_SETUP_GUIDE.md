# Guía Rápida: Configurar DNS para dev.alef.company

## 📋 Resumen de Pasos

Para configurar el dominio `dev.alef.company`, necesitas hacer **2 cosas**:

1. **Configurar DNS** en tu proveedor de dominio (donde está registrado `alef.company`)
2. **Configurar el dominio** en tu plataforma de hosting (Vercel, servidor propio, etc.)

---

## 🚀 Opción 1: Si usas Netlify (Recomendado para este proyecto)

### Paso 1: Agregar dominio en Netlify

1. Ve a https://app.netlify.com
2. Selecciona tu sitio
3. Ve a **Site settings** → **Domain management**
4. Haz clic en **Add custom domain**
5. Ingresa: `dev.alef.company`
6. Netlify te mostrará los registros DNS que necesitas

### Paso 2: Configurar DNS

Agrega un registro DNS en tu proveedor de dominio:

**Registro CNAME (Recomendado):**
```
Tipo: CNAME
Nombre/Host: dev
Valor/Target: [tu-sitio].netlify.app
TTL: 3600 (o Auto)
```

**O si Netlify te da una IP específica:**
```
Tipo: A
Nombre/Host: dev
Valor/Target: [IP que te da Netlify]
TTL: 3600
```

### Paso 3: Esperar verificación y SSL

- Netlify verificará automáticamente el dominio
- SSL se configurará automáticamente con Let's Encrypt
- Puede tardar de 15 minutos a 48 horas
- Verás un ✅ verde cuando esté listo

---

## 🚀 Opción 2: Si usas Vercel

### Paso 1: Agregar dominio en Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Domains**
4. Haz clic en **Add Domain**
5. Ingresa: `dev.alef.company`
6. Vercel te mostrará los registros DNS exactos que necesitas

### Paso 2: Configurar DNS

Ve a tu proveedor de dominio y agrega:

**Registro CNAME:**
```
Tipo: CNAME
Nombre/Host: dev
Valor/Target: cname.vercel-dns.com
TTL: 3600 (o Auto)
```

O si CNAME no está disponible:

**Registro A:**
```
Tipo: A
Nombre/Host: dev
Valor/Target: [IP que te da Vercel]
TTL: 3600
```

### Paso 3: Esperar verificación

- Vercel verificará automáticamente el dominio
- Puede tardar de 15 minutos a 48 horas
- Verás un ✅ verde cuando esté listo

---

## 🖥️ Opción 2: Si usas servidor propio/VPS

### Paso 1: Configurar servidor web (Nginx)

```bash
# Instalar Nginx (si no lo tienes)
sudo apt update
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/dev.alef.company
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name dev.alef.company;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/dev.alef.company /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 2: Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL gratuito
sudo certbot --nginx -d dev.alef.company

# Seguir las instrucciones
# Certbot configurará automáticamente HTTPS
```

### Paso 3: Configurar DNS

Agrega en tu proveedor de dominio:

```
Tipo: A
Nombre: dev
Valor: [IP pública de tu servidor]
TTL: 3600
```

Para obtener tu IP pública:
```bash
curl ifconfig.me
```

---

## 🌐 Configurar DNS según tu Proveedor

### Cloudflare

1. Ve a https://dash.cloudflare.com
2. Selecciona `alef.company`
3. **DNS** → **Records** → **Add record**
4. Configura:
   - Type: `CNAME`
   - Name: `dev`
   - Target: `cname.vercel-dns.com` (si usas Vercel) o tu servidor
   - Proxy: ✅ Activado (naranja)
   - TTL: Auto

### Google Domains

1. Ve a https://domains.google.com
2. Selecciona `alef.company`
3. **DNS** → **Custom resource records**
4. Agrega:
   - Name: `dev`
   - Type: `CNAME`
   - Data: `cname.vercel-dns.com` (si usas Vercel)
   - TTL: `3600`

### Namecheap

1. Ve a https://www.namecheap.com
2. **Domain List** → `alef.company` → **Manage** → **Advanced DNS**
3. En **Host Records**, agrega:
   - Type: `CNAME Record`
   - Host: `dev`
   - Value: `cname.vercel-dns.com`
   - TTL: `Automatic`

### GoDaddy

1. Ve a https://www.godaddy.com
2. **My Products** → **DNS** → `alef.company`
3. **Add** → Configura:
   - Type: `CNAME`
   - Name: `dev`
   - Value: `cname.vercel-dns.com`
   - TTL: `1 Hour`

---

## ✅ Verificar que Funciona

### Método 1: Verificar DNS

```bash
# Verificar que el DNS está configurado
nslookup dev.alef.company

# O con dig
dig dev.alef.company +short
```

Deberías ver la IP o el dominio objetivo.

### Método 2: Verificar desde el navegador

1. Abre https://dev.alef.company en tu navegador
2. Deberías ver tu aplicación Next.js

### Método 3: Verificar con curl

```bash
curl -I https://dev.alef.company
```

Deberías recibir un código `200 OK`.

---

## ⚙️ Variables de Entorno Necesarias

Asegúrate de configurar estas variables en tu hosting:

### Para Vercel:
1. Ve a **Settings** → **Environment Variables**
2. Agrega:
   - `NODE_ENV=production`
   - `DATABASE_URL=tu_url_de_base_de_datos`
   - `DIRECT_URL=tu_direct_url` (si usas Prisma)
   - `JWT_SECRET=tu_secreto_jwt`
   - `JWT_REFRESH_SECRET=tu_secreto_refresh_jwt`

### Para servidor propio:
Crea archivo `.env`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=tu_secreto_jwt
JWT_REFRESH_SECRET=tu_secreto_refresh_jwt
```

---

## 🔧 Troubleshooting

### ❌ El dominio no carga

**Solución:**
1. Verifica que el DNS esté propagado (espera hasta 48 horas)
2. Verifica que tu aplicación esté corriendo
3. Revisa los logs: `vercel logs` o `pm2 logs` (si usas PM2)

### ❌ Error SSL/HTTPS

**Solución:**
1. Si usas Vercel: SSL se configura automáticamente
2. Si usas servidor propio: Verifica que Certbot haya configurado correctamente
3. Verifica que el puerto 443 esté abierto: `sudo ufw allow 443`

### ❌ Error 502 Bad Gateway

**Solución:**
1. Verifica que Next.js esté corriendo en el puerto 3000
2. Revisa la configuración del proxy en Nginx
3. Verifica los logs: `sudo tail -f /var/log/nginx/error.log`

### ❌ El dominio carga pero muestra error

**Solución:**
1. Verifica las variables de entorno
2. Verifica la conexión a la base de datos
3. Revisa los logs de la aplicación

---

## 📝 Notas Importantes

1. ⏰ **Propagación DNS**: Los cambios pueden tardar de 15 minutos a 48 horas
2. 🔒 **SSL**: Si usas Vercel, SSL es automático. Si usas servidor propio, necesitas Let's Encrypt
3. 🔐 **Seguridad**: Asegúrate de usar HTTPS en producción
4. 🗄️ **Base de datos**: Verifica que Supabase o tu base de datos permita conexiones desde el nuevo dominio

---

## 🎯 Resumen Rápido

**Para Vercel:**
1. Agrega `dev.alef.company` en Vercel Dashboard → Settings → Domains
2. Agrega registro CNAME: `dev` → `cname.vercel-dns.com` en tu DNS
3. Espera la verificación (automática)

**Para servidor propio:**
1. Configura Nginx/Apache para proxy hacia `localhost:3000`
2. Configura SSL con Certbot
3. Agrega registro A: `dev` → `[IP de tu servidor]` en tu DNS

¡Listo! 🚀
