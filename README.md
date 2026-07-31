# Community Access Gate

![Frontend CI](https://github.com/Shrikantshirshe/community-access-gate-midnight/actions/workflows/frontend-ci.yml/badge.svg?branch=main) ![Contract CI](https://github.com/Shrikantshirshe/community-access-gate-midnight/actions/workflows/contract-ci.yml/badge.svg?branch=main)

A moderator checkpoint that proves community membership without publishing a member handle or raw membership path.

## Moderation workflow

Community operators can rotate the server root, members can present a private inclusion proof, and the contract can prevent repeat entry claims. The violet-and-teal dashboard emphasizes root freshness, access state, wallet readiness, contract identity, and confirmed activity for moderators.

## Contract internals

The `server_allowlist` Compact contract supports:

- `updateRoot(new_root)` for root rotation.
- `claimEntry()` for a private access claim.
- `computeRootDepth3(leaf, proof, directions)` for Merkle verification.
- `computeNullifier(sk)` for one-time entry protection.

The public ledger exposes the server root, aggregate joins, nullifiers, and administrator key. Handles, member addresses, and private paths are not displayed as public state.

## Deployment reference

```text
Network: Midnight Preprod
Contract: server_allowlist
Address: 67466516d32ae3c1166c6581e98e7a04a063ec589663ea3ad504f450d24f6114
Deployment transaction: 352a9f1204c201db51c0a827c3760af1999919e827c6a1e2c355b4fe36c12131
Verification: Confirmed by the Midnight Preprod indexer
```

## Work locally

```bash
npm install
npm run compile
npm test
npm run build
npm run dev
npm run deploy
```

The deploy command assumes an intentionally configured Preprod wallet. Keep membership fixtures synthetic and keep wallet recovery material out of every file and log.

## Automation contract

Frontend CI owns browser build validation. Contract CI owns Compact setup, compilation, tests, and generated artifacts. Release CI packages tagged builds; scheduled dependency audit is isolated from deployment credentials.

Demo: [watch the community access walkthrough](https://drive.google.com/file/d/109VfDLFmNeRN2wsmMAMUcuNLfkA4Inv4/view?usp=sharing).

## Verification

Privacy is the product feature: the member list and inclusion path remain private, while root rotation and aggregate access state are auditable. Run `npm test`, `npm run compile`, and `npm run build`; the five contract scenarios are documented in [TESTING.md](./TESTING.md), the product scope is in [PROPOSAL.md](./PROPOSAL.md), and both CI workflows run on every push and pull request.
