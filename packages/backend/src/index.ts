import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { JWTPayload } from "hono/utils/jwt/types";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import NodeCache from "node-cache";
import pThrottle from "p-throttle";

const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", cors());

const prisma = new PrismaClient();

const userSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const animeIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const animeIdBodySchema = z.object({
  id: z.number().int().positive(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(25).default(10),
});

const animeSearchSchema = paginationSchema.extend({
  q: z.string().optional().default(""),
});

const signJwt = (payload: JWTPayload) => {
  return sign(payload, process.env.JWT_SECRET || "your-secret-key");
};

interface JikanAnimeResponse {
  data: {
    mal_id: number;
    title: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
    score: number | null;
    year: number | null;
    genres: Array<{ name: string }>;
    // Add other fields as necessary
  };
}

interface AnimeData {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  score: number | null;
  year: number | null;
  genres: Array<{ name: string }>;
  // Add other fields as necessary
}

const cache = new NodeCache({ stdTTL: 3600 });

const throttle = pThrottle({
  limit: 1,
  interval: 1000,
});

const throttledFetch = throttle(
  async (url: string): Promise<JikanAnimeResponse> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
);

async function getAnimeDetails(animeIds: number[]): Promise<AnimeData[]> {
  const animeDetails = await Promise.all(
    animeIds.map(async (id) => {
      const cacheKey = `anime_${id}`;
      const cachedData = cache.get<AnimeData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      try {
        const data = await retry<JikanAnimeResponse>(
          () => throttledFetch(`https://api.jikan.moe/v4/anime/${id}`),
          {
            retries: 3,
            minTimeout: 1000,
            factor: 2,
          }
        );

        const animeData: AnimeData = {
          mal_id: data.data.mal_id,
          title: data.data.title,
          images: data.data.images,
          score: data.data.score,
          year: data.data.year,
          genres: data.data.genres,
          // Add other fields as necessary
        };

        cache.set(cacheKey, animeData);
        return animeData;
      } catch (error) {
        console.error(`Error fetching anime ${id}:`, error);
        return {
          mal_id: id,
          title: "Data Unavailable",
          images: { jpg: { image_url: "/placeholder-image.jpg" } },
          score: null,
          year: null,
          genres: [],
        };
      }
    })
  );
  return animeDetails.filter((anime): anime is AnimeData => anime !== null);
}

function retry<T>(
  fn: () => Promise<T>,
  options: { retries: number; minTimeout: number; factor: number }
): Promise<T> {
  const { retries = 3, minTimeout = 1000, factor = 2 } = options;

  const execute = async (): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      if (attempts >= retries) {
        throw err;
      } else {
        const delay = minTimeout * Math.pow(factor, attempts);
        console.log(`Retrying after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempts++;
        return execute(); // Retry the execution
      }
    }
  };

  let attempts = 0;
  return new Promise<T>((resolve, reject) => {
    execute().then(resolve).catch(reject);
  });
}

app.onError((err, c) => {
  console.error(`${c.req.method} ${c.req.url}`, err);

  if (err instanceof z.ZodError) {
    return c.json({ error: "Validation error", details: err.errors }, 400);
  }

  if (err instanceof Error) {
    return c.json({ error: err.message }, 500);
  }

  return c.json({ error: "An unexpected error occurred" }, 500);
});

const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET || "your-secret-key",
});

app.post("/auth/register", zValidator("json", userSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return c.json({ error: "User with this email already exists" }, 400);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });
  const token = await signJwt({ id: user.id });
  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
});

app.post("/auth/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = await signJwt({ id: user.id });
  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
});

app.use("/anime/*", jwtMiddleware);
app.use("/favorites/*", jwtMiddleware);
app.use("/watchlist/*", jwtMiddleware);

app.get("/anime", zValidator("query", paginationSchema), async (c) => {
  const { page, limit } = c.req.valid("query");
  const userId = c.get("jwtPayload")?.id;

  const animeResponse = await fetch(
    `https://api.jikan.moe/v4/anime?page=${page}&limit=${limit}`
  );
  if (!animeResponse.ok) {
    throw new Error("Failed to fetch anime data");
  }
  const animeData = await animeResponse.json();

  let favoriteAnimeIds: Set<number> = new Set();
  let watchLaterAnimeIds: Set<number> = new Set();

  if (userId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { animeId: true },
    });
    favoriteAnimeIds = new Set(
      favorites.map((fav: { animeId: number }) => fav.animeId)
    );

    const watchLater = await prisma.watchLater.findMany({
      where: { userId },
      select: { animeId: true },
    });
    watchLaterAnimeIds = new Set(
      watchLater.map((item: { animeId: number }) => item.animeId)
    );
  }

  const animesWithStatus = animeData.data.map((anime: any) => ({
    ...anime,
    isFavorite: favoriteAnimeIds.has(anime.mal_id),
    isWatchLater: watchLaterAnimeIds.has(anime.mal_id),
  }));

  return c.json({
    data: animesWithStatus,
    pagination: animeData.pagination,
  });
});

