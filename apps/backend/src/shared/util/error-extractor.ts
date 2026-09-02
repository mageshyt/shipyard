import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

export interface ErrorDetails {
  message: string;
  error: string;
  statusCode: number;
}

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

    return this.handleInternalError(exception);
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
