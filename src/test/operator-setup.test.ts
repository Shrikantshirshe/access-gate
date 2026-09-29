import { expect, it } from 'vitest';
import { hex32, prepareOperatorArgument } from '../OperatorSetup';
it('rejects malformed administrator credentials', () => {
  expect(()=>hex32('not a key')).toThrow(/64 hexadecimal/);
  expect(hex32('ab'.repeat(32))).toHaveLength(32);
});
it('prepares deterministic contract-compatible public arguments', () => {
  const value = '12'.repeat(32);
  const salt = '34'.repeat(32);
  expect(prepareOperatorArgument(value,salt)).toMatch(/^[0-9a-f]{64}$/);
  expect(prepareOperatorArgument(value,salt)).toBe(prepareOperatorArgument(value,salt));
});

