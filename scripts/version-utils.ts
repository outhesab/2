export function resolveVersionCode(input: string | null | undefined): number {
  if (input === null || input === undefined || input === "") {
    return 1
  }
  const num = parseInt(input, 10)
  if (isNaN(num) || num <= 0) {
    return 1
  }
  return num
}
