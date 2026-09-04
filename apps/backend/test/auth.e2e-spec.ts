import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/services/prisma/prisma.service';
import { validationPipeOptions } from '../src/core/config/app.option';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = `e2e-${Date.now()}@shipyard.dev`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // mirror main.ts: global pipe is bootstrapped there, not in AppModule
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.create({
      data: {
        name: 'E2E User',
        email,
        passwordHash: await argon.hash(password),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email } }).catch(() => undefined);
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('issues an access token for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      expect(typeof res.body.access_token).toBe('string');
      expect(res.body.access_token.split('.')).toHaveLength(3);
    });

    it('rejects a wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
    });

    it('rejects an unknown user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ghost@nowhere.dev', password })
        .expect(401);
    });
  });

  describe('POST /auth/register', () => {
    const regEmail = `reg-${Date.now()}@shipyard.dev`;
    const body = { name: 'Reg User', email: regEmail, password: 'StrongP@ssw0rd1' };

    afterAll(async () => {
      await prisma.user
        .delete({ where: { email: regEmail } })
        .catch(() => undefined);
    });

    it('creates a user without exposing the hash', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(body)
        .expect(201);

      expect(res.body.email).toBe(regEmail);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('conflicts on duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(body)
        .expect(409);

      expect(res.body.message).toBe('User with this email already exists');
    });

    it('rejects a weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...body, password: 'weak' })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });
      token = res.body.access_token;
    });

    it('returns the safe user for a valid token, without the hash', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe(email);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('rejects a tampered token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('authorization', `Bearer ${token.slice(0, -4)}AAAA`)
        .expect(401);
    });

    it('rejects a missing token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });
});
