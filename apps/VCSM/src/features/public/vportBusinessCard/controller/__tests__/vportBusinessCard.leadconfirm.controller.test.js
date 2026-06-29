/**
 * Regression tests — submitVportBusinessCardLeadController (lead-confirmation forwarding)
 *
 * TICKET-LEADCONFIRM-EMAIL-SERVERBIND-001 (V04A-M1, application-path retirement).
 * The anonymous business-card lead flow must NOT forward caller-controlled
 * recipient/branding into the send-lead-confirmation Edge function. After the
 * retirement the controller forwards ONLY the committed leadId; the Edge function
 * (the durable trust boundary, unchanged here) derives recipient + provider +
 * canonical URL from the lead row. Owner notification + fire-and-forget behavior
 * are preserved.
 *
 * Run: npx vitest run src/features/public/vportBusinessCard/controller/__tests__/vportBusinessCard.leadconfirm.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/public/vportBusinessCard/dal/vportBusinessCard.read.dal', () => ({
  default: vi.fn(),
}))
vi.mock('@/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal', () => ({
  default: vi.fn(),
}))
vi.mock('@/features/public/vportBusinessCard/model/vportBusinessCard.model', () => ({
  mapVportBusinessCardPublicRow: vi.fn(),
  validateVportBusinessCardLeadInput: vi.fn(),
}))
vi.mock('@/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal', () => ({
  sendLeadConfirmationEmailDAL: vi.fn(),
}))
vi.mock('@/features/public/vportBusinessCard/dal/publishLeadNotification.edge.dal', () => ({
  publishLeadNotificationDAL: vi.fn(),
}))
vi.mock('@/features/public/vportBusinessCard/dal/businessCardSections.read.dal', () => ({
  readBusinessCardSectionsDAL: vi.fn(),
}))

import createVportBusinessCardLeadDAL from '@/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal'
import { validateVportBusinessCardLeadInput } from '@/features/public/vportBusinessCard/model/vportBusinessCard.model'
import { sendLeadConfirmationEmailDAL } from '@/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal'
import { publishLeadNotificationDAL } from '@/features/public/vportBusinessCard/dal/publishLeadNotification.edge.dal'
import { submitVportBusinessCardLeadController } from '@/features/public/vportBusinessCard/controller/vportBusinessCard.controller'

const VALID_INPUT = {
  slug: 'tri-point',
  name: 'George',
  phone: '555-0100',
  email: 'visitor@example.com',
  message: 'Need a quote',
  // Caller-supplied branding/recipient — must NOT be forwarded to the email DAL.
  vportName: 'ATTACKER BRAND',
  providerProfileUrl: 'https://evil.example.com/phish',
}

beforeEach(() => {
  vi.clearAllMocks()
  validateVportBusinessCardLeadInput.mockReturnValue({
    ok: true,
    fieldErrors: {},
    payload: {
      name: 'George',
      phone: '555-0100',
      email: 'visitor@example.com',
      message: 'Need a quote',
    },
  })
  createVportBusinessCardLeadDAL.mockResolvedValue({ lead_id: 'lead-123' })
  publishLeadNotificationDAL.mockResolvedValue({
    ok: true,
    fn: 'publish-lead-notification',
    leadId: 'lead-123',
  })
})

describe('submitVportBusinessCardLeadController — lead-confirmation forwarding retirement', () => {
  it('forwards ONLY the committed leadId to the confirmation-email DAL', async () => {
    await submitVportBusinessCardLeadController(VALID_INPUT)

    expect(sendLeadConfirmationEmailDAL).toHaveBeenCalledTimes(1)
    expect(sendLeadConfirmationEmailDAL).toHaveBeenCalledWith({ leadId: 'lead-123' })
  })

  it('forwards no recipient email and no branding fields to the confirmation-email DAL', async () => {
    await submitVportBusinessCardLeadController(VALID_INPUT)

    const payload = sendLeadConfirmationEmailDAL.mock.calls[0][0]
    expect(Object.keys(payload)).toEqual(['leadId'])
    expect(payload).not.toHaveProperty('email')
    expect(payload).not.toHaveProperty('name')
    expect(payload).not.toHaveProperty('vportName')
    expect(payload).not.toHaveProperty('providerProfileUrl')
    expect(payload).not.toHaveProperty('source')
  })

  it('leaves owner notification unchanged (still bridged by leadId)', async () => {
    await submitVportBusinessCardLeadController(VALID_INPUT)

    expect(publishLeadNotificationDAL).toHaveBeenCalledTimes(1)
    expect(publishLeadNotificationDAL).toHaveBeenCalledWith({ leadId: 'lead-123' })
  })

  it('preserves fire-and-forget + return shape (email DAL not awaited, lead still succeeds)', async () => {
    // Confirmation email is fire-and-forget: a void/non-blocking DAL must not
    // change the committed-lead success result.
    sendLeadConfirmationEmailDAL.mockReturnValue(undefined)

    const outcome = await submitVportBusinessCardLeadController(VALID_INPUT)

    expect(outcome).toEqual({
      ok: true,
      result: { lead_id: 'lead-123' },
      notification: { ok: true, fn: 'publish-lead-notification', leadId: 'lead-123' },
    })
  })
})
