import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';

function requestedDestination(value: string | null) {
  if (value?.startsWith('/') && !value.startsWith('//')) return value;
  return '/mis-reservas';
}

export function LoginPage() {
  const { login, user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const destination = requestedDestination(searchParams.get('next'));

  if (!loading && user) return <Navigate to={destination} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(destination, { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No pudimos iniciar sesión. Intenta de nuevo.');
      requestAnimationFrame(() => (cause instanceof ApiError && cause.status === 401 ? emailRef.current : errorRef.current)?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-5xl font-black sm:text-6xl">Ingresar</h1>
      <p className="mt-4 max-w-prose text-lg">Inicia sesión para reservar entradas y ver tus reservas.</p>

      <form className="mt-8 max-w-xl space-y-5 border-l-4 border-marigold bg-white p-6 sm:p-8" onSubmit={handleSubmit}>
        {error && (
          <p ref={errorRef} id="login-error" role="alert" tabIndex={-1} className="font-bold text-theater">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="login-email" className="mb-1 block font-bold">Correo electrónico</label>
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? 'login-error' : undefined}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-ink"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block font-bold">Contraseña</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={error ? 'login-error' : undefined}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-ink"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-marigold px-5 py-2.5 font-bold text-ink hover:bg-white disabled:opacity-60"
        >
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p>¿Aún no tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
      </form>
    </section>
  );
}
