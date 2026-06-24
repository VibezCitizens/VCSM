// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — claim submission form.
// Submits a PENDING claim via traffic.submit_business_claim. No ownership write.

import {
  ROLE_OPTIONS,
  CONTACT_METHODS,
} from '@/features/claim/model/claim.model'
import {
  claimInputClass,
  claimSelectClass,
  claimPrimaryButtonClass,
  claimLabelClass,
  claimFieldErrorClass,
} from '@/features/claim/components/claimStyles'

function Field({ id, label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={claimLabelClass}>
        {label}
      </label>
      {children}
      {error ? <p className={claimFieldErrorClass}>{error}</p> : null}
    </div>
  )
}

export default function ClaimForm({
  providerLabel,
  form,
  fieldErrors,
  submitError,
  submitting,
  setField,
  onSubmit,
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-white">
          Claim {providerLabel}
        </h1>
        <p className="text-sm text-[#9ca3af]">
          Tell us how you are connected to this business. A reviewer verifies
          every claim before it is approved.
        </p>
      </div>

      {submitError ? (
        <div
          className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]"
          role="alert"
          aria-live="polite"
        >
          {submitError}
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit()
        }}
        noValidate
      >
        <Field id="claim-owner-name" label="Your name" error={fieldErrors.ownerName}>
          <input
            id="claim-owner-name"
            className={claimInputClass(submitting)}
            value={form.ownerName}
            onChange={(e) => setField('ownerName', e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            disabled={submitting}
            required
          />
        </Field>

        <Field id="claim-role" label="Your role" error={fieldErrors.role}>
          <select
            id="claim-role"
            className={claimSelectClass(submitting)}
            value={form.role}
            onChange={(e) => setField('role', e.target.value)}
            disabled={submitting}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="claim-contact-method" label="Preferred contact" error={fieldErrors.contactMethod}>
          <select
            id="claim-contact-method"
            className={claimSelectClass(submitting)}
            value={form.contactMethod}
            onChange={(e) => setField('contactMethod', e.target.value)}
            disabled={submitting}
          >
            {CONTACT_METHODS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        {form.contactMethod === 'email' ? (
          <Field id="claim-email" label="Contact email" error={fieldErrors.email}>
            <input
              id="claim-email"
              type="email"
              className={claimInputClass(submitting)}
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="you@business.com"
              autoComplete="email"
              disabled={submitting}
            />
          </Field>
        ) : (
          <Field id="claim-phone" label="Contact phone" error={fieldErrors.phone}>
            <input
              id="claim-phone"
              type="tel"
              className={claimInputClass(submitting)}
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="Phone number"
              autoComplete="tel"
              disabled={submitting}
            />
          </Field>
        )}

        <Field id="claim-proof" label="Proof link (optional)" error={fieldErrors.proofImageUrl}>
          <input
            id="claim-proof"
            type="url"
            className={claimInputClass(submitting)}
            value={form.proofImageUrl}
            onChange={(e) => setField('proofImageUrl', e.target.value)}
            placeholder="Link to a photo or document that proves ownership"
            disabled={submitting}
          />
        </Field>

        <Field id="claim-instagram" label="Instagram (optional)">
          <input
            id="claim-instagram"
            type="url"
            className={claimInputClass(submitting)}
            value={form.instagramUrl}
            onChange={(e) => setField('instagramUrl', e.target.value)}
            placeholder="https://instagram.com/yourbusiness"
            disabled={submitting}
          />
        </Field>

        <Field id="claim-website" label="Website (optional)">
          <input
            id="claim-website"
            type="url"
            className={claimInputClass(submitting)}
            value={form.websiteUrl}
            onChange={(e) => setField('websiteUrl', e.target.value)}
            placeholder="https://yourbusiness.com"
            disabled={submitting}
          />
        </Field>

        <Field id="claim-notes" label="Anything else? (optional)">
          <textarea
            id="claim-notes"
            rows={3}
            className={claimInputClass(submitting)}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Extra context for the reviewer"
            disabled={submitting}
          />
        </Field>

        <button type="submit" className={claimPrimaryButtonClass} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit claim for review'}
        </button>
      </form>
    </div>
  )
}
