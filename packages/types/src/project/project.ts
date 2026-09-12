export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  slug: string | null;
  /** ISO-8601 string over the wire (Prisma DateTime is serialized on the way out). */
  createdAt: string;
  /** ISO-8601 string over the wire (Prisma DateTime is serialized on the way out). */
  updatedAt: string;
}

export interface CreateProject {
  name: string;
  description?: string;
}

export interface UpdateProject {
  name?: string;
  description?: string;
}
