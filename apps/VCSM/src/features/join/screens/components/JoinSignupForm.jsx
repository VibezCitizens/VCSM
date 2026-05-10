import { useState } from "react";
import { InputField, CheckRow, LockedVportTypeRow } from "./JoinPrimitives";
import { s } from "./joinStyles";

function validateSignupForm({ name, username, email, password, confirmPassword, vportName, ageConfirmed, termsAccepted }) {
  if (!name.trim()) return "Enter your name.";
  if (!username.trim()) return "Enter a username.";
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) return "Username: 3–30 chars, letters/numbers/underscore only.";
  if (!email.trim()) return "Enter your email.";
  if (!password) return "Enter a password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirmPassword) return "Passwords don't match.";
  if (!vportName.trim()) return "Enter your Barber VPORT name.";
  if (!ageConfirmed) return "You must confirm you are 18 or older.";
  if (!termsAccepted) return "You must accept the terms.";
  return null;
}

export function JoinSignupForm({ working, onSubmit, onSwitchToLogin, formError, setFormError }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [vportName, setVportName] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const err = validateSignupForm({ name, username, email, password, confirmPassword, vportName, ageConfirmed, termsAccepted });
    if (err) { setFormError(err); return; }
    onSubmit({ name: name.trim(), username: username.trim(), email: email.trim(), password, vportName: vportName.trim() });
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <InputField label="Your name" value={name} onChange={setName} placeholder="e.g. Marcus B." autoComplete="name" />
      <InputField label="Username" value={username} onChange={setUsername} placeholder="@handle" autoComplete="username" />
      <InputField label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" autoComplete="email" />
      <InputField label="Password" value={password} onChange={setPassword} type="password" placeholder="8+ characters" autoComplete="new-password" />
      <InputField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Same password" autoComplete="new-password" />

      <div style={s.divider} />

      <LockedVportTypeRow />
      <InputField label="Barber VPORT name" value={vportName} onChange={setVportName} placeholder="e.g. Marcus Cuts" />

      <div style={s.divider} />

      <CheckRow checked={ageConfirmed} onChange={setAgeConfirmed} label="I am 18 years of age or older." />
      <CheckRow checked={termsAccepted} onChange={setTermsAccepted}>
        I agree to the{" "}
        <a href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer" style={s.link}>Terms of Service</a>{" "}
        and{" "}
        <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={s.link}>Privacy Policy</a>.
      </CheckRow>

      {formError && <p style={s.errorText}>{formError}</p>}

      <button type="submit" disabled={working} style={{ ...s.btn, ...(working ? s.btnDisabled : {}) }}>
        {working ? "Creating account…" : "Create account"}
      </button>

      <button type="button" onClick={onSwitchToLogin} style={s.ghostBtn}>
        Already have an account? Sign in
      </button>
    </form>
  );
}
