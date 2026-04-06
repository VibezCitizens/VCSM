// RegisterScreen.jsx
import { useNavigate } from 'react-router-dom'

import RegisterFormCard from '@/features/auth/components/RegisterFormCard'
import { useRegister } from '@/features/auth/hooks/useRegister'
import '@/features/auth/styles/registerFormCard.css'

export default function RegisterScreen() {
  const navigate = useNavigate()
  const {
    form,
    loading,
    errorMessage,
    successMessage,
    navState,
    showPassword,
    showConfirmPassword,
    passwordValidation,
    confirmPasswordValidation,
    showPasswordRules,
    canSubmit,
    handleChange,
    handleSubmit,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = useRegister()

  return (
    <RegisterFormCard
      form={form}
      loading={loading}
      errorMessage={errorMessage}
      successMessage={successMessage}
      navState={navState}
      canSubmit={canSubmit}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      passwordRules={passwordValidation.rules}
      showPasswordRules={showPasswordRules}
      confirmPasswordState={confirmPasswordValidation}
      onInputChange={handleChange}
      onSubmit={handleSubmit}
      onBackClick={() => navigate(-1)}
      onTogglePassword={togglePasswordVisibility}
      onToggleConfirmPassword={toggleConfirmPasswordVisibility}
    />
  )
}
