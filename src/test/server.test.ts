import { ServerSimulator } from "./server-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("Community Server Entry Gate Smart Contract Tests", () => {
  const adminSecret = randomBytes(32);
  const dummyRoot = randomBytes(32);

  // Setup helper to create a simulator
  const setupSimulator = (userSecret: Uint8Array, proof: Uint8Array[], directions: boolean[], root: Uint8Array) => {
    const tempSim = new ServerSimulator(adminSecret, [], [], dummyRoot, new Uint8Array(32));
    const adminPk = tempSim.publicKey(adminSecret);
    return new ServerSimulator(userSecret, proof, directions, root, adminPk);
  };

  // Helper to build Merkle root and proof dynamically
  const buildMerkleTree = (leaves: Uint8Array[], targetIndex: number, simulator: ServerSimulator) => {
    if (leaves.length !== 64) throw new Error('Expected 64 leaves');
    let level = [...leaves], index = targetIndex;
    const proof: Uint8Array[] = [], directions: boolean[] = [];
    while (level.length > 1) {
      proof.push(level[index ^ 1]); directions.push(index % 2 === 0);
      const parents: Uint8Array[] = [];
      for (let i = 0; i < level.length; i += 2) parents.push(simulator.hashNodes(level[i], level[i + 1]));
      level = parents; index = Math.floor(index / 2);
    }
    return { root: level[0], proof, directions };
  };

  it("1. Properly initializes contract parameters and server root", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret, [], [], dummyRoot);
    const ledgerState = simulator.getLedger();

    expect(ledgerState.server_root).toEqual(dummyRoot);
    expect(ledgerState.members_joined).toEqual(0n);
  });

  it("2. Lets admin update the allowlist root", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret, [], [], dummyRoot);
    const newRoot = randomBytes(32);

    simulator.switchUser(adminSecret, [], []);
    const ledgerState = simulator.updateRoot(newRoot);
    expect(ledgerState.server_root).toEqual(newRoot);
  });

  it("3. Allows a whitelisted member to claim a server entry spot", () => {
    const userSecret = randomBytes(32);
    const tempSim = setupSimulator(userSecret, [], [], dummyRoot);

    const userPk = tempSim.publicKey(userSecret);
    const mockLeaves = Array.from({ length: 64 }, () => randomBytes(32));
    mockLeaves[2] = userPk;

    // Build Merkle proof
    const { root, proof, directions } = buildMerkleTree(mockLeaves, 2, tempSim);

    // Initialize simulator with active root
    const simulator = setupSimulator(userSecret, proof, directions, root);
    
    const ledgerState = simulator.claimEntry();
    expect(ledgerState.members_joined).toEqual(1n);
  });

  it("4. Rejects claiming entry with an incorrect Merkle path", () => {
    const userSecret = randomBytes(32);
    const tempSim = setupSimulator(userSecret, [], [], dummyRoot);

    const userPk = tempSim.publicKey(userSecret);
    const mockLeaves = Array.from({ length: 64 }, () => randomBytes(32));
    mockLeaves[2] = userPk;

    const { root, proof, directions } = buildMerkleTree(mockLeaves, 2, tempSim);

    // Corrupt proof path
    const badProof = [...proof];
    badProof[0] = randomBytes(32);

    const simulator = setupSimulator(userSecret, badProof, directions, root);
    expect(() => simulator.claimEntry()).toThrow("failed assert: User is not in the server whitelist");
  });

  it("5. Rejects duplicate claims from the same whitelisted user", () => {
    const userSecret = randomBytes(32);
    const tempSim = setupSimulator(userSecret, [], [], dummyRoot);

    const userPk = tempSim.publicKey(userSecret);
    const mockLeaves = Array.from({ length: 64 }, () => randomBytes(32));
    mockLeaves[2] = userPk;

    const { root, proof, directions } = buildMerkleTree(mockLeaves, 2, tempSim);

    const simulator = setupSimulator(userSecret, proof, directions, root);
    simulator.claimEntry();

    // Try to claim again
    expect(() => simulator.claimEntry()).toThrow("failed assert: User has already joined the server");
  });
  it('accepts all 64 unique members without rotating the root', () => {
    const secrets = Array.from({ length: 64 }, () => randomBytes(32));
    const helper = setupSimulator(secrets[0], [], [], dummyRoot);
    const leaves = secrets.map(secret => helper.publicKey(secret));
    const first = buildMerkleTree(leaves, 0, helper);
    const simulator = setupSimulator(secrets[0], first.proof, first.directions, first.root);
    for (let index = 0; index < 64; index++) {
      const membership = buildMerkleTree(leaves, index, helper);
      simulator.switchUser(secrets[index], membership.proof, membership.directions);
      expect(simulator.claimEntry().members_joined).toBe(BigInt(index + 1));
    }
    expect(() => simulator.claimEntry()).toThrow();
  });
});
