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
 * Older versions had one Morningstar source per country, like "morningstar-es".
 * They all map to the same global source now.
 */
const LEGACY_MORNINGSTAR_SOURCE = /^morningstar-(au|es|de|ie|fr|za|at|be|dk|fi|gb|uk|ch|is|it|pt|no|nl)$/;

/**
 * Returns the source named by the `source` argument, with its canonical name.
 * Blank means the default source.
 */
export function resolveSource(name: unknown): { name: string; load: Source } {
  let key = String(name ?? '')
    .trim()
    .toLowerCase();

  if (key === '' || LEGACY_MORNINGSTAR_SOURCE.test(key)) {
    key = DEFAULT_SOURCE;
  }

  const load = SOURCES.get(key);
  if (!load) {
    throw new MuFundsError('UNKNOWN_SOURCE');
  }
  return { name: key, load };
}
