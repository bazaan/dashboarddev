# Configuración del Dominio dev.alef.company

Esta guía te ayudará a configurar el dominio personalizado `dev.alef.company` para tu aplicación Next.js.

## Opción 1: Si estás usando Vercel (Recomendado para Next.js)

### Paso 1: Agregar el dominio en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Domains**
3. Haz clic en **Add Domain**
4. Ingresa `dev.alef.company`
5. Vercel te mostrará los registros DNS que necesitas configurar

### Paso 2: Configurar DNS en tu proveedor de dominio

Necesitas agregar un registro DNS **CNAME** o **A** en tu proveedor de dominio (donde está registrado `alef.company`):

#### Opción A: CNAME (Recomendado)
```
Tipo: CNAME
Nombre: dev
Valor: cname.vercel-dns.com
TTL: Auto (o 3600)
```

#### Opción B: Registro A (Si CNAME no está disponible)
```
Tipo: A
Nombre: dev
Valor: [IP de Vercel - Vercel te dará la IP específica]
TTL: Auto (o 3600)
```

### Paso 3: Verificar la configuración

1. Espera unos minutos (hasta 48 horas) para que los cambios DNS se propaguen
2. Vercel verificará automáticamente el dominio
3. Una vez verificado, verás un check verde en el dashboard

---

## Opción 2: Si estás usando otro hosting (VPS, Servidor propio, etc.)

### Paso 1: Configurar el servidor web

#### Para Nginx:
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
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Para Apache:
```apache
<VirtualHost *:80>
    ServerName dev.alef.company
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>
</VirtualHost>
```

### Paso 2: Configurar SSL/HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx  # Para Nginx
# o
sudo apt-get install certbot python3-certbot-apache  # Para Apache

# Obtener certificado
sudo certbot --nginx -d dev.alef.company
# o
sudo certbot --apache -d dev.alef.company
```

### Paso 3: Configurar DNS

Agrega un registro DNS en tu proveedor de dominio:

```
Tipo: A
Nombre: dev
Valor: [IP de tu servidor]
TTL: Auto (o 3600)
```

O si usas Cloudflare:

```
Tipo: CNAME
Nombre: dev
Valor: [tu-servidor.alef.company]
TTL: Auto
Proxy: Activado (naranja)
```

---

## Opción 3: Configuración DNS según tu proveedor

### Cloudflare

1. Inicia sesión en [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecciona el dominio `alef.company`
3. Ve a **DNS** → **Records**
4. Agrega un nuevo registro:
   - **Type**: `CNAME` o `A`
   - **Name**: `dev`
   - **Target**: [IP o dominio de tu hosting]
   - **Proxy**: Activado (recomendado)
   - **TTL**: Auto

### Google Domains / Cloud DNS

1. Ve a [Google Domains](https://domains.google.com) o [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona el dominio `alef.company`
3. Navega a **DNS**
4. Agrega un registro:
   - **Name**: `dev`
   - **Type**: `CNAME` o `A`
   - **Data**: [IP o dominio de tu hosting]
   - **TTL**: 3600

### Namecheap

1. Inicia sesión en [Namecheap](https://www.namecheap.com)
2. Ve a **Domain List** → Selecciona `alef.company` → **Manage**
3. En la sección **Advanced DNS**, agrega:
   - **Type**: `CNAME Record`
   - **Host**: `dev`
   - **Value**: [IP o dominio de tu hosting]
   - **TTL**: Automatic

### GoDaddy

1. Inicia sesión en [GoDaddy](https://www.godaddy.com)
2. Ve a **My Products** → **DNS** → Selecciona `alef.company`
3. Haz clic en **Add** y agrega:
   - **Type**: `CNAME`
   - **Name**: `dev`
   - **Value**: [IP o dominio de tu hosting]
   - **TTL**: 1 Hour

---

## Verificación

Una vez configurado el DNS, puedes verificar con:

```bash
# Verificar el registro DNS
nslookup dev.alef.company

# O usando dig
dig dev.alef.company

# Verificar desde diferentes ubicaciones
curl -I https://dev.alef.company
```

---

## Configuración de Variables de Entorno

Asegúrate de configurar las variables de entorno en tu hosting:

```env
# Para producción
NODE_ENV=production

# URL base de la aplicación
NEXT_PUBLIC_APP_URL=https://dev.alef.company

# Base de datos (si aplica)
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
```

---

## Troubleshooting

### El dominio no carga
- Verifica que el DNS esté propagado (puede tardar hasta 48 horas)
- Verifica que el servidor esté corriendo en el puerto correcto
- Revisa los logs del servidor

### Error SSL/HTTPS
- Asegúrate de tener un certificado SSL válido
- Verifica que el puerto 443 esté abierto
- Revisa la configuración del servidor web

### Error 502 Bad Gateway
- Verifica que la aplicación Next.js esté corriendo
- Revisa la configuración del proxy
- Verifica los logs de la aplicación

---

## Notas Importantes

1. **Propagación DNS**: Los cambios DNS pueden tardar entre 15 minutos y 48 horas en propagarse completamente
2. **SSL**: Si usas Vercel, el SSL se configura automáticamente. Si usas otro hosting, necesitarás configurar Let's Encrypt
3. **Variables de entorno**: Asegúrate de configurar todas las variables de entorno necesarias en tu hosting
4. **Base de datos**: Si usas Supabase u otro servicio externo, verifica que las URLs de conexión sean correctas
