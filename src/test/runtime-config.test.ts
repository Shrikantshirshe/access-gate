import { describe, expect, it } from 'vitest';
import { verifyAccessGateDeployment, validateAccessGateDeploymentRuntime } from '../runtimeConfig';

const deployment = {
  contractName: 'server_allowlist',
  contractAddress: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  network: 'preview',
  transactionHash: '000000000000000000000000000000000000000000000000000000000000000000',
  deployedAt: '2026-08-03T18:00:00.000Z',
};

describe('Access Gate production configuration', () => {
  it('accepts matching Preview deployment evidence', () => {
    expect(verifyAccessGateDeployment(deployment).contractName).toBe('server_allowlist');
  });

  it('rejects evidence copied from another project', () => {
    expect(() => verifyAccessGateDeployment({ ...deployment, contractName: 'foreign_contract' })).toThrow(/different contract/);
  });

  it('rejects malformed contract and transaction identifiers', () => {
    expect(() => verifyAccessGateDeployment({ ...deployment, contractAddress: 'preview1bad' })).toThrow(/32-byte/);
    expect(() => verifyAccessGateDeployment({ ...deployment, transactionHash: 'pending' })).toThrow(/transaction evidence/);
  });

  it('prevents demo mode and network drift in production', () => {
    expect(() => validateAccessGateDeploymentRuntime({ networkId: 'preprod' })).toThrow(/Preview/);
    expect(() => validateAccessGateDeploymentRuntime({ production: true, demoMode: 'true' })).toThrow(/forbidden/);
  });
});

