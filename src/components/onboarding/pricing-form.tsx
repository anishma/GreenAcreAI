'use client'

/**
 * Pricing Form Component
 *
 * Form for configuring pricing tiers during onboarding.
 * Includes: tier editor, add/remove tiers, generic quote settings.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'
import { pricingConfigSchema } from '@/lib/validations/tenant'

type PricingFormData = z.infer<typeof pricingConfigSchema>

// Default pricing tiers template
const DEFAULT_TIERS = [
  { minSqft: 0, maxSqft: 5000, weeklyPrice: 25, biweeklyPrice: 35, monthlyPrice: 100 },
  { minSqft: 5000, maxSqft: 10000, weeklyPrice: 35, biweeklyPrice: 45, monthlyPrice: 140 },
  { minSqft: 10000, maxSqft: 15000, weeklyPrice: 45, biweeklyPrice: 55, monthlyPrice: 180 },
  { minSqft: 15000, maxSqft: undefined, weeklyPrice: 55, biweeklyPrice: 65, monthlyPrice: 220 },
]

export function PricingForm() {
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingConfigSchema),
    defaultValues: {
      tiers: DEFAULT_TIERS,
      allowsGenericQuotes: true,
      genericQuoteDisclaimer: 'Prices vary by property size. Address needed for exact quote.',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tiers',
  })

  // Mutations
  const updatePricing = trpc.tenant.updatePricing.useMutation()
  const completeOnboardingStep = trpc.tenant.completeOnboardingStep.useMutation()

  // Watch allowsGenericQuotes to conditionally show disclaimer
  const allowsGenericQuotes = watch('allowsGenericQuotes')

  const handleAddTier = () => {
    const lastTier = fields[fields.length - 1]
    const newMinSqft = lastTier?.maxSqft || 0

    append({
      minSqft: newMinSqft,
      maxSqft: newMinSqft + 5000,
      weeklyPrice: 0,
      biweeklyPrice: 0,
      monthlyPrice: 0,
    })
  }

  const handleRemoveTier = (index: number) => {
    if (fields.length <= 1) {
      toast({
        title: 'Cannot remove',
        description: 'You must have at least one pricing tier',
        variant: 'destructive',
      })
      return
    }
    remove(index)
  }

  const onSubmit = async (data: PricingFormData) => {
    try {
      // Update pricing configuration
      await updatePricing.mutateAsync(data)

      // Mark this step as complete
      await completeOnboardingStep.mutateAsync({ step: 'pricing' })

      toast({
        title: 'Pricing configuration saved',
        description: 'Moving to calendar integration...',
      })

      // Navigate to step 3
      router.push('/step-3-calendar')
    } catch (error) {
      console.error('Error saving pricing:', error)
      toast({
        title: 'Error',
        description: 'Failed to save pricing configuration. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Pricing Tiers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label className="text-lg font-semibold">
              Pricing Tiers <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-600">
              Define pricing based on lawn size (square feet)
            </p>
          </div>
          <Button type="button" onClick={handleAddTier} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Tier
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border rounded-lg p-4 bg-gray-50 relative"
            >
              {/* Remove button */}
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTier(index)}
                  className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Min Square Feet */}
                <div>
                  <Label htmlFor={`tiers.${index}.minSqft`} className="text-sm">
                    Min Sq Ft
                  </Label>
                  <Input
                    id={`tiers.${index}.minSqft`}
                    type="number"
                    {...register(`tiers.${index}.minSqft`, { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.tiers?.[index]?.minSqft && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.tiers[index]?.minSqft?.message}
                    </p>
                  )}
                </div>

                {/* Max Square Feet */}
                <div>
                  <Label htmlFor={`tiers.${index}.maxSqft`} className="text-sm">
                    Max Sq Ft
                  </Label>
                  <Input
                    id={`tiers.${index}.maxSqft`}
                    type="number"
                    {...register(`tiers.${index}.maxSqft`, {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === '' || v === undefined ? undefined : Number(v)),
                    })}
                    placeholder="No limit"
                    className="mt-1"
                  />
                  {errors.tiers?.[index]?.maxSqft && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.tiers[index]?.maxSqft?.message}
                    </p>
                  )}
                </div>

                {/* Weekly Price */}
                <div>
                  <Label htmlFor={`tiers.${index}.weeklyPrice`} className="text-sm">
                    Weekly ($)
                  </Label>
                  <Input
                    id={`tiers.${index}.weeklyPrice`}
                    type="number"
                    step="0.01"
                    {...register(`tiers.${index}.weeklyPrice`, { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.tiers?.[index]?.weeklyPrice && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.tiers[index]?.weeklyPrice?.message}
                    </p>
                  )}
                </div>

                {/* Biweekly Price */}
                <div>
                  <Label htmlFor={`tiers.${index}.biweeklyPrice`} className="text-sm">
                    Biweekly ($)
                  </Label>
                  <Input
                    id={`tiers.${index}.biweeklyPrice`}
                    type="number"
                    step="0.01"
                    {...register(`tiers.${index}.biweeklyPrice`, { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.tiers?.[index]?.biweeklyPrice && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.tiers[index]?.biweeklyPrice?.message}
                    </p>
                  )}
                </div>

                {/* Monthly Price */}
                <div>
                  <Label htmlFor={`tiers.${index}.monthlyPrice`} className="text-sm">
                    Monthly ($)
                  </Label>
                  <Input
                    id={`tiers.${index}.monthlyPrice`}
                    type="number"
                    step="0.01"
                    {...register(`tiers.${index}.monthlyPrice`, {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === '' || v === undefined ? undefined : Number(v)),
                    })}
                    placeholder="Optional"
                    className="mt-1"
                  />
                  {errors.tiers?.[index]?.monthlyPrice && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.tiers[index]?.monthlyPrice?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.tiers && typeof errors.tiers.message === 'string' && (
          <p className="mt-2 text-sm text-red-600">{errors.tiers.message}</p>
        )}
      </div>

      {/* Generic Quotes Toggle */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="allowsGenericQuotes" className="text-base font-medium">
              Allow generic quotes without address
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Enable this to provide price ranges when callers don't have an address ready
            </p>
          </div>
          <Switch
            id="allowsGenericQuotes"
            checked={allowsGenericQuotes}
            onCheckedChange={(checked) => setValue('allowsGenericQuotes', checked)}
          />
        </div>

        {/* Generic Quote Disclaimer */}
        {allowsGenericQuotes && (
          <div className="mt-4">
            <Label htmlFor="genericQuoteDisclaimer">Generic Quote Disclaimer</Label>
            <Textarea
              id="genericQuoteDisclaimer"
              {...register('genericQuoteDisclaimer')}
              placeholder="Prices vary by property size. Address needed for exact quote."
              className="mt-1"
              rows={3}
            />
            {errors.genericQuoteDisclaimer && (
              <p className="mt-1 text-sm text-red-600">
                {errors.genericQuoteDisclaimer.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This message will be shared with callers who request quotes without providing an address
            </p>
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/step-1-business')}
        >
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Continue to Calendar'}
        </Button>
      </div>
    </form>
  )
}
