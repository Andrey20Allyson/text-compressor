export function digits(value: number, base: number = 10) {
  return Math.floor(Math.log(value) / Math.log(base) + 1.000000001);
}