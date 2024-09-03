import { redirect } from 'next/navigation'

import { getToken } from './actions/auth'
import { AuthForms } from './components/AuthForms'

export default async function Home() {
  const token = await getToken()

  if (token) {
    redirect('/anime')
  }

  return <AuthForms />
}