app.get("/anime/search", zValidator("query", animeSearchSchema), async (c) => {
  const { q, page, limit } = c.req.valid("query");
  const userId = c.get("jwtPayload").id;

  const response = await fetch(
    `https://api.jikan.moe/v4/anime?q=${q}&page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch anime search results");
  }
  const data = await response.json();

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { animeId: true },
  });
  const favoriteSet = new Set(favorites.map((f) => f.animeId));

  const watchLater = await prisma.watchLater.findMany({
    where: { userId },
    select: { animeId: true },
  });
  const watchLaterSet = new Set(watchLater.map((w) => w.animeId));

  const animeWithStatus = data.data.map((anime: { mal_id: number }) => ({
    ...anime,
    isFavorite: favoriteSet.has(anime.mal_id),
    isWatchLater: watchLaterSet.has(anime.mal_id),
  }));

  return c.json({
    ...data,
    data: animeWithStatus,
  });
});

app.get("/anime/:id", zValidator("param", animeIdSchema), async (c) => {
  const { id } = c.req.valid("param");
  const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch anime details");
  }
  const data = await response.json();
  return c.json({ success: true, data });
});

app.post("/favorites", zValidator("json", animeIdBodySchema), async (c) => {
  const userId = c.get("jwtPayload").id;
  const { id } = c.req.valid("json");

  const existingFavorite = await prisma.favorite.findFirst({
    where: { userId, animeId: id },
  });

  if (existingFavorite) {
    return c.json({
      message: "This anime is already in your favorites",
      isFavorite: true,
    });
  }

  await prisma.favorite.create({
    data: { userId, animeId: id },
  });

  return c.json({ message: "Favorite added successfully", isFavorite: true });
});

app.get("/favorites", async (c) => {
  const userId = c.get("jwtPayload").id;
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { animeId: true },
  });

  if (favorites.length === 0) {
    return c.json({ message: "Favorites list is empty", data: [] });
  }

  const animeIds = favorites.map((item: { animeId: number }) => item.animeId);
  const animeDetails = await getAnimeDetails(animeIds);

  return c.json({
    message: "Favorites retrieved successfully",
    data: animeDetails,
  });
});

app.delete("/favorites/:id", zValidator("param", animeIdSchema), async (c) => {
  const userId = c.get("jwtPayload").id;
  const { id: animeId } = c.req.valid("param");

  const deletedFavorite = await prisma.favorite.deleteMany({
    where: { userId, animeId },
  });

  if (deletedFavorite.count === 0) {
    return c.json({ message: "Favorite not found", isFavorite: false }, 404);
  }

  return c.json({
    message: "Favorite removed successfully",
    isFavorite: false,
  });
});

app.post("/watchlist", zValidator("json", animeIdBodySchema), async (c) => {
  const userId = c.get("jwtPayload").id;
  const { id } = c.req.valid("json");

  const existingWatchItem = await prisma.watchLater.findFirst({
    where: { userId, animeId: id },
  });

  if (existingWatchItem) {
    return c.json({
      message: "This anime is already in your watchlist",
      isWatchLater: true,
    });
  }

  await prisma.watchLater.create({
    data: { userId, animeId: id },
  });

  return c.json({
    message: "Added to watch list successfully",
    isWatchLater: true,
  });
});

app.get("/watchlist", async (c) => {
  const userId = c.get("jwtPayload").id;
  const watchList = await prisma.watchLater.findMany({
    where: { userId },
    select: { animeId: true },
  });

  if (watchList.length === 0) {
    return c.json({ message: "Watchlist is empty", data: [] });
  }

  const animeIds = watchList.map((item: { animeId: number }) => item.animeId);
  const animeDetails = await getAnimeDetails(animeIds);

  return c.json({
    message: "Watchlist retrieved successfully",
    data: animeDetails,
  });
});

app.delete("/watchlist/:id", zValidator("param", animeIdSchema), async (c) => {
  const userId = c.get("jwtPayload").id;
  const { id: animeId } = c.req.valid("param");

  const deletedItem = await prisma.watchLater.deleteMany({
    where: { userId, animeId },
  });

  if (deletedItem.count === 0) {
    return c.json(
      { message: "Anime not found in watchlist", isWatchLater: false },
      404
    );
  }

  return c.json({
    message: "Removed from watch list successfully",
    isWatchLater: false,
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
