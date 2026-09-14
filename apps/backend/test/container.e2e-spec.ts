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
import { PrismaModule } from '../src/shared/services/prisma/prisma.module';
import { PrismaService } from '../src/shared/services/prisma/prisma.service';
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
    createContainer: jest.fn<(opts: unknown) => Promise<unknown>>(),
    inspect: jest.fn<() => Promise<unknown>>(),
    start: jest.fn<() => Promise<unknown>>(),
    stop: jest.fn<() => Promise<unknown>>(),
    restart: jest.fn<() => Promise<unknown>>(),
    kill: jest.fn<() => Promise<unknown>>(),
    remove: jest.fn<() => Promise<unknown>>(),
    listNetworks: jest.fn<(opts?: unknown) => Promise<unknown>>(),
    createNetwork: jest.fn<(opts: unknown) => Promise<unknown>>(),
  };
  const dockerFake = {
    client: {
      listContainers: fns.listContainers,
      createContainer: fns.createContainer,
      listNetworks: fns.listNetworks,
      createNetwork: fns.createNetwork,
    },
    getContainer: jest.fn(() => ({
      inspect: fns.inspect,
      start: fns.start,
      stop: fns.stop,
      restart: fns.restart,
      kill: fns.kill,
      remove: fns.remove,
    })),
  };

  const prismaFake = {
    service: { findUnique: jest.fn<() => Promise<unknown>>() },
    project: { findUnique: jest.fn<() => Promise<unknown>>() },
    environmentVariable: { findMany: jest.fn<() => Promise<unknown>>() },
    log: { create: jest.fn<() => Promise<unknown>>() },
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
      imports: [ContainerModule, PrismaModule],
    })
      .overrideProvider(DockerService)
      .useValue(dockerFake)
      .overrideProvider(PrismaService)
      .useValue(prismaFake)
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
    prismaFake.service.findUnique.mockReset();
    prismaFake.project.findUnique.mockReset();
    prismaFake.environmentVariable.findMany.mockReset();
    prismaFake.log.create.mockReset();

    fns.listContainers.mockResolvedValue(rawList);
    fns.createContainer.mockResolvedValue({ inspect: fns.inspect });
    fns.inspect.mockResolvedValue(rawInspect);
    fns.start.mockResolvedValue(undefined);
    fns.stop.mockResolvedValue(undefined);
    fns.restart.mockResolvedValue(undefined);
    fns.kill.mockResolvedValue(undefined);
    fns.remove.mockResolvedValue(undefined);
    fns.listNetworks.mockResolvedValue([]);
    fns.createNetwork.mockResolvedValue(undefined);
    prismaFake.service.findUnique.mockResolvedValue({
      id: 'svc-1',
      slug: 'api',
      projectId: 'prj-1',
    });
    prismaFake.project.findUnique.mockResolvedValue({
      id: 'prj-1',
      slug: 'myproject',
    });
    prismaFake.environmentVariable.findMany.mockResolvedValue([]);
    prismaFake.log.create.mockResolvedValue({});
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
        Ports: [{ PrivatePort: 80 }],
        Labels: { 'shipyard.serviceId': 'svc-1' },
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

  describe('POST /docker/containers', () => {
    const body = {
      image: 'node:20-alpine',
      serviceId: 'svc-1',
      projectId: 'prj-1',
      deploymentId: 'dep-1',
      name: 'shipyard-api-a3f9',
      env: ['NODE_ENV=production', 'PORT=3000'],
      ports: [{ host: 3001, container: 3000 }],
      volumes: [{ name: 'shipyard-data', target: '/data', readOnly: true }],
      network: 'shipyard-myproject',
      cmd: ['node', 'dist/main.js'],
    };

    it('maps the body to dockerode options with labels and defaults', async () => {
      const res = await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send(body)
        .expect(201);

      expect(res.body.Id).toBe(id);
      expect(fns.createContainer).toHaveBeenCalledWith({
        name: 'shipyard-api-a3f9',
        Image: 'node:20-alpine',
        Env: ['NODE_ENV=production', 'PORT=3000'],
        Cmd: ['node', 'dist/main.js'],
        Labels: {
          'shipyard.projectId': 'prj-1',
          'shipyard.serviceId': 'svc-1',
          'shipyard.deploymentId': 'dep-1',
        },
        ExposedPorts: { '3000/tcp': {} },
        HostConfig: {
          PortBindings: { '3000/tcp': [{ HostPort: '3001' }] },
          Binds: ['shipyard-data:/data:ro'],
          RestartPolicy: { Name: 'unless-stopped' },
          NetworkMode: 'shipyard-myproject',
          Privileged: false,
        },
      });
    });

    it('writes a deployment log row tied to the service', async () => {
      await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send(body)
        .expect(201);

      expect(prismaFake.log.create).toHaveBeenCalledWith({
        data: {
          message:
            'Created container shipyard-api-a3f9 from image node:20-alpine',
          level: 'INFO',
          serviceId: 'svc-1',
          deploymentId: 'dep-1',
        },
      });
    });

    it('provisions the derived project network before creating', async () => {
      await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send({ image: 'nginx:latest', serviceId: 'svc-1' })
        .expect(201);

      expect(fns.createNetwork).toHaveBeenCalledWith({
        Name: 'shipyard-myproject-prj-1',
        Driver: 'bridge',
        Labels: { 'shipyard.projectId': 'prj-1' },
      });

      const [options] = fns.createContainer.mock.calls[0] as [
        { HostConfig: { NetworkMode?: string } },
      ];
      expect(options.HostConfig.NetworkMode).toBe('shipyard-myproject-prj-1');
    });

    it('reuses an existing project network', async () => {
      fns.listNetworks.mockResolvedValue([
        { Name: 'shipyard-myproject-prj-1' },
      ]);

      await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send({ image: 'nginx:latest', serviceId: 'svc-1' })
        .expect(201);

      expect(fns.createNetwork).not.toHaveBeenCalled();
    });

    it('merges EnvironmentVariable rows, letting the request override', async () => {
      prismaFake.environmentVariable.findMany.mockResolvedValue([
        { key: 'PORT', value: '3000' },
        { key: 'NODE_ENV', value: 'production' },
      ]);

      await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send({ image: 'nginx:latest', serviceId: 'svc-1', env: ['PORT=4000'] })
        .expect(201);

      const [options] = fns.createContainer.mock.calls[0] as [
        { Env: string[] },
      ];
      expect(options.Env).toEqual(['PORT=4000', 'NODE_ENV=production']);
    });

    it('generates a shipyard name from the service slug when omitted', async () => {
      await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send({ image: 'nginx:latest', serviceId: 'svc-1' })
        .expect(201);

      const [options] = fns.createContainer.mock.calls[0] as [
        { name: string; HostConfig: { NetworkMode?: string } },
      ];
      expect(options.name).toMatch(/^shipyard-api-[0-9a-f]{4}$/);
      // service has a project -> derived network is attached
      expect(options.HostConfig.NetworkMode).toBe('shipyard-myproject-prj-1');
    });

    it('falls back to a generic name when the service is unknown', async () => {
      prismaFake.service.findUnique.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send({ image: 'nginx:latest', serviceId: 'missing' })
        .expect(201);

      const [options] = fns.createContainer.mock.calls[0] as [
        { name: string; Labels: Record<string, string> },
      ];
      expect(options.name).toMatch(/^shipyard-container-[0-9a-f]{4}$/);
      expect(options.Labels).toEqual({ 'shipyard.serviceId': 'missing' });
      // no service FK resolved -> log written without a service link
      expect(prismaFake.log.create).toHaveBeenCalledWith({
        data: {
          message: expect.stringContaining('Created container'),
          level: 'INFO',
          serviceId: undefined,
          deploymentId: undefined,
        },
      });
    });

    it('rejects a bad port mapping', async () => {
      await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send({ image: 'nginx:latest', ports: [{ host: 0, container: 70000 }] })
        .expect(400);
    });

    it('rejects an invalid container name', async () => {
      await request(app.getHttpServer())
        .post('/docker/containers')
        .set(auth)
        .send({ image: 'nginx:latest', name: 'Bad Name!' })
        .expect(400);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .post('/docker/containers')
        .send(body)
        .expect(401);
    });
  });

  describe('GET /docker/containers/:id', () => {
    it('returns the shaped container', async () => {
      const res = await request(app.getHttpServer())
        .get(`/docker/containers/${id}`)
        .set(auth)
        .expect(200);

      expect(res.body.Id).toBe(id);
      expect(res.body.Mounts).toEqual([]);
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

  describe('stop/restart timeout', () => {
    it('stop defaults t to 10', async () => {
      await request(app.getHttpServer())
        .post(`/docker/containers/${id}/stop`)
        .set(auth)
        .expect(201);

      expect(fns.stop).toHaveBeenCalledWith({ t: 10 });
    });

    it('stop forwards an explicit t', async () => {
      await request(app.getHttpServer())
        .post(`/docker/containers/${id}/stop`)
        .set(auth)
        .send({ t: 30 })
        .expect(201);

      expect(fns.stop).toHaveBeenCalledWith({ t: 30 });
    });

    it('restart defaults t to 10', async () => {
      await request(app.getHttpServer())
        .post(`/docker/containers/${id}/restart`)
        .set(auth)
        .expect(201);

      expect(fns.restart).toHaveBeenCalledWith({ t: 10 });
    });

    it('restart forwards an explicit t', async () => {
      await request(app.getHttpServer())
        .post(`/docker/containers/${id}/restart`)
        .set(auth)
        .send({ t: 30 })
        .expect(201);

      expect(fns.restart).toHaveBeenCalledWith({ t: 30 });
    });

    it('rejects an out-of-range t', async () => {
      await request(app.getHttpServer())
        .post(`/docker/containers/${id}/stop`)
        .set(auth)
        .send({ t: 500 })
        .expect(400);
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

  describe('DELETE /docker/containers/:id', () => {
    it('forwards force and volume flags', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/docker/containers/${id}?force=true&v=true`)
        .set(auth)
        .expect(200);

      expect(res.body).toEqual({ id, status: 'removed' });
      expect(fns.remove).toHaveBeenCalledWith({ force: true, v: true });
    });
  });

  describe('action logging', () => {
    it('writes a log row tied to the container labels', async () => {
      fns.inspect.mockResolvedValue({
        ...rawInspect,
        Config: {
          Labels: {
            'shipyard.serviceId': 'svc-1',
            'shipyard.deploymentId': 'dep-1',
          },
        },
      });

      await request(app.getHttpServer())
        .post(`/docker/containers/${id}/start`)
        .set(auth)
        .expect(201);

      expect(prismaFake.log.create).toHaveBeenCalledWith({
        data: {
          message: `Container ${id} started`,
          level: 'INFO',
          serviceId: 'svc-1',
          deploymentId: 'dep-1',
        },
      });
    });

    it('still performs the action when labels cannot be read', async () => {
      fns.inspect.mockRejectedValueOnce(new Error('no such container'));

      const res = await request(app.getHttpServer())
        .post(`/docker/containers/${id}/start`)
        .set(auth)
        .expect(201);

      expect(res.body).toEqual({ id, status: 'started' });
      expect(fns.start).toHaveBeenCalledTimes(1);
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
      ['delete', `/docker/containers/${id}`],
    ])('%s %s rejects requests without a token', async (method, path) => {
      await request(app.getHttpServer())[method](path).expect(401);
    });
  });
});
