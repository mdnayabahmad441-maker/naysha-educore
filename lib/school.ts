let cachedSchoolId: string | null = null

export function setGlobalSchool(id: string) {
  cachedSchoolId = id
}

export function getSchoolId(): string | null {
  return cachedSchoolId
}