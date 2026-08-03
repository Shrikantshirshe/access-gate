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
Network: Midnight Preview
Contract: server_allowlist
Address: 17c68923ae0d7d275b107cd52d4481ce2cb2be0c19306127d22319dce01490ad
Deployment transaction: 00790ed64f198512be053dbd07552a1de1f6b70cd34c56ba9ae1ab6ea380f0e517
Gate deployer: mn_addr_preview1hprtcdx066s54d7r0529nmvk8sqjun68n8y2wptmhh3sxry927zs6afnmk
Deployment time: 2026-08-03T19:06:23.002Z
Verification: Confirmed by the Midnight Preview indexer
```

## Work locally

Community-gate testing uses tNight from the [Midnight Preview faucet](https://faucet.preview.midnight.network/).

```bash
npm install
npm run compile
npm test
npm run build
npm run dev
npm run deploy
```

The deploy command assumes an intentionally configured Preview wallet. Keep membership fixtures synthetic and keep wallet recovery material out of every file and log.

## Automation contract

Frontend CI owns browser build validation. Contract CI owns Compact setup, compilation, tests, and generated artifacts. Release CI packages tagged builds; scheduled dependency audit is isolated from deployment credentials.

Demo: [watch the community access walkthrough](https://drive.google.com/file/d/109VfDLFmNeRN2wsmMAMUcuNLfkA4Inv4/view?usp=sharing).

## Verification

Privacy is the product feature: the member list and inclusion path remain private, while root rotation and aggregate access state are auditable. Run `npm test`, `npm run compile`, and `npm run build`; the five contract scenarios are documented in [TESTING.md](./TESTING.md), the product scope is in [PROPOSAL.md](./PROPOSAL.md), and both CI workflows run on every push and pull request.
