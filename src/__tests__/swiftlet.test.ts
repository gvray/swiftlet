import { createCompiler } from '../core';
import type { StatusPayload } from '../types';

describe('swiftlet core (new Options)', () => {
  test('applies user plugin via factories', () => {
    const calls: string[] = [];
    const factory = () => ({
      name: 'TestPlugin',
      apply(compiler: { hooks: any }) {
        compiler.hooks.run.tap('TestPlugin', () => calls.push('run'));
        compiler.hooks.status.tap('TestPlugin', (payload: StatusPayload) =>
          calls.push(`status:${payload.message}`)
        );
      },
    });
    const compiler = createCompiler({ entry: 'noop.js', plugins: [factory] });
    // 模拟生命周期
    compiler.hooks.run.call();
    compiler.hooks.status.call({ message: 'hello' });
    // 清理 spinner
    compiler.hooks.done.call();
    expect(calls).toEqual(['run', 'status:hello']);
  });

  test('dev flags propagate via options (watch & sourcemap)', () => {
    const compiler = createCompiler({ entry: 'noop.js', watch: true, sourcemap: true });
    expect((compiler as any).inputOptions.watch).toBe(true);
    expect((compiler as any).inputOptions.sourcemap).toBe(true);
    // 清理 spinner
    compiler.hooks.done.call();
  });
});
