import { createSupabaseAdmin } from './supabaseAdmin.ts'

export class AuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export async function getAuthUser(request: Request) {
  const authorization = request.headers.get('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthError('Missing authorization header')
  }

  const token = authorization.replace('Bearer ', '')
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new AuthError('Invalid or expired auth token')
  }

  return data.user
}

export async function getAuthUserId(request: Request) {
  const user = await getAuthUser(request)
  return user.id
}
