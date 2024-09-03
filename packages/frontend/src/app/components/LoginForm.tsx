'use client'

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { login } from '../actions/auth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const toast = useToast()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const result = await login(email, password)
    if (result.success) {
      router.push('/anime')
      router.refresh()
    } else {
      setError(result.error || 'Login failed')
      toast({
        title: 'Login failed',
        description: result.error || 'Please check your credentials and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit} width="300px" margin="auto">
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormControl>
        <Button type="submit" colorScheme="purple" width="100%">
          Login
        </Button>
        {error && <Text color="red.500">{error}</Text>}
      </VStack>
    </Box>
  )
}
