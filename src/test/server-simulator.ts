import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../../contracts/managed/server_allowlist/contract/index.js";
import { type ServerPrivateState, witnesses } from "../witnesses.js";

export class ServerSimulator {
  readonly contract: Contract<ServerPrivateState>;
  circuitContext: CircuitContext<ServerPrivateState>;

  constructor(secretKey: Uint8Array, merkleProof: Uint8Array[], merkleDirections: boolean[], root: Uint8Array, adminPk: Uint8Array) {
    this.contract = new Contract<ServerPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext({ secretKey, merkleProof, merkleDirections }, "0".repeat(64)),
      root,
      adminPk
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public switchUser(secretKey: Uint8Array, merkleProof: Uint8Array[], merkleDirections: boolean[]) {
    this.circuitContext.currentPrivateState = {
      secretKey,
      merkleProof,
      merkleDirections
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): ServerPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public updateRoot(newRoot: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.updateRoot(
      this.circuitContext,
      newRoot,
    ).context;
    return this.getLedger();
  }

  public claimEntry(): Ledger {
    this.circuitContext = this.contract.impureCircuits.claimEntry(
      this.circuitContext,
    ).context;
    return this.getLedger();
  }

  public publicKey(sk: Uint8Array): Uint8Array {
    return this.contract.circuits.publicKey(
      this.circuitContext,
      sk,
    ).result;
  }

  public hashNodes(left: Uint8Array, right: Uint8Array): Uint8Array {
    return this.contract.circuits.hashNodes(
      this.circuitContext,
      left,
      right
    ).result;
  }
}
