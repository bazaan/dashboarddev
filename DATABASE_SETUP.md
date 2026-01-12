# Configuración de Base de Datos - Supabase

## Variables de Entorno para Netlify

Configura estas variables en **Netlify Dashboard → Site settings → Environment variables**:

### DATABASE_URL
```
postgresql://postgres:8S9QceLMsjE7Wiwi@db.oooipaltdrtqdiygrvty.supabase.co:5432/postgres?sslmode=require
```

### DIRECT_URL
```
postgresql://postgres:8S9QceLMsjE7Wiwi@db.oooipaltdrtqdiygrvty.supabase.co:5432/postgres?sslmode=require
```

### Otras variables necesarias:
```
NODE_ENV=production
JWT_SECRET=tu_secreto_jwt_muy_seguro_al_menos_32_caracteres
JWT_REFRESH_SECRET=otro_secreto_refresh_jwt_muy_seguro_al_menos_32_caracteres
```

## Información de la Base de Datos

- **Host:** db.oooipaltdrtqdiygrvty.supabase.co
- **Port:** 5432
- **Database:** postgres
- **User:** postgres
- **Password:** 8S9QceLMsjE7Wiwi

## Verificación

Después de configurar las variables, puedes verificar la conexión usando el endpoint de prueba:

```
https://tu-sitio.netlify.app/api/test
```

Debería mostrar:
```json
{
  "status": "ok",
  "checks": {
    "databaseUrl": true,
    "directUrl": true,
    "dbConnection": true,
    ...
  },
  "allConfigured": true
}
```

## Notas Importantes

1. **SSL requerido:** La URL incluye `?sslmode=require` para conexiones seguras
2. **DATABASE_URL y DIRECT_URL:** Ambos deben tener el mismo valor para Supabase
3. **Después de cambiar variables:** Necesitas hacer un nuevo deploy en Netlify para que los cambios surtan efecto
