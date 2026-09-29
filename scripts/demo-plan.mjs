export const contractName = 'server_allowlist';
export const target = 50;
const bytes = value => Uint8Array.from(Buffer.from(value, 'hex'));
const padded = value => { const result = new Uint8Array(32); result.set(new TextEncoder().encode(value)); return result; };
export function makePlan(pure, data) {
  const admin = bytes(data.adminSecret);
  const adminPk = pure.publicKey(admin);
  const id = bytes(data.id);
  const actors = data.actors.map((actor, index) => ({ secretKey: bytes(actor.secret), salt: bytes(actor.salt), index }));
  const steps = [];
  const add = (kind, circuit, state, args, verify) => steps.push({kind, circuit, state, args, verify});
  const adminState = {secretKey: admin, merkleProof: Array.from({length:6},()=>new Uint8Array(32)), merkleDirections: Array(6).fill(false)};
  const layers = [actors.map(actor => pure.publicKey(actor.secretKey))];
  while (layers.at(-1).length > 1) {
    const layer = layers.at(-1), parent = [];
    for (let i=0; i<layer.length; i+=2) parent.push(pure.hashNodes(layer[i],layer[i+1]));
    layers.push(parent);
  }
  const root = layers.at(-1)[0];
  for (const actor of actors.slice(0,target)) {
    let index=actor.index; const merkleProof=[], merkleDirections=[];
    for (const layer of layers.slice(0,-1)) {merkleProof.push(layer[index^1]);merkleDirections.push(index%2===0);index=Math.floor(index/2);}
    const state={secretKey:actor.secretKey,merkleProof,merkleDirections};
    const nullifier=pure.computeNullifier(actor.secretKey);
    add('demo','claimEntry',state,[],live=>live.nullifiers.member(nullifier));
  }
  return {constructorArgs:[root,adminPk],adminState,steps};
}
export const witnessFields = ["localSecretKey","merkleProof","merkleDirections"];
