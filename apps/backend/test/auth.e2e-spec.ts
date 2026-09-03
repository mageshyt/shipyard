import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as argon from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/services/prisma/prisma.service';

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
