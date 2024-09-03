'use client'

import { useRouter } from 'next/navigation'

import { logout } from '../actions/auth'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push('/')
    router.refresh()
  }

  return <button onClick={handleLogout}>Log out</button>
}
