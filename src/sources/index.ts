import { MuFundsError } from '../errors.ts';
import type { Source } from '../types.ts';
import { loadFromMorningstar } from './morningstar.ts';
import { loadFromQuefondos } from './quefondos.ts';

export const DEFAULT_SOURCE = 'morningstar';

const SOURCES = new Map<string, Source>([
  ['morningstar', loadFromMorningstar],
  ['quefondos', loadFromQuefondos],
]);

/**
 * Returns the source named by the `source` argument, with its canonical name.
 * Blank means the default source.
 */
export function resolveSource(name: unknown): { name: string; load: Source } {
  let key = String(name ?? '')
    .trim()
    .toLowerCase();

  // Older versions had one Morningstar source per country, like "morningstar-es",
  // and users write them in many ways ("Morningstar UK", "morningstar_lu").
  // They all mean the same global source now.
  if (key === '' || (!SOURCES.has(key) && key.startsWith('morningstar'))) {
    key = DEFAULT_SOURCE;
  }

  const load = SOURCES.get(key);
  if (!load) {
    throw new MuFundsError('UNKNOWN_SOURCE');
  }
  return { name: key, load };
}
