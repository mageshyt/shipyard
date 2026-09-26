import { jest } from '@jest/globals';

const { tokenizeCommand } = await import('./shell-tokenize');

describe('tokenizeCommand', () => {
  it('splits on unquoted whitespace', () => {
    expect(tokenizeCommand('node dist/main.js --port 3000')).toEqual([
      'node',
      'dist/main.js',
      '--port',
      '3000',
    ]);
  });

  it('keeps quoted strings as single args', () => {
    expect(tokenizeCommand('node --name "hello world"')).toEqual([
      'node',
      '--name',
      'hello world',
    ]);
    expect(tokenizeCommand("echo 'a b' c")).toEqual(['echo', 'a b', 'c']);
  });

  it('handles escapes inside double quotes and bare backslashes', () => {
    expect(tokenizeCommand('echo "a\\"b"')).toEqual(['echo', 'a"b']);
    expect(tokenizeCommand('echo a\\ b')).toEqual(['echo', 'a b']);
  });

  it('rejects shell control operators', () => {
    expect(() => tokenizeCommand('node server.js | tee log')).toThrow(
      /Shell control operator/,
    );
    expect(() => tokenizeCommand('a && b; c')).toThrow(/&&, ;/);
  });

  it('returns a single arg for a quoted-only string', () => {
    expect(tokenizeCommand('"npm start"')).toEqual(['npm start']);
  });

  it('collapses repeated whitespace without producing empty args', () => {
    expect(tokenizeCommand('  a   \t b  ')).toEqual(['a', 'b']);
  });
});
