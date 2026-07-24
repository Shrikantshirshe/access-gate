# Project Idea: Private Allowlist Access (Community Server Entry Gate)

A token-gating system that verifies a user owns a required NFT or token, allowing them to access private community channels (e.g., Discord or Telegram) without linking their Discord/Telegram account username to their on-chain wallet address.

## 1. Midnight Network Specialty (ZK & Privacy Features)
*   **Privacy-First Verification:** Verifies asset ownership (membership proof) without disclosing which wallet address owns the asset, protecting the user from public linkage.
*   **Off-chain Signatures:** The user signs a challenge (containing their social handle) off-chain. The ZK circuit proves ownership of the private key associated with the token-holding wallet address without revealing the key or the address itself on-chain.
*   **One-Time Verification Codes:** Generates verification proofs that map a membership hash to a unique login token.

## 2. Technical Architecture (Compact Contract)
*   **Public State:**
    *   `token_holders_root`: Merkle root of wallet addresses owning the gating NFT.
    *   `nullifiers`: Log of verification nullifiers to prevent duplicate social handle mappings.
*   **Private State:**
    *   `holder_private_key`: Private key associated with the token-holding address.
    *   `merkle_proof`: Merkle membership path to `token_holders_root`.
*   **Circuits (ZK Proofs):**
    *   `verify_holder_access(social_handle_hash, merkle_proof, holder_private_key)`:
        1. Checks that the public key derived from `holder_private_key` lies within the `token_holders_root` via the `merkle_proof`.
        2. Computes the `nullifier = hash(holder_private_key, social_handle_hash)`.
        3. Asserts that the `nullifier` is not in the public `nullifiers` list.
        *Output:* Emits the nullifier and allows access, confirming ownership without disclosing the holder's wallet address.

## 3. Frontend & Integration (Level 3 Focus)
*   **User Interface:** An OAuth entry portal. The user logs in with Discord, receives their Discord handle, connects their Lace wallet, compiles the ZK membership proof in the browser, and submits it to receive access.
*   **Lace/Midnight Wallet Integration:**
    *   Retrieves the wallet key for Merkle tree validation.
    *   Generates proof payloads locally.

## 4. Verification & Testing Plan
*   **Unit Tests:**
    *   Assert that a valid token holder can generate an access proof and join.
    *   Assert that a user who does not own the gating NFT fails the Merkle proof checks.
    *   Assert that the user's wallet address is not exposed in transaction inputs.

---

## 5. How to Build & Deploy on Midnight
To build this project without errors, refer to the master build guide located at the root of the workspace: [BUILD_GUIDE.md](file:///Users/neelsubhashpote/moonlight/BUILD_GUIDE.md). It details how to:
1. Fix language pragma version mismatches.
2. Resolve SDK `4.x` dependency issues.
3. Start the Docker-based local ZK proof server.
4. Deploy the contract using a custom `deploy.mjs` script.
5. Prevent DUST gas errors.
