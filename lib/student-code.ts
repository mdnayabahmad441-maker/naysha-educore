const SIMPLE_STUDENT_CODE = /^ST(\d{1,6})$/i

export function generateTimestampStudentCode(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  const millis = String(date.getMilliseconds()).padStart(3, "0")

  return `ST${year}${month}${day}${hours}${minutes}${seconds}${millis}`
}

export function generateCompactStudentCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
  let suffix = ""

  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return `ST${suffix}`
}

export function getNextStudentCode(existingCodes: Array<string | null | undefined>) {
  const used = new Set<number>()

  for (const code of existingCodes) {
    const match = String(code || "").trim().match(SIMPLE_STUDENT_CODE)
    if (!match) continue

    const number = Number(match[1])
    if (Number.isInteger(number) && number > 0) {
      used.add(number)
    }
  }

  let next = 1
  while (used.has(next)) {
    next += 1
  }

  return `ST${String(next).padStart(2, "0")}`
}

export function getNextClassRollNumber(existingRolls: Array<number | string | null | undefined>) {
  const used = new Set<number>()

  for (const roll of existingRolls) {
    const number = Number(roll)
    if (Number.isInteger(number) && number > 0) {
      used.add(number)
    }
  }

  let next = 1
  while (used.has(next)) {
    next += 1
  }

  return next
}
