import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';

function requestedDestination(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/mis-reservas';
}

export function RegisterPage() {
  const { register, user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [name, setName] = useState('');
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
      await register({ name, email, password });
      navigate(destination, { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No pudimos crear tu cuenta. Intenta de nuevo.');
      requestAnimationFrame(() => (cause instanceof ApiError && cause.status === 409 ? emailRef.current : errorRef.current)?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-5xl font-black sm:text-6xl">Crear cuenta</h1>
      <p className="mt-4 max-w-prose text-lg">Regístrate para reservar entradas y recibir tu código.</p>

      <form className="mt-8 max-w-xl space-y-5 border-l-4 border-marigold bg-white p-6 sm:p-8" onSubmit={handleSubmit}>
        {error && (
          <p ref={errorRef} id="register-error" role="alert" tabIndex={-1} className="font-bold text-theater">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="register-name" className="mb-1 block font-bold">Nombre</label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={error ? 'register-error' : undefined}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-ink"
          />
        </div>
        <div>
          <label htmlFor="register-email" className="mb-1 block font-bold">Correo electrónico</label>
          <input
            ref={emailRef}
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? 'register-error' : undefined}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-ink"
          />
        </div>
        <div>
          <label htmlFor="register-password" className="mb-1 block font-bold">Contraseña (mínimo 8 caracteres)</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={error ? 'register-error' : undefined}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-ink"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-marigold px-5 py-2.5 font-bold text-ink hover:bg-white disabled:opacity-60"
        >
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <p>¿Ya tienes cuenta? <Link to="/ingresar">Ingresar</Link></p>
      </form>
    </section>
  );
}
