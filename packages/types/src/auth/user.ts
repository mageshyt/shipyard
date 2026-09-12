export interface User {
  id: string;
  name: string;
  email: string;
  /** ISO-8601 string over the wire (Prisma DateTime is serialized on the way out). */
  createdAt: string;
}

export interface CreateUser {
  name: string;
  email: string;
  password: string;
}

export interface Login {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
}
