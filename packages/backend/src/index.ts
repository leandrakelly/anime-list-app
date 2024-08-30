import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { JWTPayload } from 'hono/utils/jwt/types'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())
const prisma = new PrismaClient()

const userSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const animeIdSchema = z.object({
  animeId: z.number().int().positive(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(25).default(10),
})

const signJwt = (payload: JWTPayload) => {
  return sign(payload, process.env.JWT_SECRET || 'your-secret-key')
}

async function getAnimeDetails(animeIds: number[]) {
  const animeDetails = await Promise.all(
    animeIds.map(id => 
      fetch(`https://api.jikan.moe/v4/anime/${id}`)
        .then(res => res.json())
        .then(data => data.data)
    )
  )
  return animeDetails
}

app.post('/auth/register', zValidator('json', userSchema), async (c) => {
  console.log("ola")
  const { email, password, name } = c.req.valid('json')
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    c.status(400)
    return c.json({ error: 'User with this email already exists' })
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  })
  const token = await signJwt({ id: user.id })
  return c.json({ user: { id: user.id, email: user.email, name: user.name }, token })
})

app.post('/auth/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    c.status(401)
    return c.json({ error: 'Invalid credentials' })
  }
  const token = await signJwt({ id: user.id })
  return c.json({ user: { id: user.id, email: user.email, name: user.name }, token })
})

app.use('/anime/*', jwt({ secret: process.env.JWT_SECRET || 'your-secret-key' }))
app.use('/favorites/*', jwt({ secret: process.env.JWT_SECRET || 'your-secret-key' }))
app.use('/watchlist/*', jwt({ secret: process.env.JWT_SECRET || 'your-secret-key' }))

app.get('/anime', zValidator('query', paginationSchema), async (c) => {
  const { page, limit } = c.req.valid('query')
  const response = await fetch(`https://api.jikan.moe/v4/anime?page=${page}&limit=${limit}`)
  const data = await response.json()
  return c.json(data)
})

app.get('/anime/:id', zValidator('param', animeIdSchema), async (c) => {
  const { animeId } = c.req.valid('param')
  const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`)
  const data = await response.json()
  return c.json(data)
})

app.post('/favorites', zValidator('json', animeIdSchema), async (c) => {
  const userId = c.get('jwtPayload').id
  const { animeId } = c.req.valid('json')
  await prisma.favorite.create({
    data: { userId, animeId },
  })
  return c.json({ message: 'Favorite added successfully' })
})

app.get('/favorites', async (c) => {
  const userId = c.get('jwtPayload').id
  const favorites = await prisma.favorite.findMany({ 
    where: { userId },
    select: { animeId: true }
  })
  const animeIds = favorites.map(fav => fav.animeId)
  const animeDetails = await getAnimeDetails(animeIds)
  return c.json(animeDetails)
})

app.delete('/favorites/:animeId', zValidator('param', animeIdSchema), async (c) => {
  const userId = c.get('jwtPayload').id
  const { animeId } = c.req.valid('param')
  await prisma.favorite.deleteMany({
    where: { userId, animeId },
  })
  return c.json({ message: 'Favorite removed successfully' })
})

app.post('/watchlist', zValidator('json', animeIdSchema), async (c) => {
  const userId = c.get('jwtPayload').id
  const { animeId } = c.req.valid('json')
  await prisma.watchLater.create({
    data: { userId, animeId },
  })
  return c.json({ message: 'Added to watch list successfully' })
})

app.get('/watchlist', async (c) => {
  const userId = c.get('jwtPayload').id
  const watchList = await prisma.watchLater.findMany({ 
    where: { userId },
    select: { animeId: true }
  })
  const animeIds = watchList.map(item => item.animeId)
  const animeDetails = await getAnimeDetails(animeIds)
  return c.json(animeDetails)
})

app.delete('/watchlist/:animeId', zValidator('param', animeIdSchema), async (c) => {
  const userId = c.get('jwtPayload').id
  const { animeId } = c.req.valid('param')
  await prisma.watchLater.deleteMany({
    where: { userId, animeId },
  })
  return c.json({ message: 'Removed from watch list successfully' })
})

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})

export default app