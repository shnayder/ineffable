export function getOrThrow<K, V>(
  map: Map<K, V>,
  key: K,
  errorMessage: string = `Key "${key}" not found in map`
): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(errorMessage);
  }
  return value;
}
