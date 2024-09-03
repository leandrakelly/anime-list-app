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

import { register } from '../../app/actions/auth'

interface RegistrationFormData {
  name: string
  email: string
  password: string
}

export const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({})
  const router = useRouter()
  const toast = useToast()

  const validateForm = () => {
    const newErrors: Partial<RegistrationFormData> = {}
    if (!formData.name || formData.name.length < 2 || formData.name.length > 50) {
      newErrors.name = 'Name must be between 2 and 50 characters'
    }
    if (!formData.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (
      !formData.password ||
      formData.password.length < 8 ||
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        formData.password
      )
    ) {
      newErrors.password =
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const formDataToSend = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value)
    })

    const result = await register(formData.name, formData.email, formData.password)
    if (result.success) {
      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      router.push('/anime')
      router.refresh()
    } else {
      toast({
        title: 'Registration failed',
        description: result.error || 'An error occurred during registration.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit} width="300px" margin="auto">
      <VStack spacing={4}>
        <FormControl isInvalid={!!errors.name}>
          <FormLabel>Name</FormLabel>
          <Input name="name" value={formData.name} onChange={handleChange} />
          {errors.name && <Text color="red.500">{errors.name}</Text>}
        </FormControl>
        <FormControl isInvalid={!!errors.email}>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="email" value={formData.email} onChange={handleChange} />
          {errors.email && <Text color="red.500">{errors.email}</Text>}
        </FormControl>
        <FormControl isInvalid={!!errors.password}>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && <Text color="red.500">{errors.password}</Text>}
        </FormControl>
        <Button type="submit" colorScheme="purple" width="100%">
          Register
        </Button>
      </VStack>
    </Box>
  )
}
