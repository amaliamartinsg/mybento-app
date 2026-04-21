import client from './client'

export interface UserPublic {
  id: number
  email: string
  name: string | null
  is_active: boolean
}

export interface Token {
  access_token: string
  token_type: string
}

export async function loginApi(email: string, password: string): Promise<Token> {
  const { data } = await client.post<Token>('/auth/login', { email, password })
  return data
}

export async function registerApi(email: string, password: string, name?: string): Promise<Token> {
  const { data } = await client.post<Token>('/auth/register', { email, password, name })
  return data
}

export async function getMeApi(token: string): Promise<UserPublic> {
  const { data } = await client.get<UserPublic>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}
