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
import { VolumeModule } from '../src/modules/docker/volume/volume.module';
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

describe('Volumes (e2e)', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer test-token' };
  const name = 'shipyard-lazy-fox-data';

  // Fake dockerode surface. The real VolumeService runs against it,
  // so DTO shaping and generated-name behaviour are covered.
  const fns = {
    listVolumes: jest.fn<() => Promise<unknown>>(),
    createVolume: jest.fn<(opts: unknown) => Promise<unknown>>(),
    inspect: jest.fn<() => Promise<unknown>>(),
    remove: jest.fn<(opts: unknown) => Promise<unknown>>(),
  };
  const getVolume = jest.fn(() => ({
    inspect: fns.inspect,
    remove: fns.remove,
  }));
  const dockerFake = {
    client: {
      listVolumes: fns.listVolumes,
      createVolume: fns.createVolume,
      getVolume,
    },
  };

  const rawVolume = {
    Name: name,
    Driver: 'local',
    Mountpoint: `/var/lib/docker/volumes/${name}/_data`,
    Labels: { 'created-by': 'shipyard-api' },
    Scope: 'local',
    Options: null,
    UsageData: { Size: 1234, RefCount: 1 },
    // dockerode extra that the DTO must strip
    Status: { hello: 'world' },
  };

  const shaped = {
    Name: name,
    Driver: 'local',
    Mountpoint: `/var/lib/docker/volumes/${name}/_data`,
    Labels: { 'created-by': 'shipyard-api' },
    Scope: 'local',
    Options: null,
    UsageData: { Size: 1234, RefCount: 1 },
  };

  // dockerode's createVolume resolves to a Volume handle, not the body, so the
  // service creates then re-inspects. The mock mirrors that handle shape.
  const createdHandle = {};

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [VolumeModule],
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
    getVolume.mockClear();

    fns.listVolumes.mockResolvedValue({ Volumes: [rawVolume], Warnings: [] });
    fns.createVolume.mockResolvedValue(createdHandle);
    fns.inspect.mockResolvedValue(rawVolume);
    fns.remove.mockResolvedValue(undefined);
  });
  describe('GET /docker/volumes', () => {
    it('lists shaped volumes and strips daemon noise', async () => {
      const res = await request(app.getHttpServer())
        .get('/docker/volumes')
        .set(auth)
        .expect(200);

      expect(res.body).toEqual([shaped]);
      expect(fns.listVolumes).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list when the daemon reports none', async () => {
      fns.listVolumes.mockResolvedValueOnce({ Volumes: null, Warnings: [] });
      const res = await request(app.getHttpServer())
        .get('/docker/volumes')
        .set(auth)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('surfaces a 500 when the daemon call fails', async () => {
      fns.listVolumes.mockRejectedValueOnce(new Error('connect ENOENT'));
      await request(app.getHttpServer())
        .get('/docker/volumes')
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get('/docker/volumes').expect(401);
    });
  });

  describe('POST /docker/volumes', () => {
    it('creates a volume with a generated shipyard name', async () => {
      const res = await request(app.getHttpServer())
        .post('/docker/volumes')
        .set(auth)
        .send({ name: 'data' })
        .expect(201);

      expect(res.body).toEqual(shaped);
      expect(fns.createVolume).toHaveBeenCalledWith({
        Name: expect.stringMatching(
          /^shipyard-api-(quick|lazy|sleepy|noisy|hungry)-(fox|dog|cat|mouse|bear)-data$/,
        ),
        Labels: { 'created-by': 'shipyard-api' },
      });
    });

    it('rejects a missing name', async () => {
      await request(app.getHttpServer())
        .post('/docker/volumes')
        .set(auth)
        .send({})
        .expect(400);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .post('/docker/volumes')
        .send({ name: 'data' })
        .expect(401);
    });
  });

  describe('GET /docker/volumes/:name', () => {
    it('returns the shaped volume', async () => {
      const res = await request(app.getHttpServer())
        .get(`/docker/volumes/${name}`)
        .set(auth)
        .expect(200);

      expect(res.body).toEqual(shaped);
      expect(getVolume).toHaveBeenCalledWith(name);
    });

    it('surfaces a 500 for an unknown volume', async () => {
      fns.inspect.mockRejectedValueOnce(new Error('no such volume'));
      await request(app.getHttpServer())
        .get('/docker/volumes/missing')
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .get(`/docker/volumes/${name}`)
        .expect(401);
    });
  });

  describe('DELETE /docker/volumes/:name', () => {
    it('removes the volume, defaulting force to false', async () => {
      await request(app.getHttpServer())
        .delete(`/docker/volumes/${name}`)
        .set(auth)
        .expect(200);

      expect(getVolume).toHaveBeenCalledWith(name);
      expect(fns.remove).toHaveBeenCalledWith({ force: false });
    });

    it('forwards an explicit force flag', async () => {
      await request(app.getHttpServer())
        .delete(`/docker/volumes/${name}?force=true`)
        .set(auth)
        .expect(200);

      expect(fns.remove).toHaveBeenCalledWith({ force: true });
    });

    it('surfaces a 500 when removal fails', async () => {
      fns.remove.mockRejectedValueOnce(new Error('volume is in use'));
      await request(app.getHttpServer())
        .delete(`/docker/volumes/${name}`)
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .delete(`/docker/volumes/${name}`)
        .expect(401);
    });
  });
});
