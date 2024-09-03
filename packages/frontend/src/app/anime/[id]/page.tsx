'use client'

import {
  Box,
  Heading,
  Image,
  Text,
  VStack,
  Badge,
  Spinner,
  useToast,
  Button,
  Divider,
  Flex,
  Stack,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { MoveLeftIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

interface AnimeDetails {
  mal_id: number
  title: string
  synopsis: string
  background: string
  score: number
  scored_by: number
  rank: number
  popularity: number
  members: number
  favorites: number
  genres: Array<{ name: string }>
  studios: Array<{ name: string }>
  status: string
  aired: { string: string }
  episodes: number
  duration: string
  rating: string
  source: string
  season: string
  year: number
  broadcast: { string: string }
  producers: Array<{ name: string }>
  licensors: Array<{ name: string }>
  images: { jpg: { large_image_url: string } }
}

const fetchAnimeDetails = async (id: string): Promise<AnimeDetails> => {
  const response = await fetch(`/api/anime/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch anime details')
  }
  const data = await response.json()
  return data.data.data
}

export default function AnimeDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()

  const {
    data: anime,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['animeDetails', params.id],
    queryFn: () => fetchAnimeDetails(params.id as string),
  })

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load anime details. Please try again later.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    })
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bg="gray.50">
        <Spinner size="xl" color="purple.500" />
      </Box>
    )
  }

  if (!anime) {
    return <Box>Anime not found</Box>
  }

  return (
    <Box maxWidth="8xl" margin="auto" padding={[4, 6, 8]} bg="gray.50" minHeight="100vh">
      <VStack spacing={6} align="start" bg="white" p={[4, 5, 6]} borderRadius="lg" boxShadow="md">
        <Flex
          direction={['column', 'column', 'row']}
          justify="space-between"
          width="100%"
          mb={4}
          flexWrap="wrap"
        >
          <Heading as="h1" size={['lg', 'xl']} color="purple.600" mb={[4]}>
            {anime.title}
          </Heading>
          <Button
            leftIcon={<MoveLeftIcon />}
            onClick={() => router.push('/anime')}
            size={['sm', 'md']}
          >
            Back to Anime List
          </Button>
        </Flex>
        <Stack direction={['column', 'column', 'row']} spacing={[4, 6, 8]} width="100%">
          <Image
            src={anime.images.jpg.large_image_url}
            alt={anime.title}
            width={['100%', '300px', '400px']}
            maxWidth="400px"
            height={['auto', '300px', '400px']}
            objectFit="cover"
            borderRadius="md"
          />
          <VStack align="start" spacing={3} flex={1}>
            <Flex wrap="wrap" align="center">
              <Badge colorScheme="green" fontSize={['md', 'lg']} px={2} py={1} mr={2} mb={2}>
                Score: {anime.score}
              </Badge>
              <Text color="gray.500" fontSize={['sm', 'md']} mb={2}>
                ({anime.scored_by} users)
              </Text>
            </Flex>
            <Text fontSize={['sm', 'md']}>
              <strong>Rank:</strong> #{anime.rank}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Popularity:</strong> #{anime.popularity}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Members:</strong> {anime.members.toLocaleString()}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Favorites:</strong> {anime.favorites.toLocaleString()}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Status:</strong> {anime.status}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Aired:</strong> {anime.aired.string}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Episodes:</strong> {anime.episodes}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Duration:</strong> {anime.duration}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Rating:</strong> {anime.rating}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Source:</strong> {anime.source}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Season:</strong> {anime.season} {anime.year}
            </Text>
            <Text fontSize={['sm', 'md']}>
              <strong>Broadcast:</strong> {anime.broadcast?.string || 'N/A'}
            </Text>
          </VStack>
        </Stack>
        <Divider />
        <Box width="100%">
          <Heading as="h2" size={['md', 'lg']} mb={2} color="purple.500">
            Synopsis
          </Heading>
          <Text fontSize={['sm', 'md']}>{anime.synopsis}</Text>
        </Box>
        {anime.background && (
          <Box width="100%">
            <Heading as="h2" size={['md', 'lg']} mb={2} color="purple.500">
              Background
            </Heading>
            <Text fontSize={['sm', 'md']}>{anime.background}</Text>
          </Box>
        )}
        <Box width="100%">
          <Heading as="h2" size={['md', 'lg']} mb={2} color="purple.500">
            Genres
          </Heading>
          <Flex wrap="wrap">
            {anime.genres.map((genre) => (
              <Badge key={genre.name} colorScheme="purple" mr={2} mb={2}>
                {genre.name}
              </Badge>
            ))}
          </Flex>
        </Box>
        <Box width="100%">
          <Heading as="h2" size={['md', 'lg']} mb={2} color="purple.500">
            Studios
          </Heading>
          <Flex wrap="wrap">
            {anime.studios.map((studio) => (
              <Badge key={studio.name} colorScheme="cyan" mr={2} mb={2}>
                {studio.name}
              </Badge>
            ))}
          </Flex>
        </Box>
        <Box width="100%">
          <Heading as="h2" size={['md', 'lg']} mb={2} color="purple.500">
            Producers
          </Heading>
          <Flex wrap="wrap">
            {anime.producers.map((producer) => (
              <Badge key={producer.name} colorScheme="teal" mr={2} mb={2}>
                {producer.name}
              </Badge>
            ))}
          </Flex>
        </Box>
        <Box width="100%">
          <Heading as="h2" size={['md', 'lg']} mb={2} color="purple.500">
            Licensors
          </Heading>
          <Flex wrap="wrap">
            {anime.licensors.map((licensor) => (
              <Badge key={licensor.name} colorScheme="orange" mr={2} mb={2}>
                {licensor.name}
              </Badge>
            ))}
          </Flex>
        </Box>
      </VStack>
    </Box>
  )
}
