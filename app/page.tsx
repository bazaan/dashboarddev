import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  // Si hay token, verificar si es válido
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      // Usuario autenticado, redirigir al dashboard
      redirect('/dashboard');
    }
  }

  // Usuario no autenticado, redirigir al login
  redirect('/login');
}
