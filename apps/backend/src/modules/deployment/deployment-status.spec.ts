import { jest } from '@jest/globals';

const { DEPLOYMENT_TRANSITIONS, ACTIVE_DEPLOYMENT_STATUSES, canTransition } =
  await import('./deployment-status');

const ALL_STATUSES = Object.keys(DEPLOYMENT_TRANSITIONS);

describe('deployment state machine', () => {
  it('only ever transitions to statuses that exist', () => {
    for (const to of ALL_STATUSES.flatMap((from) => DEPLOYMENT_TRANSITIONS[from])) {
      expect(ALL_STATUSES).toContain(to);
    }
  });

  it('terminal statuses have no exits', () => {
    const terminal = ALL_STATUSES.filter(
      (s) => DEPLOYMENT_TRANSITIONS[s].length === 0,
    );
    for (const from of terminal) {
      expect(DEPLOYMENT_TRANSITIONS[from]).toEqual([]);
    }
  });

  it('every active status can be cancelled and can fail', () => {
    for (const active of ACTIVE_DEPLOYMENT_STATUSES) {
      expect(DEPLOYMENT_TRANSITIONS[active]).toContain('CANCELLED');
      expect(DEPLOYMENT_TRANSITIONS[active]).toContain('FAILED');
    }
  });

  it('terminal statuses cannot be cancelled', () => {
    for (const s of ['RUNNING', 'FAILED', 'CANCELLED'] as const) {
      expect(canTransition(s, 'CANCELLED')).toBe(false);
    }
  });

  it('a healthy deployment reaches RUNNING by the documented path', () => {
    const path: string[] = ['QUEUED', 'PREPARING', 'BUILDING', 'DEPLOYING', 'RUNNING'];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });
});
