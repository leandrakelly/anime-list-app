'use server'

import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function login(email: string, password: string) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()

    if (data.token) {
      cookies().set('token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
      })
      return { success: true }
    } else {
      throw new Error('No token received')
    }
  } catch {
    return { success: false, error: 'Invalid credentials' }
  }
}

export async function register(name: string, email: string, password: string) {
  if (!name || !email || !password) {
    return { success: false, error: 'All fields are required' }
  }
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      if (data.error === 'Validation error' && Array.isArray(data.details)) {
        return {
          success: false,
          error: 'Validation error',
          details: data.details,
        }
      }
      throw new Error(data.error || 'Registration failed')
    }
    if (data.token) {
      cookies().set('token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
      })
      return { success: true }
    } else {
      throw new Error('No token received')
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    }
  }
}

export async function logout() {
  try {
    cookies().delete('token')
    return true
  } catch {
    return false
  }
}

export async function getToken() {
  return cookies().get('token')?.value
}
