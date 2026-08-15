export async function loadHeavy() {
  const { heavy } = await import('./heavy.js');
  return heavy();
}
