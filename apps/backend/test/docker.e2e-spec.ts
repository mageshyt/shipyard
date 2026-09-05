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
import { DockerModule } from '../src/modules/docker/docker.module';
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

describe('Docker (e2e)', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer test-token' };

  const dockerMock = {
    pingDocker: jest.fn<() => Promise<unknown>>(),
    listImages: jest.fn<() => Promise<unknown>>(),
  };

  const health = {
    reachable: true,
    serverVersion: '28.3.2',
    apiVersion: '1.51',
    containers: { total: 3, running: 2, stopped: 1 },
    images: 23,
  };
  const images = [{ Id: 'sha256:111', RepoTags: ['nginx:latest'] }];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [DockerModule],
    })
      .overrideProvider(DockerService)
      .useValue(dockerMock)
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
    dockerMock.pingDocker.mockResolvedValue(health);
    dockerMock.listImages.mockResolvedValue(images);
  });

  describe('GET /docker/health', () => {
    it('returns the daemon health summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/docker/health')
        .set(auth)
        .expect(200);

      expect(res.body).toEqual(health);
    });

    it('surfaces a 500 when the daemon is unreachable', async () => {
      dockerMock.pingDocker.mockRejectedValueOnce(new Error('connect ENOENT'));
      await request(app.getHttpServer())
        .get('/docker/health')
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get('/docker/health').expect(401);
    });
  });

  describe('GET /docker/images', () => {
    it('returns the image list', async () => {
      const res = await request(app.getHttpServer())
        .get('/docker/images')
        .set(auth)
        .expect(200);

      expect(res.body).toEqual(images);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get('/docker/images').expect(401);
    });
  });
});
