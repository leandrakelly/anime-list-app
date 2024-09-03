import { redirect } from 'next/navigation'

import { getToken } from '../actions/auth'

import AnimeList from './AnimeList'

export default async function AnimePage() {
  const token = await getToken()

  if (!token) {
    redirect('/')
  }

  return <AnimeList />
}
