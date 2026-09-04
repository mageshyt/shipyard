import { NestFactory } from '@nestjs/core';
import {
  RequestMethod,
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
} from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './shared/interceptors';
import { GlobalExceptionFilter } from './shared/filters';
import { validationPipeOptions } from '@app/core/config/app.option';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // ======================================================
  // ? Initialization
  // ======================================================

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    snapshot: true,
    cors: true,
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // Trust proxy - required for accurate IP tracking behind load balancers
  app.set('trust proxy', 1);

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: VERSION_NEUTRAL,
  });

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/ready', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET },
    ],
  });
  const configService = app.get<ConfigService>(ConfigService);
  const port = +configService.get<number>('PORT')! || 8080;
  const nodeEnv = configService.get<string>('NODE_ENV')!;
  const logger = app.get(Logger);

  // ======================================================
  // ! Security & Performance Middleware
  // ======================================================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false, // Disable CSP in dev for Swagger
      crossOriginEmbedderPolicy: false, // Allow embedded resources
    }),
  );

  // Compression - Reduce response size
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses > 1KB
    }),
  );

  // Validation pipe with security options
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));

  // Configure JSON body size limit for bulk operations (10MB)
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '10mb' });

  // ======================================================
  // ! Global Interceptor and Filters
  // ======================================================
  app.useGlobalInterceptors(
    new LoggerErrorInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS configuration
  const allowedOrigins = configService
    .get<string>('FRONTEND_URL', 'http://localhost:3000')
    .split(',');

  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? allowedOrigins
        : ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    maxAge: 3600, // Cache preflight for 1 hour
  });

  const config = new DocumentBuilder()
    .setTitle('Shipyard API 🚢')
    .setDescription('Shipyard - deploy anything, anywhere')
    .setVersion('1.0')
    .addTag('Shipyard')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    });

  const document = SwaggerModule.createDocument(app, config.build());

  // Only enable Swagger in non-production environments for security
  if (nodeEnv !== 'production') {
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      explorer: true,
      jsonDocumentUrl: '/api-docs/json',
      yamlDocumentUrl: '/api-docs/yaml',
    });
    logger.log('📚 Swagger UI available at /api-docs');
  } else {
    logger.log('📚 Swagger disabled in production (security)');
  }

  await app.listen(port || 8000, '0.0.0.0');

  logger.log(
    `Application is running on: ${await app.getUrl()} in ${nodeEnv} mode`,
  );

  // ======================================================
  // ! Graceful Shutdown
  // ======================================================
  const gracefulShutdown = async (signal: string) => {
    logger.log(`Received ${signal}, gracefully shutting down...`);
    try {
      await app.close();
      logger.log('Application closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
bootstrap();
