export function safeClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      // structuredClone not available, falling back to JSON
    }
  }
  return JSON.parse(JSON.stringify(obj));
}
