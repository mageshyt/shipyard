import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

export interface ErrorDetails {
  message: string;
  error: string;
  statusCode: number;
}

// docker-modem rejects with a plain Error carrying `statusCode`/`reason`/`json`
// (HTTP failures) or a Node socket `code` (daemon down).
interface DockerError {
  statusCode?: number;
  reason?: string;
  code?: string;
  json?: { message?: string };
  message?: string;
}

const DOCKER_UNAVAILABLE_CODES = new Set([
  'ENOENT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EACCES',
]);

export class ErrorExtractor {
  static extract(exception: unknown): ErrorDetails {
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return this.handlePrismaValidationError(exception);
    }

    if (this.isDockerError(exception)) {
      return this.handleDockerError(exception);
    }

    return this.handleInternalError(exception);
  }

  private static isDockerError(exception: unknown): exception is DockerError {
    if (typeof exception !== 'object' || exception === null) {
      return false;
    }

    const candidate = exception as DockerError;
    return (
      typeof candidate.statusCode === 'number' ||
      typeof candidate.reason === 'string' ||
      (typeof candidate.code === 'string' &&
        DOCKER_UNAVAILABLE_CODES.has(candidate.code))
    );
  }

  private static handleDockerError(exception: DockerError): ErrorDetails {
    const message =
      (typeof exception.json?.message === 'string'
        ? exception.json.message
        : undefined) ??
      exception.reason ??
      exception.message ??
      'Docker request failed';

    // no HTTP status means the socket itself failed -> daemon unreachable
    if (exception.statusCode === undefined) {
      return {
        statusCode: HttpStatus.BAD_GATEWAY,
        error: 'Docker Unavailable',
        message: 'Docker unavailable',
      };
    }

    const status: HttpStatus = exception.statusCode;
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message,
        };
      case HttpStatus.UNAUTHORIZED:
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message,
        };
      case HttpStatus.FORBIDDEN:
        return {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message,
        };
      case HttpStatus.NOT_FOUND:
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message,
        };
      case HttpStatus.CONFLICT:
        return { statusCode: HttpStatus.CONFLICT, error: 'Conflict', message };
      default:
        return status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? {
              statusCode: HttpStatus.BAD_GATEWAY,
              error: 'Docker Unavailable',
              message,
            }
          : {
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              error: 'Internal Server Error',
              message,
            };
    }
  }

  private static handleHttpException(exception: HttpException): ErrorDetails {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message: string = exception.message;
    let error: string = 'Http Exception';

    if (typeof response === 'object' && response !== null) {
      const resp = response as Record<string, unknown>;
      if (resp.message) {
        message = Array.isArray(resp.message)
          ? (resp.message as string[]).join(', ')
          : (resp.message as string) || exception.message;
      }
      if (resp.error && typeof resp.error === 'string') {
        error = resp.error;
      }
    }

    return {
      message,
      error,
      statusCode: status,
    };
  }

  private static handlePrismaKnownError(
    prismaError: Prisma.PrismaClientKnownRequestError,
  ): ErrorDetails {
    const errorCode: string = prismaError.code;

    switch (errorCode) {
      case 'P2002': {
        // Unique constraint violation
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'Resource already exists',
        };
      }
      case 'P2025': {
        // Record not found
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Record not found',
        };
      }
      case 'P2003': {
        // Foreign key constraint failed
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Foreign key constraint failed',
        };
      }
      default: {
        const errorMessage: string = prismaError.message;
        Logger.error(`Prisma Error: ${errorCode} - ${errorMessage}`);
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Database Error',
          message: 'A database error occurred',
        };
      }
    }
  }

  private static handlePrismaValidationError(
    prismaError: Prisma.PrismaClientValidationError,
  ): ErrorDetails {
    const errorMessage: string = prismaError.message;
    Logger.error(`Prisma Validation Error: ${errorMessage}`);
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Validation Error',
      message: 'Invalid data provided',
    };
  }

  private static handleInternalError(exception: unknown): ErrorDetails {
    Logger.error(exception instanceof Error ? exception.stack : exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };
  }
}
