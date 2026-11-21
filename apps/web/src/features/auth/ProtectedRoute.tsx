import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from './AuthContext';
import type { UserRole } from './api';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Verificando sesión…" />;

  if (!user) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/ingresar?next=${encodeURIComponent(next)}`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6" role="alert">
        <h1 className="text-5xl font-black sm:text-6xl">No tienes permisos</h1>
        <p className="mt-4 text-lg">Tu cuenta no tiene acceso a esta sección.</p>
      </section>
    );
  }

  return children;
}
