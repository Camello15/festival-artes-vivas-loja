import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const email = `auth-${Date.now()}@festival.ec`;
const password = 'festival2026';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Autenticación', () => {
  it('registra una cuenta PUBLIC y devuelve token sin exponer el hash', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: '  Ana Festival  ',
      email,
      password,
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ name: 'Ana Festival', email, role: 'PUBLIC' });
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('rechaza campos de rol para impedir la autoasignación de privilegios', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Usuario Admin',
      email: `role-${Date.now()}@festival.ec`,
      password,
      role: 'ADMIN',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('responde 409 con el mensaje definido cuando el correo ya existe', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Ana Festival',
      email,
      password,
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatchObject({ code: 'CONFLICT', message: 'Ese correo ya está registrado' });
  });

  it('responde 400 ante datos inválidos', async () => {
    const response = await request(app).post('/api/auth/register').send({ name: '', email: 'correo', password: 'corta' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });

  it('inicia sesión con las credenciales correctas', async () => {
    const response = await request(app).post('/api/auth/login').send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ email, role: 'PUBLIC' });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('responde 401 con un mensaje genérico ante credenciales incorrectas', async () => {
    const response = await request(app).post('/api/auth/login').send({ email, password: 'incorrecta' });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Correo o contraseña incorrectos',
    });
  });

  it('devuelve la sesión de un token válido', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password });
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email, role: 'PUBLIC' });
  });

  it.each([undefined, 'Bearer token-invalido'])('responde 401 ante una sesión ausente o inválida (%s)', async (authorization) => {
    const testRequest = request(app).get('/api/auth/me');
    const response = authorization ? await testRequest.set('Authorization', authorization) : await testRequest;

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
