import { Params } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

export const loggerConfig: Params = {
  forRoutes: ['*'],

  pinoHttp: {
    name: 'Shipyard-API',
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          singleLine: true,
          colorize: true,
          levelFirst: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname,context',
        },
      },
    }),

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.currentPassword',
        'req.body.newPassword',
        'req.body.token',
      ],
      remove: true,
    },

    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.originalUrl || req.url,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },

    autoLogging: {
      ignore: (req) => {
        const ignoredPaths = ['/health', '/favicon.ico', '/api-docs'];
        return ignoredPaths.some((path) => req.url?.startsWith(path));
      },
    },

    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      if (res.statusCode >= 300) return 'debug';
      return 'info';
    },

    customSuccessMessage: (req, res) => {
      const url = req.url;
      return `${req.method} ${url?.split('?')[0]} ${res.statusCode}`;
    },

    customErrorMessage: (req, res, err) => {
      const url = req.url;
      return `${req.method} ${url?.split('?')[0]} ${res.statusCode} - ${err.message}`;
    },

    customAttributeKeys: {
      responseTime: 'duration',
    },

    genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
  },
};
