import { jest } from '@jest/globals';

const ping = jest.fn<() => Promise<unknown>>();
const version = jest.fn<() => Promise<unknown>>();
const info = jest.fn<() => Promise<unknown>>();
const MockDocker = jest.fn<(opts: unknown) => unknown>(() => ({
  ping,
  version,
  info,
}));

jest.unstable_mockModule('dockerode', () => ({ default: MockDocker }));

const { Test } = await import('@nestjs/testing');
const { DockerService } = await import('./docker.service');

describe('DockerService', () => {
  let service: InstanceType<typeof DockerService>;

  beforeEach(async () => {
    MockDocker.mockClear();
    ping.mockResolvedValue(Buffer.from('OK'));
    version.mockResolvedValue({ Version: '28.3.2', ApiVersion: '1.51' });
    info.mockResolvedValue({
      Containers: 3,
      ContainersRunning: 2,
      ContainersStopped: 1,
      Images: 23,
    });

    const module = await Test.createTestingModule({
      providers: [DockerService],
    }).compile();
    await module.init();
    service = module.get(DockerService);
  });

  it('creates the client against the local socket on init', () => {
    expect(MockDocker).toHaveBeenCalledWith({
      socketPath: '/var/run/docker.sock',
    });
  });

  it('pingDocker returns a slim typed health summary, not daemon dumps', async () => {
    await expect(service.pingDocker()).resolves.toEqual({
      reachable: true,
      serverVersion: '28.3.2',
      apiVersion: '1.51',
      containers: { total: 3, running: 2, stopped: 1 },
      images: 23,
    });
    expect(ping).toHaveBeenCalledTimes(1);
    expect(version).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
  });
});
