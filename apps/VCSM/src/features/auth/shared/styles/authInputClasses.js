export function authInputClass(disabled) {
  return [
    'auth-register-input w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white',
    'placeholder:text-[#9ca3af] outline-none transition duration-200',
    'focus:border-[#6C4DF6]/80 focus:ring-2 focus:ring-[#6C4DF6]/40',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
    disabled ? 'cursor-not-allowed' : '',
  ].join(' ')
}

export function authSelectClass(disabled) {
  return `${authInputClass(disabled)} auth-register-select`
}
