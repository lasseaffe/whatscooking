// src/lib/weave-solver/util.ts
let counter = 0;
export function newClientId(): string {
  counter += 1;
  return `weave-${counter.toString(36)}-${Date.now().toString(36)}`;
}
export function resetClientIdCounter() { counter = 0; }
