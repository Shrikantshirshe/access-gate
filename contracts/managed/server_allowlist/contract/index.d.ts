import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  merkleProof(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array[]];
  merkleDirections(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, boolean[]];
}

export type ImpureCircuits<PS> = {
  updateRoot(context: __compactRuntime.CircuitContext<PS>,
             new_root_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimEntry(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  updateRoot(context: __compactRuntime.CircuitContext<PS>,
             new_root_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimEntry(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  hashNodes(left_0: Uint8Array, right_0: Uint8Array): Uint8Array;
  computeRootDepth3(leaf_0: Uint8Array,
                    proof_0: Uint8Array[],
                    directions_0: boolean[]): Uint8Array;
  publicKey(sk_0: Uint8Array): Uint8Array;
  computeNullifier(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  updateRoot(context: __compactRuntime.CircuitContext<PS>,
             new_root_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimEntry(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  hashNodes(context: __compactRuntime.CircuitContext<PS>,
            left_0: Uint8Array,
            right_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  computeRootDepth3(context: __compactRuntime.CircuitContext<PS>,
                    leaf_0: Uint8Array,
                    proof_0: Uint8Array[],
                    directions_0: boolean[]): __compactRuntime.CircuitResults<PS, Uint8Array>;
  publicKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  computeNullifier(context: __compactRuntime.CircuitContext<PS>,
                   sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly server_root: Uint8Array;
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly members_joined: bigint;
  readonly admin: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               root_0: Uint8Array,
               admin_pk_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
