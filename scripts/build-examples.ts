import { execSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const examplesDir = resolve(__dirname, '../examples');
const dirs = readdirSync(examplesDir)
  .filter((name) => statSync(join(examplesDir, name)).isDirectory())
  .sort();

let failed = 0;

for (const dir of dirs) {
  const cwd = join(examplesDir, dir);
  console.log(`\n==> Building ${dir}...`);
  try {
    execSync('pnpm build', { cwd, stdio: 'inherit' });
  } catch (e) {
    console.error(`\n❌ Build failed: ${dir}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} example(s) failed.`);
  process.exit(1);
}

console.log('\n✅ All examples built successfully.');
