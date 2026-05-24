export function resolveVersionCode(input: string | null | undefined): number {
  if (input === null || input === undefined || input === "") {
    return 1
  }
  const num = Number(input)
  if (!Number.isInteger(num) || num <= 0) {
    return 1
  }
  return num
}
