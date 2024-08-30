import { Box, Heading, Text, Button } from '@chakra-ui/react'

export default function Home() {
  return (
    <Box p={8}>
      <Heading mb={4}>Welcome to your Anime App</Heading>
      <Text mb={4}>This is a sample page using Chakra UI components.</Text>
      <Button colorScheme="pink">Get Started</Button>
    </Box>
  )
}