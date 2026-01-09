import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para dominio personalizado
  // El dominio dev.alef.company debe estar configurado en el hosting (Vercel, etc.)
  
  // Headers de seguridad para producción
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
