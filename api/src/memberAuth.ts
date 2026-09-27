import { createHmac, timingSafeEqual } from 'node:crypto'
import type { HttpRequest } from '@azure/functions'

const adminNames = () => new Set((process.env.ADMIN_MEMBER_NAMES ?? '').split(/[,，]/).map((name) => name.trim()).filter(Boolean))
const secret = () => process.env.ADMIN_PASSWORD?.trim() ?? ''

export const isAdminName = (name: string) => adminNames().has(name)
export const adminConfigured = () => adminNames().size > 0 && secret().length >= 16

export function verifyAdminPassword(password: string) {
  if (!adminConfigured()) return false
  const expected = createHmac('sha256', secret()).update('admin-login').digest()
  const supplied = createHmac('sha256', password).update('admin-login').digest()
  return timingSafeEqual(expected, supplied)
}

function signature(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url') }

export function createSessionToken(id: number, name: string, isAdmin: boolean) {
  const payload = Buffer.from(JSON.stringify({ id, name, isAdmin, expires: Date.now() + (isAdmin ? 12 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000) })).toString('base64url')
  return `${payload}.${signature(payload)}`
}

export function sessionFromRequest(request: HttpRequest): { id: number; name: string; isAdmin: boolean } | null {
  if (!adminConfigured()) return null
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const expected = Buffer.from(signature(parts[0]))
  const actual = Buffer.from(parts[1])
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  try {
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as { id?: number; name?: string; isAdmin?: boolean; expires?: number }
    return Number.isInteger(data.id) && typeof data.name === 'string' && typeof data.isAdmin === 'boolean' && Number(data.expires) > Date.now() ? { id: data.id!, name: data.name, isAdmin: data.isAdmin } : null
  } catch { return null }
}

export function adminIdFromRequest(request: HttpRequest) { const session = sessionFromRequest(request); return session?.isAdmin && isAdminName(session.name) ? session.id : null }
