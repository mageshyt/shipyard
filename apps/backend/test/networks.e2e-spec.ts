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
import { NetworksModule } from '../src/modules/docker/networks/networks.module';
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

describe('Networks (e2e)', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer test-token' };
  const id = '14a61926d66e';

  // Fake dockerode surface. The real NetworksService runs against it,
  // so DTO shaping (stripping daemon noise) and name generation are covered.
  const fns = {
    listNetworks: jest.fn<() => Promise<unknown>>(),
    createNetwork: jest.fn<(opts: unknown) => Promise<unknown>>(),
    inspect: jest.fn<() => Promise<unknown>>(),
    remove: jest.fn<() => Promise<unknown>>(),
  };
  const getNetwork = jest.fn(() => ({
    inspect: fns.inspect,
    remove: fns.remove,
  }));
  const dockerFake = {
    client: {
      listNetworks: fns.listNetworks,
      createNetwork: fns.createNetwork,
      getNetwork,
    },
  };

  const rawNetwork = {
    Name: 'docker_gwbridge',
    Id: id,
    Created: '2026-09-05T14:07:07.99206692Z',
    Scope: 'local',
    Driver: 'bridge',
    EnableIPv4: true,
    EnableIPv6: false,
    IPAM: {
      Driver: 'default',
      Options: null,
      Config: [{ Subnet: '172.20.0.0/16', Gateway: '172.20.0.1' }],
    },
    Internal: false,
    Attachable: false,
    Ingress: false,
    ConfigFrom: { Network: '' },
    ConfigOnly: false,
    Containers: {
      abc123: {
        Name: '/web',
        EndpointID: 'ep-1',
        MacAddress: '02:42:ac:14:00:02',
        IPv4Address: '172.20.0.2/16',
        IPv6Address: '',
      },
    },
    Options: {
      'com.docker.network.bridge.enable_icc': 'false',
      'com.docker.network.bridge.name': 'docker_gwbridge',
    },
    Labels: {},
  };

  const shaped = {
    Id: id,
    Name: 'docker_gwbridge',
    Created: '2026-09-05T14:07:07.99206692Z',
    Scope: 'local',
    Driver: 'bridge',
    IPAM: {
      Driver: 'default',
      Config: [{ Subnet: '172.20.0.0/16', Gateway: '172.20.0.1' }],
    },
    Internal: false,
    Attachable: false,
    Ingress: false,
    Labels: {},
    Containers: {
      abc123: {
        Name: '/web',
        EndpointID: 'ep-1',
        IPv4Address: '172.20.0.2/16',
        IPv6Address: '',
      },
    },
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [NetworksModule],
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
    getNetwork.mockClear();

    fns.listNetworks.mockResolvedValue([rawNetwork]);
    fns.inspect.mockResolvedValue(rawNetwork);
    fns.createNetwork.mockResolvedValue({ inspect: fns.inspect });
    fns.remove.mockResolvedValue(undefined);
  });

  describe('GET /docker/networks', () => {
    it('lists shaped networks and strips daemon noise', async () => {
      const res = await request(app.getHttpServer())
        .get('/docker/networks')
        .set(auth)
        .expect(200);

      expect(res.body).toEqual([shaped]);
      expect(fns.listNetworks).toHaveBeenCalledTimes(1);
    });

    it('surfaces a 500 when the daemon call fails', async () => {
      fns.listNetworks.mockRejectedValueOnce(new Error('connect ENOENT'));
      await request(app.getHttpServer())
        .get('/docker/networks')
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get('/docker/networks').expect(401);
    });
  });

  describe('GET /docker/networks/:id', () => {
    it('returns the shaped network', async () => {
      const res = await request(app.getHttpServer())
        .get(`/docker/networks/${id}`)
        .set(auth)
        .expect(200);

      expect(res.body).toEqual(shaped);
      expect(getNetwork).toHaveBeenCalledWith(id);
    });

    it('surfaces a 500 for an unknown network', async () => {
      fns.inspect.mockRejectedValueOnce(new Error('no such network'));
      await request(app.getHttpServer())
        .get('/docker/networks/missing')
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .get(`/docker/networks/${id}`)
        .expect(401);
    });
  });

  describe('POST /docker/networks', () => {
    it('creates a bridge network with a generated name', async () => {
      const res = await request(app.getHttpServer())
        .post('/docker/networks')
        .set(auth)
        .send({ name: 'my-network' })
        .expect(201);

      expect(res.body).toEqual(shaped);
      expect(fns.createNetwork).toHaveBeenCalledWith({
        Name: expect.stringMatching(/^shipyard-my-network-[0-9a-f]{16}$/),
        Driver: 'bridge',
      });
    });

    it('rejects a missing name', async () => {
      await request(app.getHttpServer())
        .post('/docker/networks')
        .set(auth)
        .send({})
        .expect(400);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .post('/docker/networks')
        .send({ name: 'my-network' })
        .expect(401);
    });
  });

  describe('DELETE /docker/networks/:id', () => {
    it('removes the network by id', async () => {
      await request(app.getHttpServer())
        .delete(`/docker/networks/${id}`)
        .set(auth)
        .expect(200);

      expect(getNetwork).toHaveBeenCalledWith(id);
      expect(fns.remove).toHaveBeenCalledTimes(1);
    });

    it('surfaces a 500 when removal fails', async () => {
      fns.remove.mockRejectedValueOnce(new Error('network is in use'));
      await request(app.getHttpServer())
        .delete(`/docker/networks/${id}`)
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .delete(`/docker/networks/${id}`)
        .expect(401);
    });
  });
});
