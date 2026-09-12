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
import { ImagesModule } from '../src/modules/docker/images/images.module';
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

describe('Images (e2e)', () => {
  let app: INestApplication;
  const auth = { Authorization: 'Bearer test-token' };
  const id = 'sha256:111';

  // Fake dockerode surface. The real ImagesService runs against it,
  // so DTO shaping, pull-stream consumption and status payloads are covered.
  const fns = {
    listImages: jest.fn<() => Promise<unknown>>(),
    pull: jest.fn<(ref: string) => Promise<unknown>>(),
    remove: jest.fn<() => Promise<unknown>>(),
  };
  const getImage = jest.fn(() => ({ remove: fns.remove }));
  const followProgress = jest.fn(
    (_stream: unknown, cb: (err: Error | null) => void) => cb(null),
  );
  const dockerFake = {
    client: {
      listImages: fns.listImages,
      pull: fns.pull,
      getImage,
      modem: { followProgress },
    },
  };

  const rawList = [
    {
      Id: id,
      ParentId: '',
      RepoTags: ['nginx:latest'],
      Created: 1700000000,
      Size: 187000000,
      SharedSize: 0,
      Containers: 0,
      Labels: { maintainer: 'nginx' },
      Descriptor: {
        mediaType: 'application/vnd.oci.image.manifest.v1+json',
        digest: 'sha256:abc',
        size: 1234,
      },
      // dockerode extras that the DTO must strip
      VirtualSize: 187000000,
      RepoDigests: ['nginx@sha256:abc'],
    },
  ];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ImagesModule],
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
    getImage.mockClear();
    followProgress.mockReset();
    followProgress.mockImplementation(
      (_stream: unknown, cb: (err: Error | null) => void) => cb(null),
    );

    fns.listImages.mockResolvedValue(rawList);
    fns.pull.mockResolvedValue({});
    fns.remove.mockResolvedValue(undefined);
  });

  describe('GET /docker/images', () => {
    it('lists shaped images and strips dockerode extras', async () => {
      const res = await request(app.getHttpServer())
        .get('/docker/images')
        .set(auth)
        .expect(200);

      expect(res.body).toEqual([
        {
          Id: id,
          ParentId: '',
          RepoTags: ['nginx:latest'],
          Created: 1700000000,
          Size: 187000000,
          SharedSize: 0,
          Containers: 0,
          Labels: { maintainer: 'nginx' },
          Descriptor: {
            mediaType: 'application/vnd.oci.image.manifest.v1+json',
            digest: 'sha256:abc',
            size: 1234,
          },
        },
      ]);
      expect(fns.listImages).toHaveBeenCalledTimes(1);
    });

    it('surfaces a 500 when the daemon call fails', async () => {
      fns.listImages.mockRejectedValueOnce(new Error('connect ENOENT'));
      await request(app.getHttpServer())
        .get('/docker/images')
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get('/docker/images').expect(401);
    });
  });

  describe('POST /docker/images/pull', () => {
    it('pulls the ref, drains the stream and reports success', async () => {
      const res = await request(app.getHttpServer())
        .post('/docker/images/pull')
        .set(auth)
        .send({ fromImage: 'nginx', tag: 'latest' })
        .expect(201);

      expect(res.body).toEqual({
        fromImage: 'nginx',
        tag: 'latest',
        message: 'Successfully pulled image nginx:latest',
      });
      expect(fns.pull).toHaveBeenCalledWith('nginx:latest');
      // pull only completes once the progress stream is consumed
      expect(followProgress).toHaveBeenCalledTimes(1);
    });

    it('surfaces a 500 when the pull stream reports an error', async () => {
      followProgress.mockImplementationOnce(
        (_stream: unknown, cb: (err: Error | null) => void) =>
          cb(new Error('manifest unknown')),
      );

      await request(app.getHttpServer())
        .post('/docker/images/pull')
        .set(auth)
        .send({ fromImage: 'nginx', tag: 'latest' })
        .expect(500);
    });

    it('rejects a missing tag', async () => {
      await request(app.getHttpServer())
        .post('/docker/images/pull')
        .set(auth)
        .send({ fromImage: 'nginx' })
        .expect(400);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .post('/docker/images/pull')
        .send({ fromImage: 'nginx', tag: 'latest' })
        .expect(401);
    });
  });

  describe('DELETE /docker/images/:id', () => {
    it('removes the image by id', async () => {
      await request(app.getHttpServer())
        .delete(`/docker/images/${id}`)
        .set(auth)
        .expect(200);

      expect(getImage).toHaveBeenCalledWith(id);
      expect(fns.remove).toHaveBeenCalledTimes(1);
    });

    it('surfaces a 500 when removal fails', async () => {
      fns.remove.mockRejectedValueOnce(new Error('image is in use'));
      await request(app.getHttpServer())
        .delete(`/docker/images/${id}`)
        .set(auth)
        .expect(500);
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .delete(`/docker/images/${id}`)
        .expect(401);
    });
  });
});
