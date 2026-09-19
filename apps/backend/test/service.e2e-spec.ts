import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/services/prisma/prisma.service';
import { validationPipeOptions } from '../src/core/config/app.option';

describe('Services (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const stamp = Date.now();
  const email = `svc-e2e-${stamp}@shipyard.dev`;
  const otherEmail = `svc-e2e-other-${stamp}@shipyard.dev`;
  const password = 'password123';

  let token: string;
  let otherToken: string;
  let projectId: string;

  const auth = () => ({ Authorization: `Bearer ${token}` });

  const signUp = async (mail: string) => {
    await prisma.user.create({
      data: {
        name: 'E2E User',
        email: mail,
        passwordHash: await argon.hash(password),
      },
    });
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: mail, password })
      .expect(201);
    return res.body.access_token as string;
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
    await app.init();

    prisma = app.get(PrismaService);
    token = await signUp(email);
    otherToken = await signUp(otherEmail);

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set(auth())
      .send({ name: `svc-e2e-project-${stamp}` })
      .expect(201);
    projectId = project.body.id as string;
  });

  afterAll(async () => {
    await prisma.user
      .deleteMany({ where: { email: { in: [email, otherEmail] } } })
      .catch(() => undefined);
    await app.close();
  });

  const createImageService = (name: string, targetProject = projectId) =>
    request(app.getHttpServer())
      .post('/services')
      .set(auth())
      .send({
        projectId: targetProject,
        name,
        type: 'APPLICATION',
        buildType: 'DOCKER',
        source: 'IMAGE',
        imageRef: 'nginx:alpine',
      });

  it('rejects a GIT service without repositoryUrl (400)', async () => {
    await request(app.getHttpServer())
      .post('/services')
      .set(auth())
      .send({
        projectId,
        name: `no-repo-${stamp}`,
        type: 'APPLICATION',
        buildType: 'DOCKER',
        source: 'GIT',
      })
      .expect(400);
  });

  it('rejects an UPLOAD service without archiveKey (400)', async () => {
    await request(app.getHttpServer())
      .post('/services')
      .set(auth())
      .send({
        projectId,
        name: `no-archive-${stamp}`,
        type: 'APPLICATION',
        buildType: 'DOCKER',
        source: 'UPLOAD',
      })
      .expect(400);
  });

  it('creates a service with a derived slug', async () => {
    const res = await createImageService('My Image Service').expect(201);
    expect(res.body.slug).toBe('my-image-service');
    expect(res.body.status).toBe('CREATED');
    expect(res.body.source).toBe('IMAGE');
  });

  it('conflicts on a duplicate name within the same project (409)', async () => {
    await createImageService('My Image Service').expect(409);
  });

  it('allows the same name in a different project', async () => {
    const project2 = await request(app.getHttpServer())
      .post('/projects')
      .set(auth())
      .send({ name: `svc-e2e-project2-${stamp}` })
      .expect(201);

    await createImageService('My Image Service', project2.body.id).expect(201);
  });

  it("hides another user's service (404)", async () => {
    const created = await createImageService(`owned-${stamp}`).expect(201);

    await request(app.getHttpServer())
      .get(`/services/${created.body.id}`)
      .set({ Authorization: `Bearer ${otherToken}` })
      .expect(404);
  });

  it("blocks deleting another user's service and allows the owner (404 then 200)", async () => {
    const created = await createImageService(`del-${stamp}`).expect(201);

    await request(app.getHttpServer())
      .delete(`/services/${created.body.id}`)
      .set({ Authorization: `Bearer ${otherToken}` })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/services/${created.body.id}`)
      .set(auth())
      .expect(200);
  });
});
