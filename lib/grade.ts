export function calculateGrade(percent: number) {
  if (percent >= 90) return "A+"
  if (percent >= 80) return "A"
  if (percent >= 60) return "B"
  if (percent >= 40) return "C"
  return "F"
}