import { spawnSync } from 'node:child_process';

const steps = [
  ['shared types', 'npm', ['run', 'typecheck', '-w', '@master-connect/shared']],
  ['api types', 'npm', ['run', 'typecheck', '-w', '@master-connect/api']],
  ['prisma schema', 'npm', ['run', 'prisma:validate', '-w', '@master-connect/api']],
  ['api build', 'npm', ['run', 'build', '-w', '@master-connect/api']],
  ['web types', 'npm', ['run', 'typecheck', '-w', '@master-connect/web']],
  ['web lint', 'npm', ['run', 'lint', '-w', '@master-connect/web']],
  ['admin types', 'npm', ['run', 'typecheck', '-w', '@master-connect/admin']],
  ['admin lint', 'npm', ['run', 'lint', '-w', '@master-connect/admin']],
  ['mobile types', 'npm', ['run', 'typecheck', '-w', 'master-connect']],
  ['mobile lint', 'npm', ['run', 'lint', '-w', 'master-connect']],
];

for (const [label, command, args] of steps) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync([command, ...args].join(' '), { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\nValidation failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\nValidation passed.');
