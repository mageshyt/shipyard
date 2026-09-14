export const ROUTES = {
  AUTH: {
    TAGNAME: 'Authentication',
    CONTROLLER: 'auth',
    REGISTER: 'register',
    LOGIN: 'login',
    LOGOUT: 'logout',
    ME: 'me',
  },

  PROJECT: {
    TAGNAME: 'Projects',
    CONTROLLER: 'projects',
    CREATE: '',
    LIST: '',
    DETAIL: ':id',
    UPDATE: ':id',
    DELETE: ':id',
  },

  SERVICE: {
    TAGNAME: 'Services',
    CONTROLLER: 'services',
    CREATE: '',
    LIST: '',
    DETAIL: ':id',
    UPDATE: ':id',
    DELETE: ':id',
    DEPLOYMENTS: ':id/deployments',
    DEPLOY: ':id/deploy',
    DOMAINS: ':id/domains',
    ENVIRONMENTS: ':id/environment',
    LOGS: ':id/logs',
  },

  HEALTH: {
    TAGNAME: 'Health',
    CONTROLLER: 'health',
    ROOT: '',
    READY: 'ready',
    LIVE: 'live',
  },

  DOCKER: {
    TAGNAME: 'Docker',
    CONTROLLER: 'docker',
    HEALTH: 'health',
  },

  DOCKER_CONTAINERS: {
    TAGNAME: 'Docker Containers',
    CONTROLLER: 'docker/containers',
    LIST: '',
    CREATE: '',
    DETAIL: ':id',
    START: ':id/start',
    STOP: ':id/stop',
    RESTART: ':id/restart',
    KILL: ':id/kill',
    REMOVE: ':id',
    LOGS: ':id/logs',
  },

  DOCKER_NETWORKS: {
    TAGNAME: 'Docker Networks',
    CONTROLLER: 'docker/networks',
    LIST: '',
    DETAIL: ':id',
    CREATE: '',
    REMOVE: ':id',
    CONNECT: ':id/connect/:containerId',
    DISCONNECT: ':id/disconnect/:containerId',
  },

  DOCKER_IMAGE: {
    TAGNAME: 'Docker Images',
    CONTROLLER: 'docker/images',
    LIST: '',
    PULL: 'pull',
    REMOVE: ':id',
  },

  DOCKER_VOLUME: {
    TAGNAME: 'Docker Volumes',
    CONTROLLER: 'docker/volumes',
    LIST: '',
    CREATE: '',
    DETAIL: ':name',
    REMOVE: ':name',
  },
};
