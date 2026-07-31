# Verification checklist

The executable contract suite is `src/test/server.test.ts`.

```bash
npm test
npm run compile
npm run build
```

Five passing scenarios cover server-root initialization, root updates, a valid private entry claim, invalid-proof rejection, and duplicate-claim protection. The tests verify private community membership without publishing the member list.

CI runs the contract and frontend checks on every push and pull request.
