import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useJoinBarbershop, VIEWS } from "@/features/join/hooks/useJoinBarbershop";
import { Page, Spinner, InputField, LockedVportTypeRow } from "./components/JoinPrimitives";
import { JoinSignupForm } from "./components/JoinSignupForm";
import { JoinLoginForm } from "./components/JoinLoginForm";
import { s } from "./components/joinStyles";

export default function JoinBarbershopScreen() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");

  const {
    view,
    barbershopName,
    barberVport,
    existingVport,
    working,
    error,
    setView,
    setError,
    acceptQr,
    createVportAndAcceptQr,
    signup,
    login,
    createVportInvite,
    acceptWithExisting,
  } = useJoinBarbershop(token);

  const [vportNameInput, setVportNameInput] = useState("");
  const [loginMode, setLoginMode] = useState(false);

  const shopLabel = barbershopName ? `"${barbershopName}"` : "this barbershop";

  function handleSignup(formData) {
    setFormError(""); setError(""); signup(formData);
  }

  function handleLogin(formData) {
    setFormError(""); setError(""); login(formData);
  }

  function handleCreateVportInvite(e) {
    e.preventDefault();
    setError("");
    if (!vportNameInput.trim()) { setError("Enter a name for your Barber VPORT."); return; }
    createVportInvite(vportNameInput.trim());
  }

  function handleCreateVportQr(e) {
    e.preventDefault();
    setError("");
    if (!vportNameInput.trim()) { setError("Enter a name for your Barber VPORT."); return; }
    createVportAndAcceptQr(vportNameInput.trim());
  }

  if (view === VIEWS.LOADING || view === VIEWS.RESUMING) {
    return (
      <Page>
        <Spinner />
        <p style={s.hint}>{view === VIEWS.RESUMING ? "Setting up your Barber VPORT…" : "Loading…"}</p>
      </Page>
    );
  }

  if (view === VIEWS.ERROR) {
    return (
      <Page>
        <div style={s.icon}>✂️</div>
        <p style={s.errorText}>{error || "This invite is no longer valid."}</p>
        <button style={s.btn} onClick={() => navigate("/")}>Go home</button>
      </Page>
    );
  }

  if (view === VIEWS.QR_LOGIN) {
    return (
      <Page>
        <div style={s.icon}>✂️</div>
        <h1 style={s.title}>Join {shopLabel}</h1>
        <p style={s.bodyText}>Sign in to accept this invite using your Barber VPORT.</p>
        {loginMode ? (
          <JoinLoginForm
            working={working}
            onSubmit={handleLogin}
            onSwitchToSignup={() => { setLoginMode(false); setFormError(""); setError(""); }}
            formError={formError || error}
            setFormError={setFormError}
          />
        ) : (
          <div style={s.form}>
            {error && <p style={s.errorText}>{error}</p>}
            <button style={s.btn} onClick={() => setLoginMode(true)}>Sign in</button>
            <button style={s.ghostBtn} onClick={() => navigate(`/register?return_to=${encodeURIComponent(window.location.pathname)}`)}>
              Create an account
            </button>
          </div>
        )}
      </Page>
    );
  }

  if (view === VIEWS.QR_CONFIRM) {
    return (
      <Page>
        <div style={s.icon}>✂️</div>
        <h1 style={s.title}>Join this barbershop?</h1>
        <p style={s.bodyText}>
          You'll join {shopLabel} using your Barber VPORT{" "}
          {barberVport?.name ? <strong style={{ color: "#fff" }}>{barberVport.name}</strong> : ""}.
        </p>
        {error && <p style={s.errorText}>{error}</p>}
        <button style={{ ...s.btn, ...(working ? s.btnDisabled : {}) }} disabled={working} onClick={acceptQr}>
          {working ? "Joining…" : "Join barbershop"}
        </button>
        <button style={s.ghostBtn} onClick={() => { setView(VIEWS.QR_CREATE_VPORT); setError(""); }}>
          Use a different Barber VPORT
        </button>
      </Page>
    );
  }

  if (view === VIEWS.QR_CREATE_VPORT) {
    return (
      <Page>
        <div style={s.icon}>✂️</div>
        <h1 style={s.title}>Create your Barber VPORT</h1>
        <p style={s.bodyText}>Create your Barber VPORT to join {shopLabel}.</p>
        <form onSubmit={handleCreateVportQr} style={s.form}>
          <LockedVportTypeRow />
          <InputField label="VPORT name" value={vportNameInput} onChange={setVportNameInput} placeholder="e.g. Marcus Cuts" />
          {error && <p style={s.errorText}>{error}</p>}
          <button type="submit" disabled={working} style={{ ...s.btn, ...(working ? s.btnDisabled : {}) }}>
            {working ? "Creating…" : "Create & join"}
          </button>
        </form>
      </Page>
    );
  }

  if (view === VIEWS.CHECK_EMAIL) {
    return (
      <Page>
        <div style={s.icon}>📬</div>
        <h1 style={s.title}>Check your email</h1>
        <p style={s.bodyText}>Verify your account, then come back to finish joining the barbershop.</p>
        <p style={s.hint}>The link in the email will bring you back here automatically.</p>
      </Page>
    );
  }

  if (view === VIEWS.ACCEPTED) {
    return (
      <Page>
        <div style={s.icon}>✅</div>
        <h1 style={s.title}>You're on the team</h1>
        <p style={s.bodyText}>Your Barber VPORT has been added to {shopLabel}.</p>
        <button style={s.btn} onClick={() => navigate("/")}>Go to app</button>
      </Page>
    );
  }

  if (view === VIEWS.USE_EXISTING) {
    return (
      <Page>
        <div style={s.icon}>✂️</div>
        <h1 style={s.title}>Join this barbershop</h1>
        <p style={s.bodyText}>
          Accept using your existing Barber VPORT:{" "}
          <strong style={{ color: "#fff" }}>{existingVport?.name}</strong>
        </p>
        {error && <p style={s.errorText}>{error}</p>}
        <button style={{ ...s.btn, ...(working ? s.btnDisabled : {}) }} disabled={working} onClick={acceptWithExisting}>
          {working ? "Accepting…" : "Accept invite"}
        </button>
        <button style={s.ghostBtn} onClick={() => { setView(VIEWS.CREATE_VPORT); setError(""); }}>
          Use a different VPORT
        </button>
      </Page>
    );
  }

  if (view === VIEWS.CREATE_VPORT) {
    return (
      <Page>
        <div style={s.icon}>✂️</div>
        <h1 style={s.title}>Create your Barber VPORT</h1>
        <p style={s.bodyText}>This will be your barber identity on the platform.</p>
        <form onSubmit={handleCreateVportInvite} style={s.form}>
          <LockedVportTypeRow />
          <InputField label="VPORT name" value={vportNameInput} onChange={setVportNameInput} placeholder="e.g. Marcus Cuts" />
          {error && <p style={s.errorText}>{error}</p>}
          <button type="submit" disabled={working} style={{ ...s.btn, ...(working ? s.btnDisabled : {}) }}>
            {working ? "Creating…" : "Create & accept invite"}
          </button>
        </form>
      </Page>
    );
  }

  return (
    <Page>
      <div style={s.icon}>✂️</div>
      <h1 style={s.title}>Join this barbershop</h1>
      <p style={s.bodyText}>
        {loginMode
          ? "Sign in to accept this invite."
          : "Create your account and Barber VPORT to accept the invite."}
      </p>
      {loginMode ? (
        <JoinLoginForm
          working={working}
          onSubmit={handleLogin}
          onSwitchToSignup={() => { setLoginMode(false); setFormError(""); setError(""); }}
          formError={formError}
          setFormError={setFormError}
        />
      ) : (
        <JoinSignupForm
          working={working}
          onSubmit={handleSignup}
          onSwitchToLogin={() => { setLoginMode(true); setFormError(""); setError(""); }}
          formError={formError || error}
          setFormError={setFormError}
        />
      )}
    </Page>
  );
}
