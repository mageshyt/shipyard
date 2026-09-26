import { parse } from 'shell-quote';

export function tokenizeCommand(command: string): string[] {
  const tokens = parse(command) as (string | { op: string })[];
  const ops = tokens.filter(
    (token): token is { op: string } => typeof token !== 'string',
  );
  if (ops.length > 0) {
    throw new Error(
      `Shell control operator(s) [${ops.map((o) => o.op).join(', ')}] not allowed in command; wrap it in 'sh -c' if you need shell features`,
    );
  }
  return tokens.filter((token): token is string => typeof token === 'string');
}
