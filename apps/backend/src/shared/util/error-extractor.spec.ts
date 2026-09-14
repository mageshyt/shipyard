import { NotFoundException } from '@nestjs/common';
import { ErrorExtractor } from './error-extractor';

describe('ErrorExtractor', () => {
  describe('docker errors', () => {
    it('maps a daemon 404 and prefers the daemon message', () => {
      expect(
        ErrorExtractor.extract({
          statusCode: 404,
          reason: 'no such container',
          json: { message: 'No such container: abc123' },
          message: '(HTTP code 404) no such container',
        }),
      ).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'No such container: abc123',
      });
    });

    it('maps a daemon 409 to conflict', () => {
      expect(
        ErrorExtractor.extract({
          statusCode: 409,
          reason: 'conflict',
          json: { message: 'network foo already exists' },
        }),
      ).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'network foo already exists',
      });
    });

    it('maps a daemon 400 to bad request', () => {
      expect(
        ErrorExtractor.extract({
          statusCode: 400,
          json: { message: 'No such image' },
        }),
      ).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'No such image',
      });
    });

    it('maps a daemon 500 to 502 unavailable', () => {
      expect(
        ErrorExtractor.extract({
          statusCode: 500,
          json: { message: 'server error' },
        }),
      ).toEqual({
        statusCode: 502,
        error: 'Docker Unavailable',
        message: 'server error',
      });
    });

    it.each(['ENOENT', 'ECONNREFUSED', 'EACCES'])(
      'maps socket %s to 502 unavailable',
      (code) => {
        expect(
          ErrorExtractor.extract({ code, errno: -2, syscall: 'connect' }),
        ).toEqual({
          statusCode: 502,
          error: 'Docker Unavailable',
          message: 'Docker unavailable',
        });
      },
    );

    it('falls back to reason when json is not an object', () => {
      expect(
        ErrorExtractor.extract({
          statusCode: 404,
          reason: 'no such image',
          json: Buffer.from('nope'),
        }),
      ).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'no such image',
      });
    });
  });

  it('still maps HttpExceptions', () => {
    expect(
      ErrorExtractor.extract(new NotFoundException('Project not found')),
    ).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Project not found',
    });
  });

  it('maps unknown errors to 500', () => {
    expect(ErrorExtractor.extract(new Error('boom'))).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });
});
