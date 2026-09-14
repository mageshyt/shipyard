export const SHIPYARD_LABEL_PREFIX = 'shipyard';

export function shipyardLabel(name: string): string {
  return `${SHIPYARD_LABEL_PREFIX}.${name}`;
}
