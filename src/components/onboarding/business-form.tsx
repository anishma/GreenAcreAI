'use client'

/**
 * Business Form Component
 *
 * Form for collecting business information during onboarding.
 * Includes: business name, owner name, email, phone, and service areas.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'
import { businessInfoSchema, serviceAreaSchema } from '@/lib/validations/tenant'

// Combined schema for business info + service areas
const businessFormSchema = businessInfoSchema.extend({
  serviceAreas: z.array(serviceAreaSchema).min(1, 'At least one service area is required'),
})

type BusinessFormData = z.infer<typeof businessFormSchema>

export function BusinessForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [zipCodeInput, setZipCodeInput] = useState('')
  const [serviceAreas, setServiceAreas] = useState<Array<{ zipCode: string; city?: string; state?: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      email: '',
      phone: '',
      serviceAreas: [],
    },
  })

  // Mutations
  const updateBusinessInfo = trpc.tenant.updateBusinessInfo.useMutation()
  const updateServiceAreas = trpc.tenant.updateServiceAreas.useMutation()
  const completeOnboardingStep = trpc.tenant.completeOnboardingStep.useMutation()

  // Load current tenant data to pre-fill email
  const { data: tenant } = trpc.tenant.getCurrent.useQuery()

  // Pre-fill email when tenant data loads
  if (tenant?.email && !watch('email')) {
    setValue('email', tenant.email)
  }

  const handleAddZipCode = () => {
    const zipCode = zipCodeInput.trim()

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zipCode)) {
      toast({
        title: 'Invalid ZIP code',
        description: 'Please enter a valid 5-digit ZIP code',
        variant: 'destructive',
      })
      return
    }

    // Check for duplicates
    if (serviceAreas.some((area) => area.zipCode === zipCode)) {
      toast({
        title: 'Duplicate ZIP code',
        description: 'This ZIP code has already been added',
        variant: 'destructive',
      })
      return
    }

    // Add to service areas
    const newArea = { zipCode }
    const updatedAreas = [...serviceAreas, newArea]
    setServiceAreas(updatedAreas)
    setValue('serviceAreas', updatedAreas)
    setZipCodeInput('')
  }

  const handleRemoveZipCode = (zipCode: string) => {
    const updatedAreas = serviceAreas.filter((area) => area.zipCode !== zipCode)
    setServiceAreas(updatedAreas)
    setValue('serviceAreas', updatedAreas)
  }

  const onSubmit = async (data: BusinessFormData) => {
    try {
      // Update business info
      await updateBusinessInfo.mutateAsync({
        businessName: data.businessName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
      })

      // Update service areas
      await updateServiceAreas.mutateAsync(data.serviceAreas)

      // Mark this step as complete
      await completeOnboardingStep.mutateAsync({ step: 'business-info' })

      toast({
        title: 'Business information saved',
        description: 'Moving to pricing configuration...',
      })

      // Navigate to step 2
      router.push('/step-2-pricing')
    } catch (error) {
      console.error('Error saving business info:', error)
      toast({
        title: 'Error',
        description: 'Failed to save business information. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Business Name */}
      <div>
        <Label htmlFor="businessName">
          Business Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="businessName"
          {...register('businessName')}
          placeholder="Green Acres Lawn Care"
          className="mt-1"
        />
        {errors.businessName && (
          <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
        )}
      </div>

      {/* Owner Name */}
      <div>
        <Label htmlFor="ownerName">
          Owner Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="ownerName"
          {...register('ownerName')}
          placeholder="John Doe"
          className="mt-1"
        />
        {errors.ownerName && (
          <p className="mt-1 text-sm text-red-600">{errors.ownerName.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="john@greenacres.com"
          className="mt-1"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+1234567890"
          className="mt-1"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Include country code (e.g., +1 for US)
        </p>
      </div>

      {/* Service Areas */}
      <div>
        <Label htmlFor="zipCode">
          Service Areas (ZIP Codes) <span className="text-red-500">*</span>
        </Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="zipCode"
            value={zipCodeInput}
            onChange={(e) => setZipCodeInput(e.target.value)}
            placeholder="12345"
            maxLength={5}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddZipCode()
              }
            }}
          />
          <Button type="button" onClick={handleAddZipCode} variant="outline">
            Add
          </Button>
        </div>
        {errors.serviceAreas && (
          <p className="mt-1 text-sm text-red-600">{errors.serviceAreas.message}</p>
        )}

        {/* Display added ZIP codes */}
        {serviceAreas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {serviceAreas.map((area) => (
              <div
                key={area.zipCode}
                className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
              >
                <span>{area.zipCode}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveZipCode(area.zipCode)}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-green-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Continue to Pricing'}
        </Button>
      </div>
    </form>
  )
}
