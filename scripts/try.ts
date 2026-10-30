// Calls every option for one asset against the real source and prints the results.
// Usage: npm run try -- <id> [source]
import { getAssetValue } from '../src/index.ts';
import { liveServices, OPTIONS } from '../test/live/live-services.ts';

const [id, source = ''] = process.argv.slice(2);
if (!id) {
  console.error('Usage: npm run try -- <id> [source]');
  process.exit(1);
}

const services = liveServices();
const rows: Record<string, string | number> = {};
for (const option of OPTIONS) {
  try {
    rows[option] = getAssetValue(option, id, source, services);
  } catch (error) {
    const code = (error as { code?: string }).code ?? 'ERROR';
    rows[option] = `✗ ${code}: ${(error as Error).message}`;
  }
}
console.table(rows);
