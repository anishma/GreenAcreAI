'use client'

/**
 * Business Settings Page
 *
 * Allows users to update their business information including:
 * - Basic info (business name, owner, email, phone, service areas)
 * - Business hours (per day of week)
 * - Timezone
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'
import { businessInfoSchema, serviceAreaSchema } from '@/lib/validations/tenant'

// Business hours for a single day
const dayHoursSchema = z.object({
  day: z.string(),
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
})

// Combined schema for settings page
const businessSettingsSchema = businessInfoSchema.extend({
  serviceAreas: z.array(serviceAreaSchema).min(1, 'At least one service area is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  businessHours: z.array(dayHoursSchema).optional(),
})

type BusinessSettingsData = z.infer<typeof businessSettingsSchema>

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
]

export default function BusinessSettingsPage() {
  const { toast } = useToast()
  const [zipCodeInput, setZipCodeInput] = useState('')
  const [serviceAreas, setServiceAreas] = useState<Array<{ zipCode: string; city?: string; state?: string }>>([])

  // Fetch current tenant data
  const { data: tenant, isLoading } = trpc.tenant.getCurrent.useQuery()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<BusinessSettingsData>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      email: '',
      phone: '',
      serviceAreas: [],
      timezone: 'America/New_York',
      businessHours: DAYS_OF_WEEK.map((day) => ({
        day,
        isOpen: day !== 'Sunday',
        openTime: '09:00',
        closeTime: '17:00',
      })),
    },
  })

  // Mutations
  const updateBusinessInfo = trpc.tenant.updateBusinessInfo.useMutation()
  const updateServiceAreas = trpc.tenant.updateServiceAreas.useMutation()
  const updateBusinessHours = trpc.tenant.updateBusinessHours.useMutation()

  // Load tenant data into form
  useEffect(() => {
    if (tenant) {
      reset({
        businessName: tenant.business_name || '',
        ownerName: tenant.owner_name || '',
        email: tenant.email || '',
        phone: tenant.phone_number || '',
        timezone: tenant.timezone || 'America/New_York',
        serviceAreas: tenant.service_areas as any[] || [],
        businessHours: (tenant.business_hours as any[]) || DAYS_OF_WEEK.map((day) => ({
          day,
          isOpen: day !== 'Sunday',
          openTime: '09:00',
          closeTime: '17:00',
        })),
      })
      setServiceAreas((tenant.service_areas as any[]) || [])
    }
  }, [tenant, reset])

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

  const businessHours = watch('businessHours') || []

  const onSubmit = async (data: BusinessSettingsData) => {
    try {
      // Update business info
      await updateBusinessInfo.mutateAsync({
        businessName: data.businessName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        timezone: data.timezone,
      })

      // Update service areas
      await updateServiceAreas.mutateAsync(data.serviceAreas)

      // Update business hours
      if (data.businessHours) {
        await updateBusinessHours.mutateAsync(data.businessHours as any)
      }

      toast({
        title: 'Settings saved',
        description: 'Your business settings have been updated successfully.',
      })
    } catch (error) {
      console.error('Error saving business settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <p className="text-sm text-muted-foreground">
              Update your business details and contact information
            </p>
          </div>

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
            <Label htmlFor="phone">Phone</Label>
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
            <p className="mt-1 text-xs text-muted-foreground">
              Include country code (e.g., +1 for US)
            </p>
          </div>

          {/* Timezone */}
          <div>
            <Label htmlFor="timezone">
              Timezone <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('timezone')}
              onValueChange={(value) => setValue('timezone', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
            )}
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
        </div>

        <Separator />

        {/* Business Hours Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
            </h2>
            <p className="text-sm text-muted-foreground">
              Set your operating hours for each day of the week
            </p>
          </div>

          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day, index) => {
              const dayData = businessHours[index] || {
                day,
                isOpen: true,
                openTime: '09:00',
                closeTime: '17:00',
              }

              return (
                <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-28 font-medium">{day}</div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`isOpen-${day}`}
                      checked={dayData.isOpen}
                      onChange={(e) => {
                        const updated = [...businessHours]
                        updated[index] = { ...dayData, isOpen: e.target.checked }
                        setValue('businessHours', updated)
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`isOpen-${day}`} className="cursor-pointer">
                      Open
                    </Label>
                  </div>

                  {dayData.isOpen && (
                    <>
                      <Input
                        type="time"
                        value={dayData.openTime}
                        onChange={(e) => {
                          const updated = [...businessHours]
                          updated[index] = { ...dayData, openTime: e.target.value }
                          setValue('businessHours', updated)
                        }}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={dayData.closeTime}
                        onChange={(e) => {
                          const updated = [...businessHours]
                          updated[index] = { ...dayData, closeTime: e.target.value }
                          setValue('businessHours', updated)
                        }}
                        className="w-32"
                      />
                    </>
                  )}

                  {!dayData.isOpen && (
                    <span className="text-muted-foreground">Closed</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
