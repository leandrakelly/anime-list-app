'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Image,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StarIcon, Search, LogOutIcon, Clock, HeartIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { logout } from '../actions/auth'

interface Anime {
  isFavorite: boolean
  isWatchLater: boolean
  mal_id: number
  title: string
  images: {
    jpg: {
      image_url: string
    }
  }
  score: number
  year: number
  genres: Array<{ name: string }>
}

interface AnimeResponse {
  data: Anime[]
  pagination?: {
    has_next_page: boolean
    current_page: number
  }
}

export default function AnimeList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSearch, setCurrentSearch] = useState('')
  const router = useRouter()
  const toast = useToast()

  const queryClient = useQueryClient()

  const fetchAnimes = async ({ pageParam = 1 }): Promise<AnimeResponse> => {
    const url = currentSearch
      ? `/api/anime/search?q=${encodeURIComponent(currentSearch)}&page=${pageParam}&limit=12`
      : `/api/anime?page=${pageParam}&limit=12`

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 401) {
        logout()
        throw new Error('Unauthorized. Please log in again.')
      }
      throw new Error('Network response was not ok')
    }

    const result = await response.json()
    return {
      data: Array.isArray(result.data) ? result.data : [],
      pagination: result.pagination || { has_next_page: false, current_page: pageParam },
    }
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['animes', currentSearch],
    queryFn: fetchAnimes,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.has_next_page ? lastPage.pagination.current_page + 1 : undefined,
  })

  const toggleFavorite = useMutation({
    mutationFn: async (animeId: number) => {
      const isFavorite = data?.pages.some((page) =>
        page.data.some((anime) => anime.mal_id === animeId && anime.isFavorite)
      )

      const url = `/api/favorites${isFavorite ? `/${animeId}` : ''}`
      const method = isFavorite ? 'DELETE' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: isFavorite ? undefined : JSON.stringify({ id: animeId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || `Failed to ${isFavorite ? 'remove from' : 'add to'} favorites`
        )
      }
      const result = await response.json()
      return { animeId, isFavorite: result.isFavorite }
    },
    onMutate: async (animeId) => {
      await queryClient.cancelQueries({ queryKey: ['animes', currentSearch] })
      const previousData = queryClient.getQueryData(['animes', currentSearch])

      queryClient.setQueryData(['animes', currentSearch], (old: any) => ({
        ...old,
        pages: old.pages.map((page: AnimeResponse) => ({
          ...page,
          data: page.data.map((anime: Anime) =>
            anime.mal_id === animeId ? { ...anime, isFavorite: !anime.isFavorite } : anime
          ),
        })),
      }))

      return { previousData }
    },
    onError: (err, context: any) => {
      queryClient.setQueryData(['animes', currentSearch], context.previousData)
      toast({
        title: 'Error',
        description: (err as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['animes', currentSearch], (old: any) => ({
        ...old,
        pages: old.pages.map((page: AnimeResponse) => ({
          ...page,
          data: page.data.map((anime: Anime) =>
            anime.mal_id === data.animeId ? { ...anime, isFavorite: data.isFavorite } : anime
          ),
        })),
      }))
      toast({
        title: data.isFavorite ? 'Added to favorites' : 'Removed from favorites',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const toggleWatchLater = useMutation({
    mutationFn: async (animeId: number) => {
      const isWatchLater = data?.pages.some((page) =>
        page.data.some((anime) => anime.mal_id === animeId && anime.isWatchLater)
      )

      const url = `/api/watchlist${isWatchLater ? `/${animeId}` : ''}`
      const method = isWatchLater ? 'DELETE' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: isWatchLater ? undefined : JSON.stringify({ id: animeId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || `Failed to ${isWatchLater ? 'remove from' : 'add to'} watch later`
        )
      }
      const result = await response.json()
      return { animeId, isWatchLater: result.isWatchLater }
    },
    onMutate: async (animeId) => {
      await queryClient.cancelQueries({ queryKey: ['animes', currentSearch] })
      const previousData = queryClient.getQueryData(['animes', currentSearch])

      queryClient.setQueryData(['animes', currentSearch], (old: any) => ({
        ...old,
        pages: old.pages.map((page: AnimeResponse) => ({
          ...page,
          data: page.data.map((anime: Anime) =>
            anime.mal_id === animeId ? { ...anime, isWatchLater: !anime.isWatchLater } : anime
          ),
        })),
      }))

      return { previousData }
    },
    onError: (err, animeId, context: any) => {
      queryClient.setQueryData(['animes', currentSearch], context.previousData)
      toast({
        title: 'Error',
        description: (err as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['animes', currentSearch], (old: any) => ({
        ...old,
        pages: old.pages.map((page: AnimeResponse) => ({
          ...page,
          data: page.data.map((anime: Anime) =>
            anime.mal_id === data.animeId ? { ...anime, isWatchLater: data.isWatchLater } : anime
          ),
        })),
      }))
      toast({
        title: data.isWatchLater ? 'Added to watch later' : 'Removed from watch later',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const handleSearch = () => {
    setCurrentSearch(searchTerm)
    refetch()
  }

  const handleViewDetails = (animeId: number) => {
    router.push(`/anime/${animeId}`)
  }

  const handleLogout = async () => {
    const success = await logout()
    if (success) {
      router.push('/')
    }
  }

  if (isError) {
    toast({
      title: 'Error',
      description: (error as Error)?.message || 'An error occurred while fetching data.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    })
  }

  return (
    <Box bgColor="gray.50" minHeight="100vh">
      <VStack p={8} spacing={8} width="full" align="stretch">
        <Flex justify="space-between" align="center">
          <Heading fontSize="3xl">Anime Explorer ✨</Heading>
          <Flex gap={2} align="center">
            <Link href="/my-lists">
              <Button size="sm" colorScheme="pink" rightIcon={<StarIcon size={16} />}>
                My Lists
              </Button>
            </Link>
            <Button onClick={handleLogout} leftIcon={<LogOutIcon />} size="sm" fontWeight="bold">
              Logout
            </Button>
          </Flex>
        </Flex>
        <Flex>
          <Input
            placeholder="Search anime..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            mr={2}
            borderRadius="full"
            borderColor="purple.200"
            _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #4299E1' }}
          />
          <Button
            onClick={handleSearch}
            leftIcon={<Search />}
            colorScheme="yellow"
            borderRadius="full"
          >
            Search
          </Button>
        </Flex>
        {isLoading ? (
          <Flex justify="center">
            <Spinner size="xl" color="blue.500" thickness="4px" />
          </Flex>
        ) : (
          <>
            {data?.pages.flatMap((page) => page.data).length === 0 && !isLoading ? (
              <Text textAlign="center" fontSize="lg" color="gray.600">
                No results found. Try a different search term. 🙁
              </Text>
            ) : (
              <SimpleGrid minChildWidth="250px" spacing={6}>
                {data?.pages
                  .flatMap((page) => page.data)
                  .map((anime) => (
                    <Box
                      key={anime.mal_id}
                      borderWidth="1px"
                      borderRadius="lg"
                      overflow="hidden"
                      boxShadow="md"
                      transition="all 0.3s"
                      _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
                      bg="white"
                    >
                      <Image
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        height="300px"
                        width="100%"
                        objectFit="cover"
                      />
                      <Box p={4}>
                        <Heading
                          as="h3"
                          size="md"
                          isTruncated
                          mb={2}
                          fontFamily="'Nunito', sans-serif"
                        >
                          {anime.title}
                        </Heading>
                        <Flex align="center" mb={2}>
                          <StarIcon size={16} color="gold" />
                          <Text ml={1} fontWeight="bold">
                            {anime.score?.toFixed(1) || 'N/A'}
                          </Text>
                        </Flex>
                        <Text fontSize="sm" color="gray.600" mb={2}>
                          Year: {anime.year || 'N/A'}
                        </Text>
                        <Flex wrap="wrap" gap={2} mb={4}>
                          {anime.genres?.slice(0, 3).map((genre) => (
                            <Badge
                              key={genre.name}
                              colorScheme="purple"
                              borderRadius="full"
                              px={2}
                              fontSize="xs"
                            >
                              {genre.name}
                            </Badge>
                          ))}
                        </Flex>
                        <Flex justify="space-between">
                          <IconButton
                            size="sm"
                            aria-label="Toggle favorite"
                            variant="outline"
                            icon={
                              <HeartIcon
                                stroke={anime.isFavorite ? 'red' : 'gray'}
                                fill={anime.isFavorite ? 'red' : 'none'}
                              />
                            }
                            onClick={() => toggleFavorite.mutate(anime.mal_id)}
                            borderRadius="full"
                          />
                          <Button
                            size="sm"
                            leftIcon={<Clock />}
                            onClick={() => toggleWatchLater.mutate(anime.mal_id)}
                            colorScheme={anime.isWatchLater ? 'orange' : 'gray'}
                            borderRadius="full"
                          >
                            {anime.isWatchLater ? 'Remove' : 'Watch Later'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(anime.mal_id)}
                            colorScheme="purple"
                            borderRadius="full"
                          >
                            Details
                          </Button>
                        </Flex>
                      </Box>
                    </Box>
                  ))}
              </SimpleGrid>
            )}
            <Flex justify="center" mt={6}>
              {hasNextPage && (
                <Button
                  onClick={() => fetchNextPage()}
                  isLoading={isFetchingNextPage}
                  colorScheme="yellow"
                  size="lg"
                  loadingText="Loading more..."
                  borderRadius="full"
                >
                  Load More
                </Button>
              )}
            </Flex>
          </>
        )}
      </VStack>
    </Box>
  )
}
