'use client'

import { Box, Heading, VStack, Button, Text } from '@chakra-ui/react'
import { useState } from 'react'

import { LoginForm } from './LoginForm'
import { RegistrationForm } from './RegistrationForm'

export function AuthForms() {
  const [isLoginView, setIsLoginView] = useState(true)

  const toggleView = () => {
    setIsLoginView(!isLoginView)
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Anime Explorer</Heading>
        {isLoginView ? (
          <>
            <LoginForm />
            <Text textAlign="center">
              Don&apos;t have an account?{' '}
              <Button variant="link" color="blue.500" onClick={toggleView}>
                Register here
              </Button>
            </Text>
          </>
        ) : (
          <>
            <RegistrationForm />
            <Text textAlign="center">
              Already have an account?{' '}
              <Button variant="link" color="blue.500" onClick={toggleView}>
                Login here
              </Button>
            </Text>
          </>
        )}
      </VStack>
    </Box>
  )
}
