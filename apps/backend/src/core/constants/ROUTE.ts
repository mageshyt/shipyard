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
    LIST_IMAGES: 'images',
    LIST_VOLUMES: 'volumes',
    LIST_NETWORKS: 'networks',
  },

  DOCKER_CONTAINERS: {
    TAGNAME: 'Docker Containers',
    CONTROLLER: 'docker/containers',
    LIST: '',
    DETAIL: ':id',
    START: ':id/start',
    STOP: ':id/stop',
    RESTART: ':id/restart',
    KILL: ':id/kill',
    REMOVE: ':id/remove',
  },

  DOCKER_NETWORKS: {
    TAGNAME: 'Docker Networks',
    CONTROLLER: 'docker/networks',
    LIST: '',
    DETAIL: ':id',
    CREATE: '',
    REMOVE: ':id',
  },
};
