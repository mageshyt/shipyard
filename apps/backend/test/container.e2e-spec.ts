import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { ContainerModule } from '../src/modules/docker/container/container.module';
import { DockerService } from '../src/modules/docker/docker.service';
import { JwtAuthGuard } from '../src/shared/auth';
import { validationPipeOptions } from '../src/core/config/app.option';

// Stands in for JwtAuthGuard: 401s without a Bearer token, allows with one.
// Proves the routes are guard-wired; real JWT flows are covered in auth.e2e-spec.
@Injectable()
class TokenRequiredGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (!req.headers?.authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    return true;
  }
}

describe('Containers (e2e)', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer test-token' };
  const id = 'abc123';

  // Fake dockerode surface. The real ContainerService runs against it,
  // so label-filter building, DTO shaping and status payloads are covered.
  const fns = {
    listContainers: jest.fn<() => Promise<unknown>>(),
    inspect: jest.fn<() => Promise<unknown>>(),
    start: jest.fn<() => Promise<unknown>>(),
    stop: jest.fn<() => Promise<unknown>>(),
    restart: jest.fn<() => Promise<unknown>>(),
    kill: jest.fn<() => Promise<unknown>>(),
    remove: jest.fn<() => Promise<unknown>>(),
  };
  const dockerFake = {
    client: { listContainers: fns.listContainers },
    getContainer: jest.fn(() => ({
      inspect: fns.inspect,
      start: fns.start,
      stop: fns.stop,
      restart: fns.restart,
      kill: fns.kill,
      remove: fns.remove,
    })),
  };

  const rawList = [
    {
      Id: 'abc123',
      Names: ['/web'],
      Image: 'nginx:latest',
      ImageID: 'sha256:111',
      Command: 'nginx -g daemon off;',
      Created: 1700000000,
      State: 'running',
      Status: 'Up 2 hours',
      Ports: [{ PrivatePort: 80 }],
      Labels: { 'shipyard.serviceId': 'svc-1' },
    },
    {
      Id: 'def456',
      Names: ['/db'],
      Image: 'postgres:16',
      ImageID: 'sha256:222',
      Command: 'postgres',
      Created: 1700000100,
      State: 'exited',
      Status: 'Exited (0)',
      Ports: [],
      Labels: {},
    },
  ];
  const rawInspect = {
    Id: 'abc123',
    Name: '/web',
    Image: 'nginx:latest',
    ImageID: 'sha256:111',
    Command: 'nginx -g daemon off;',
    Created: 1700000000,
    State: 'running',
    Status: 'Up 2 hours',
    Mounts: [],
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ContainerModule],
    })
      .overrideProvider(DockerService)
      .useValue(dockerFake)
      .overrideGuard(JwtAuthGuard)
      .useValue(new TokenRequiredGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    // mirror main.ts: global pipe is bootstrapped there, not in the module
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    Object.values(fns).forEach((fn) => fn.mockReset());
    fns.listContainers.mockResolvedValue(rawList);
    fns.inspect.mockResolvedValue(rawInspect);
    fns.start.mockResolvedValue(undefined);
    fns.stop.mockResolvedValue(undefined);
    fns.restart.mockResolvedValue(undefined);
    fns.kill.mockResolvedValue(undefined);
    fns.remove.mockResolvedValue(undefined);
  });

  describe('GET /docker/containers', () => {
    it('lists shaped containers and forwards label filters to the daemon', async () => {
      const res = await request(app.getHttpServer())
        .get('/docker/containers?all=true&serviceId=svc-1&projectId=prj-1')
        .set(auth)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toEqual({
        Id: 'abc123',
        Names: ['/web'],
        Image: 'nginx:latest',
        ImageID: 'sha256:111',
        Command: 'nginx -g daemon off;',
        Created: 1700000000,
        State: 'running',
        Status: 'Up 2 hours',
      });
      expect(fns.listContainers).toHaveBeenCalledWith({
        all: true,
        filters: {
          label: ['shipyard.serviceId=svc-1', 'shipyard.projectId=prj-1'],
        },
      });
    });

    it('rejects unknown query params', async () => {
      await request(app.getHttpServer())
        .get('/docker/containers?bogus=1')
        .set(auth)
        .expect(400);
    });
  });

  describe('GET /docker/containers/:id', () => {
    it('returns the shaped container', async () => {
      const res = await request(app.getHttpServer())
        .get(`/docker/containers/${id}`)
        .set(auth)
        .expect(200);

      expect(res.body.Id).toBe(id);
      expect(res.body).not.toHaveProperty('Mounts');
    });

    it('returns an empty body for an unknown container', async () => {
      fns.inspect.mockRejectedValueOnce(new Error('no such container'));
      const res = await request(app.getHttpServer())
        .get('/docker/containers/missing')
        .set(auth)
        .expect(200);

      // findContainerById swallows the inspect error and resolves null,
      // which Nest serializes as an empty body
      expect(res.body).toEqual({});
    });
  });

  describe.each([
    ['start', 'started'],
    ['stop', 'stopped'],
    ['restart', 'running'],
  ])('POST /docker/containers/:id/%s', (action, status) => {
    it(`returns { id, status: '${status}' }`, async () => {
      const res = await request(app.getHttpServer())
        .post(`/docker/containers/${id}/${action}`)
        .set(auth)
        .expect(201);

      expect(res.body).toEqual({ id, status });
    });
  });

  describe('POST /docker/containers/:id/kill', () => {
    it('defaults to SIGTERM', async () => {
      const res = await request(app.getHttpServer())
        .post(`/docker/containers/${id}/kill`)
        .set(auth)
        .send({})
        .expect(201);

      expect(res.body).toEqual({ id, status: 'killed' });
      expect(fns.kill).toHaveBeenCalledWith({ signal: 'SIGTERM' });
    });

    it('forwards an explicit signal', async () => {
      await request(app.getHttpServer())
        .post(`/docker/containers/${id}/kill`)
        .set(auth)
        .send({ signal: 'SIGKILL' })
        .expect(201);

      expect(fns.kill).toHaveBeenCalledWith({ signal: 'SIGKILL' });
    });

    it('rejects an invalid signal', async () => {
      await request(app.getHttpServer())
        .post(`/docker/containers/${id}/kill`)
        .set(auth)
        .send({ signal: 'SIGNOPE' })
        .expect(400);
    });
  });

  describe('POST /docker/containers/:id/remove', () => {
    it('forwards force and volume flags', async () => {
      const res = await request(app.getHttpServer())
        .post(`/docker/containers/${id}/remove?force=true&v=true`)
        .set(auth)
        .expect(201);

      expect(res.body).toEqual({ id, status: 'removed' });
      expect(fns.remove).toHaveBeenCalledWith({ force: true, v: true });
    });
  });

  describe('auth', () => {
    it.each([
      ['get', '/docker/containers'],
      ['get', `/docker/containers/${id}`],
      ['post', `/docker/containers/${id}/start`],
      ['post', `/docker/containers/${id}/stop`],
      ['post', `/docker/containers/${id}/restart`],
      ['post', `/docker/containers/${id}/kill`],
      ['post', `/docker/containers/${id}/remove`],
    ])('%s %s rejects requests without a token', async (method, path) => {
      await request(app.getHttpServer())[method](path).expect(401);
    });
  });
});
