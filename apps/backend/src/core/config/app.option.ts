import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

// NOTE: cacheModuleOptions / throttlerModuleOptions will be added when
// caching & rate-limiting are configured.

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  cache: false,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().default(8080),
    BASE_URL: Joi.string().default('http://localhost:8080'),
    FRONTEND_URL: Joi.string().default('http://localhost:3000'),
    LOG_LEVEL: Joi.string()
      .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
      .optional(),

    DATABASE_URL: Joi.string().required(),

    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_USERNAME: Joi.string().default('default'),
    REDIS_PASSWORD: Joi.string().optional(),
    REDIS_URL: Joi.string().default('redis://default:redispw@localhost:6379'),

    THROTTLE_REDIS_URL: Joi.string().optional(),

    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION_TIME: Joi.string().default('30d'),
  }),
};
