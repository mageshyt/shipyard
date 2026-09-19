import { BadRequestException } from '@nestjs/common';

/**
 * Lowercase, hyphenate and strip to `[a-z0-9-]`.
 * `subject` is used in the error so the caller gets "Project name..." not "Name...".
 */
export function generateSlug(name: string, subject = 'Name'): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // names like "!!!" clean down to nothing and would false-collide
  if (!slug) {
    throw new BadRequestException(
      `${subject} must contain at least one letter or number`,
    );
  }

  return slug;
}
