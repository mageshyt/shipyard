import { PrismaService } from '@app/shared/services/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { promisify } from 'node:util';
import { FetchContext, SourceFetcher } from './source-fetcher';

const execFileAsync = promisify(execFile);

const CLONE_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable()
export class GitFetcher implements SourceFetcher {
  private readonly logger = new Logger(GitFetcher.name);

  constructor(private readonly db: PrismaService) {}

  async fetch(ctx: FetchContext): Promise<string> {
    const { deployment, service, workspace, signal } = ctx;

    if (!service.repositoryUrl) {
      throw new UnrecoverableError(
        `Service ${service.id} has no repositoryUrl for GIT source`,
      );
    }

    const branch = deployment.branch ?? service.branch ?? 'main';
    const pin = deployment.commitHash ?? undefined;

    if (pin) {
      this.logger.log(
        `Fetching commit ${pin} from ${service.repositoryUrl} into ${workspace}`,
      );
      await this.fetchCommit(service.repositoryUrl, pin, workspace, signal);
    } else {
      this.logger.log(
        `Cloning ${service.repositoryUrl} (branch: ${branch}) into ${workspace}`,
      );
      await this.git(
        [
          'clone',
          '--depth',
          '1',
          '--single-branch',
          '--branch',
          branch,
          service.repositoryUrl,
          workspace,
        ],
        undefined,
        signal,
      );
    }

    const sha = await this.git(['rev-parse', 'HEAD'], workspace, signal);
    if (pin && sha !== pin) {
      throw new Error(`Commit hash mismatch: expected ${pin}, got ${sha}`);
    }

    await this.db.deployment.update({
      where: { id: deployment.id },
      data: { commitHash: sha },
    });

    this.logger.log(`Checked out ${sha} for deployment ${deployment.id}`);

    return workspace;
  }

  private async fetchCommit(
    url: string,
    sha: string,
    dir: string,
    signal: AbortSignal | undefined,
  ): Promise<void> {
    await mkdir(dir, { recursive: true });
    await this.git(['init'], dir, signal);
    await this.git(['remote', 'add', 'origin', url], dir, signal);
    await this.git(['fetch', '--depth', '1', 'origin', sha], dir, signal);
    await this.git(['checkout', sha], dir, signal);
  }

  private async git(
    args: string[],
    cwd: string | undefined,
    signal: AbortSignal | undefined,
  ): Promise<string> {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      timeout: CLONE_TIMEOUT_MS,
      killSignal: 'SIGKILL',
      signal,
    });
    return stdout.trim();
  }
}
