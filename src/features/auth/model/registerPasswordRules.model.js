const PASSWORD_RULES = Object.freeze([
  {
    key: 'minLength',
    label: 'Minimum 8 characters',
    test: (value) => value.length >= 8,
  },
  {
    key: 'lowercase',
    label: 'At least 1 lowercase letter',
    test: (value) => /[a-z]/.test(value),
  },
  {
    key: 'uppercase',
    label: 'At least 1 uppercase letter',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: 'number',
    label: 'At least 1 number',
    test: (value) => /[0-9]/.test(value),
  },
])

function toSafeString(value) {
  return typeof value === 'string' ? value : ''
}

export function evaluateRegisterPasswordRules(password) {
  const safePassword = toSafeString(password)
  const rules = PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    valid: Boolean(rule.test(safePassword)),
  }))

  return {
    password: safePassword,
    rules,
    allValid: rules.every((rule) => rule.valid),
  }
}

export function evaluateConfirmPasswordState({ password, confirmPassword }) {
  const safePassword = toSafeString(password)
  const safeConfirmPassword = toSafeString(confirmPassword)

  if (!safeConfirmPassword) {
    return {
      state: 'idle',
      message: '',
      matches: false,
    }
  }

  const matches = safePassword === safeConfirmPassword

  return {
    state: matches ? 'match' : 'mismatch',
    message: matches ? 'Passwords match' : 'Passwords do not match',
    matches,
  }
}

