# Product Proposal: Community Access Gate

## Problem

Communities need membership checks without publishing usernames, member lists, or inclusion paths.

## Proposed product

Community Access Gate commits a server root and lets a member claim entry with a private Merkle proof exactly once.

## Privacy model

The current root, aggregate joins, and nullifier activity are auditable. Member handle, address, and Merkle witness remain private.

## User journey

1. Moderator publishes or rotates the server root.
2. Member connects a Preprod wallet.
3. Member submits an inclusion proof.
4. Contract issues one private entry claim.

## Success criteria

- Root rotation is administrator-only.
- Valid membership paths pass.
- Invalid paths fail.
- Duplicate entry claims are rejected.

