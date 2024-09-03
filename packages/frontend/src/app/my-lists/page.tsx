'use client'

import {
  Box,
  Heading,
  SimpleGrid,
  Image,
  Text,
  VStack,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  HStack,
  Spinner,
  IconButton,
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MoveLeftIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AnimeItem {
  mal_id: number
  title: string
  images: { jpg: { image_url: string } }
  score: number
  year: number
  genres: Array<{ name: string }>
}

const fetchFavorites = async (): Promise<AnimeItem[]> => {
  const response = await fetch('/api/favorites')
  if (!response.ok) {
    throw new Error('Failed to fetch favorites')
  }
  const data = await response.json()
  return data.data.filter((item: AnimeItem) => item.title !== 'Data Unavailable')
}

const fetchWatchLater = async (): Promise<AnimeItem[]> => {
  const response = await fetch('/api/watchlist')
  if (!response.ok) {
    throw new Error('Failed to fetch watch later list')
  }
  const data = await response.json()
  return data.data.filter((item: AnimeItem) => item.title !== 'Data Unavailable')
}

const removeFavorite = async (animeId: number) => {
  const response = await fetch(`/api/favorites/${animeId}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error('Failed to remove from favorites')
  }
  return response.json()
}

const removeWatchLater = async (animeId: number) => {
  const response = await fetch(`/api/watchlist/${animeId}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error('Failed to remove from watch later')
  }
  return response.json()
}

export default function FavoritesAndWatchLaterPage() {
  const toast = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: favorites,
    isLoading: isLoadingFavorites,
    error: favoritesError,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  })

  const {
    data: watchLater,
    isLoading: isLoadingWatchLater,
    error: watchLaterError,
  } = useQuery({
    queryKey: ['watchLater'],
    queryFn: fetchWatchLater,
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast({
        title: 'Removed from favorites',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove from favorites',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const removeWatchLaterMutation = useMutation({
    mutationFn: removeWatchLater,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchLater'] })
      toast({
        title: 'Removed from watch later',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove from watch later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const handleViewDetails = (animeId: number) => {
    router.push(`/anime/${animeId}`)
  }

  if (favoritesError || watchLaterError) {
    toast({
      title: 'Error',
      description: 'Failed to load some data. Please try again later.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    })
  }

  const AnimeGrid = ({
    animes,
    removeFunction,
  }: {
    animes: AnimeItem[]
    removeFunction: (id: number) => void
  }) => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {animes.map((anime) => (
        <VStack
          key={anime.mal_id}
          borderWidth={1}
          borderRadius="lg"
          overflow="hidden"
          spacing={4}
          align="stretch"
          bg="white"
          boxShadow="md"
          transition="all 0.3s"
          _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
        >
          <Image
            src={anime.images.jpg.image_url}
            alt={anime.title}
            height="200px"
            objectFit="cover"
          />
          <VStack px={4} pb={4} spacing={2} align="stretch">
            <Heading as="h3" size="md" noOfLines={2}>
              {anime.title}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Year: {anime.year || 'N/A'}
            </Text>
            <Text fontWeight="bold" color="yellow.500">
              Score: {anime.score?.toFixed(1) || 'N/A'}
            </Text>
            <Box>
              {anime.genres.slice(0, 3).map((genre) => (
                <Badge key={genre.name} colorScheme="purple" mr={1} mb={1}>
                  {genre.name}
                </Badge>
              ))}
            </Box>
            <HStack justify="space-between" align="center">
              <Button
                onClick={() => handleViewDetails(anime.mal_id)}
                colorScheme="purple"
                size="sm"
              >
                View Details
              </Button>
              <IconButton
                aria-label="Remove"
                icon={<XIcon />}
                onClick={() => removeFunction(anime.mal_id)}
                colorScheme="red"
                size="xs"
              />
            </HStack>
          </VStack>
        </VStack>
      ))}
    </SimpleGrid>
  )

  return (
    <Box maxWidth="1200px" margin="auto" padding={8} bgColor="gray.50" minHeight="100vh">
      <HStack justify="space-between" width="100%" flexWrap="wrap">
        <Heading as="h1" size={['lg', 'xl']} color="purple.600" mb={[0, 4]}>
          My Anime Lists
        </Heading>
        <Button leftIcon={<MoveLeftIcon />} onClick={() => router.push('/anime')} mb={4}>
          Back to Anime List
        </Button>
      </HStack>
      <Tabs isFitted variant="enclosed" colorScheme="purple">
        <TabList mb="1em">
          <Tab _selected={{ color: 'white', bg: 'purple.500' }}>Favorites</Tab>
          <Tab _selected={{ color: 'white', bg: 'purple.500' }}>Watch Later</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {isLoadingFavorites ? (
              <Spinner size="xl" color="purple.500" />
            ) : favorites && favorites.length > 0 ? (
              <AnimeGrid
                animes={favorites}
                removeFunction={(id) => removeFavoriteMutation.mutate(id)}
              />
            ) : (
              <Text>You haven&apos;t added any favorites yet.</Text>
            )}
          </TabPanel>
          <TabPanel>
            {isLoadingWatchLater ? (
              <Spinner size="xl" color="purple.500" />
            ) : watchLater && watchLater.length > 0 ? (
              <AnimeGrid
                animes={watchLater}
                removeFunction={(id) => removeWatchLaterMutation.mutate(id)}
              />
            ) : (
              <Text>Your watch later list is empty.</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
