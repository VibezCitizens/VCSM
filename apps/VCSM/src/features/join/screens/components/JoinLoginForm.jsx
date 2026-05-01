import { useState } from "react";
import { InputField } from "./JoinPrimitives";
import { s } from "./joinStyles";

export function JoinLoginForm({ working, onSubmit, onSwitchToSignup, formError, setFormError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!email.trim() || !password) { setFormError("Enter email and password."); return; }
    onSubmit({ email: email.trim(), password });
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <InputField label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" autoComplete="email" />
      <InputField label="Password" value={password} onChange={setPassword} type="password" placeholder="Password" autoComplete="current-password" />

      {formError && <p style={s.errorText}>{formError}</p>}

      <button type="submit" disabled={working} style={{ ...s.btn, ...(working ? s.btnDisabled : {}) }}>
        {working ? "Signing in…" : "Sign in"}
      </button>

      <button type="button" onClick={onSwitchToSignup} style={s.ghostBtn}>
        New here? Create an account
      </button>
    </form>
  );
}
