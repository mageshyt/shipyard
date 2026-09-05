import { plainToInstance, type ClassConstructor } from 'class-transformer';

export function toDto<T>(cls: ClassConstructor<T>, plain: unknown[]): T[];
export function toDto<T>(cls: ClassConstructor<T>, plain: unknown): T;
export function toDto<T>(cls: ClassConstructor<T>, plain: unknown) {
  return plainToInstance(cls, plain, { excludeExtraneousValues: true });
}
