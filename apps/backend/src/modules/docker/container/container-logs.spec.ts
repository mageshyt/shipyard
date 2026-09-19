import { jest } from '@jest/globals';
import { PassThrough } from 'stream';
import { ContainerService } from './container.service';
import { DockerService } from '../docker.service';
import { PrismaService } from '@app/shared/services/prisma/prisma.service';

describe('ContainerService.streamContainerLogs', () => {
  function build(tty: boolean) {
    const source = new PassThrough();
    const container = {
      logs: jest.fn(() => Promise.resolve(source)),
      inspect: jest.fn(() => Promise.resolve({ Config: { Tty: tty } })),
      modem: {
        // stand in for Docker's multiplexer: copy frames onto stdout
        demuxStream: (from: PassThrough, out: PassThrough) => {
          from.on('data', (chunk) => out.write(chunk));
        },
      },
    };
    const dockerService = {
      getContainer: jest.fn(() => container),
    } as unknown as DockerService;

    return {
      service: new ContainerService(dockerService, {} as PrismaService),
      source,
    };
  }

  it('splits demuxed chunks into stdout SSE events, carrying partial lines', async () => {
    const { service, source } = build(false);
    const stream = await service.streamContainerLogs('abc');

    const events: unknown[] = [];
    const subscription = stream.subscribe((event) => events.push(event));

    source.write('hello\nwor');
    source.write('ld\n');
    await new Promise((resolve) => setImmediate(resolve));

    expect(events).toEqual([
      { data: 'hello', type: 'stdout' },
      { data: 'world', type: 'stdout' },
    ]);

    subscription.unsubscribe();
  });

  it('reads a TTY stream directly (no demux)', async () => {
    const { service, source } = build(true);
    const stream = await service.streamContainerLogs('abc');

    const events: unknown[] = [];
    const subscription = stream.subscribe((event) => events.push(event));

    source.write('tty line\n');
    await new Promise((resolve) => setImmediate(resolve));

    expect(events).toEqual([{ data: 'tty line', type: 'stdout' }]);

    subscription.unsubscribe();
  });

  it('destroys the docker stream on unsubscribe', async () => {
    const { service, source } = build(false);
    const stream = await service.streamContainerLogs('abc');

    const subscription = stream.subscribe();
    subscription.unsubscribe();

    expect(source.destroyed).toBe(true);
  });
});
