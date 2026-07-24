import { Ledger } from "../contracts/managed/server_allowlist/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type ServerPrivateState = {
  readonly secretKey: Uint8Array;
  readonly merkleProof: Uint8Array[];
  readonly merkleDirections: boolean[];
};

export const createServerPrivateState = (secretKey: Uint8Array, merkleProof: Uint8Array[], merkleDirections: boolean[]) => ({
  secretKey,
  merkleProof,
  merkleDirections
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, ServerPrivateState>): [
    ServerPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],

  merkleProof: ({
    privateState,
  }: WitnessContext<Ledger, ServerPrivateState>): [
    ServerPrivateState,
    Uint8Array[],
  ] => [privateState, privateState.merkleProof],

  merkleDirections: ({
    privateState,
  }: WitnessContext<Ledger, ServerPrivateState>): [
    ServerPrivateState,
    boolean[],
  ] => [privateState, privateState.merkleDirections],
};
