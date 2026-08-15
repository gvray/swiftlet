import { greeting } from './greeting';
import type { User } from './types';
export type { User } from './types';

export function main(user: User) {
  return greeting(user.name);
}

export { greeting };
