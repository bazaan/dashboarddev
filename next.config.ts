import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para dominio personalizado
  // El dominio dev.alef.company debe estar configurado en el hosting (Netlify)
  
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
  
  // Configuración para evitar problemas con CSP en producción
  reactStrictMode: true,
  
  // Permitir eval en desarrollo (necesario para Next.js)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
