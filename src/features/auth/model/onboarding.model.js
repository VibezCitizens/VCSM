const BIRTHDATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

export function mapProfileOnboardingRowToFormModel(row) {
  return {
    display_name: '',
    username_base: row?.username ?? '',
    birthdate: row?.birthdate ?? '',
    sex: '',
  }
}

export function isProfileShellIncompleteModel(row) {
  const displayName = String(row?.display_name ?? '').trim()
  const username = String(row?.username ?? '').trim()
  return displayName === '' || username === ''
}

export function normalizeOnboardingFormModel(form) {
  return {
    displayName: String(form?.display_name ?? '').trim(),
    usernameBase: String(form?.username_base ?? '').trim(),
    birthdate: String(form?.birthdate ?? '').trim(),
    sex: String(form?.sex ?? '').trim() || null,
  }
}

export function computeAgeFromBirthdateModel(isoDate, referenceDate = new Date()) {
  const parsed = parseIsoDate(isoDate)
  if (!parsed) return null

  const todayYear = referenceDate.getFullYear()
  const todayMonth = referenceDate.getMonth() + 1
  const todayDay = referenceDate.getDate()
  const isFutureBirthdate =
    todayYear < parsed.year ||
    (todayYear === parsed.year && todayMonth < parsed.month) ||
    (todayYear === parsed.year && todayMonth === parsed.month && todayDay < parsed.day)

  if (isFutureBirthdate) return null

  let age = todayYear - parsed.year
  const birthdayPassed =
    todayMonth > parsed.month ||
    (todayMonth === parsed.month && todayDay >= parsed.day)

  if (!birthdayPassed) age -= 1
  return age
}

function parseIsoDate(isoDate) {
  const raw = String(isoDate ?? '').trim()
  const match = BIRTHDATE_REGEX.exec(raw)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  const test = new Date(Date.UTC(year, month - 1, day))
  const isSameDate =
    test.getUTCFullYear() === year &&
    test.getUTCMonth() === month - 1 &&
    test.getUTCDate() === day

  if (!isSameDate) return null

  return { year, month, day }
}
