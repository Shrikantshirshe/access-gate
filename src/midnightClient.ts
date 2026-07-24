import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { createProofProvider } from '@midnight-ntwrk/midnight-js-types';
import { fromHex, parseCoinPublicKeyToHex, parseEncPublicKeyToHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import * as contractModule from '../contracts/managed/server_allowlist/contract/index.js';

type ConnectedWallet = {
  getShieldedAddresses(): Promise<{ shieldedAddress: string; shieldedCoinPublicKey: string; shieldedEncryptionPublicKey: string }>;
  getConfiguration(): Promise<{ indexerUri: string; indexerWsUri: string }>;
  getProvingProvider(provider: any): Promise<any>;
  balanceUnsealedTransaction(tx: string): Promise<{ tx: string }>;
  submitTransaction(tx: string): Promise<void>;
};
 
function shrikantZkConfigProvider(baseURL: string) {
  const circuitName = (id: string) => id.split('#').pop() ?? id;
  const read = async (folder: string, id: string, extension: string) => {
    const response = await fetch(baseURL + '/' + folder + '/' + circuitName(id) + extension);
    if (!response.ok) throw new Error('Unable to load Midnight proving asset: ' + response.status + ' ' + response.statusText);
    return new Uint8Array(await response.arrayBuffer());
  };
  return {
    getProverKey: (id: string) => read('keys', id, '.prover'),
    getVerifierKey: (id: string) => read('keys', id, '.verifier'),
    getZKIR: (id: string) => read('zkir', id, '.bzkir'),
    getVerifierKeys: (ids: string[]) => Promise.all(ids.map(async id => [id, await read('keys', id, '.verifier')])),
    get: async (id: string) => ({ circuitId: id, proverKey: await read('keys', id, '.prover'), verifierKey: await read('keys', id, '.verifier'), zkir: await read('zkir', id, '.bzkir') }),
  } as any;
}

const shrikantPrivateState = new Map<string, unknown>();
const shrikantSigningKeys = new Map<string, unknown>();
let shrikantContractAddress = '';

function shrikantPrivateStateProvider() {
  return {
    setContractAddress(address: string) { shrikantContractAddress = address; },
    async set(id: string, value: unknown) { shrikantPrivateState.set(shrikantContractAddress + ':' + id, value); },
    async get(id: string) { return shrikantPrivateState.get(shrikantContractAddress + ':' + id) ?? null; },
    async remove(id: string) { shrikantPrivateState.delete(shrikantContractAddress + ':' + id); },
    async clear() { for (const key of shrikantPrivateState.keys()) if (key.startsWith(shrikantContractAddress + ':')) shrikantPrivateState.delete(key); },
    async setSigningKey(address: string, key: unknown) { shrikantSigningKeys.set(address, key); },
    async getSigningKey(address: string) { return shrikantSigningKeys.get(address) ?? null; },
    async removeSigningKey(address: string) { shrikantSigningKeys.delete(address); },
    async clearSigningKeys() { shrikantSigningKeys.clear(); },
  };
}

async function shrikantBrowserProviders(wallet: ConnectedWallet) {
  const [addresses, configuration] = await Promise.all([wallet.getShieldedAddresses(), wallet.getConfiguration()]);
  const zkConfigProvider = shrikantZkConfigProvider(location.origin + '/midnight/server_allowlist');
  const provingProvider = await wallet.getProvingProvider(zkConfigProvider);
  const providers = {
    privateStateProvider: shrikantPrivateStateProvider(),
    publicDataProvider: indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri),
    zkConfigProvider,
    proofProvider: createProofProvider(provingProvider),
    walletProvider: {
      getCoinPublicKey: () => parseCoinPublicKeyToHex(addresses.shieldedCoinPublicKey, 'preprod'),
      getEncryptionPublicKey: () => parseEncPublicKeyToHex(addresses.shieldedEncryptionPublicKey, 'preprod'),
      async balanceTx(tx: ledger.Transaction<any, any, any>) {
        const balanced = await wallet.balanceUnsealedTransaction(toHex(tx.serialize()));
        return ledger.Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
      },
    },
    midnightProvider: {
      async submitTx(tx: ledger.Transaction<any, any, any>) {
        await wallet.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  } as any;
  return { providers, addresses };
}

function shrikantBrowserWitnesses() {
  return {
    localSecretKey: (context: any) => [context?.privateState ?? {}, new Uint8Array(32)],
    merkleProof: (context: any) => [context?.privateState ?? {}, []],
    merkleDirections: (context: any) => [context?.privateState ?? {}, []],
  } as any;
}

export async function deployServerallowlistContract(wallet: ConnectedWallet) {
  const { providers, addresses } = await shrikantBrowserProviders(wallet);
  const compiledContract = CompiledContract.make('server_allowlist', contractModule.Contract).pipe(CompiledContract.withWitnesses(shrikantBrowserWitnesses()));
  const adminPubkey = fromHex(parseCoinPublicKeyToHex(addresses.shieldedCoinPublicKey, 'preprod'));
  const deployed = await deployContract(providers, {
    compiledContract: compiledContract as any,
    privateStateId: 'serverAllowlistState',
    initialPrivateState: {},
    args: [new Uint8Array(32), adminPubkey],
  });
  return { contractAddress: deployed.deployTxData.public.contractAddress, txId: deployed.deployTxData.public.txId };
}

export async function submitServerallowlistCircuit(
  wallet: ConnectedWallet,
  contractAddress: string,
  circuitId: string,
  args: unknown[] = [],
) {
  if (!contractAddress) throw new Error('Set VITE_CONTRACT_ADDRESS before submitting a contract call.');
  const [addresses, configuration] = await Promise.all([wallet.getShieldedAddresses(), wallet.getConfiguration()]);
  const zkConfigProvider = shrikantZkConfigProvider(location.origin + '/midnight/server_allowlist');
  const provingProvider = await wallet.getProvingProvider(zkConfigProvider);
  const providers = {
    publicDataProvider: indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri),
    zkConfigProvider,
    proofProvider: createProofProvider(provingProvider),
    walletProvider: {
      getCoinPublicKey: () => addresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => addresses.shieldedEncryptionPublicKey,
      async balanceTx(tx: ledger.Transaction<any, any, any>) {
        const balanced = await wallet.balanceUnsealedTransaction(toHex(tx.serialize()));
        return ledger.Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
      },
    },
    midnightProvider: {
      async submitTx(tx: ledger.Transaction<any, any, any>) {
        await wallet.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  } as any;
  const compiledContract = CompiledContract.make('server_allowlist', contractModule.Contract).pipe(CompiledContract.withWitnesses(shrikantBrowserWitnesses()));
  const deployed = await findDeployedContract(providers, { compiledContract: compiledContract as any, contractAddress });
  const call = (deployed.callTx as Record<string, (...callArgs: unknown[]) => Promise<any>>)[circuitId];
  if (!call) throw new Error(`Circuit “${circuitId}” is not available in the deployed server_allowlist contract.`);
  const result = await call(...args);
  return result.public;
}
import { Buffer } from 'buffer';

if (typeof globalThis !== 'undefined' && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

setNetworkId(import.meta.env.VITE_NETWORK_ID || 'preprod');
