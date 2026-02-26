import { describe, it, expect } from 'vitest'
import { buildCheckoutProfileUpdate } from '../useCheckout'

describe('buildCheckoutProfileUpdate', () => {
  it('persists full name from checkout form after order submit', () => {
    const result = buildCheckoutProfileUpdate(
      {
        firstName: 'Jan',
        lastName: 'Kowalski',
        phone: '500600700',
      },
      false
    )

    expect(result).toEqual({
      name: 'Jan Kowalski',
    })
  })

  it('includes phone only when user opted to save it', () => {
    const result = buildCheckoutProfileUpdate(
      {
        firstName: 'Jan',
        lastName: 'Kowalski',
        phone: '500600700',
      },
      true
    )

    expect(result).toEqual({
      name: 'Jan Kowalski',
      phone: '500600700',
    })
  })

  it('trims checkout name parts before persisting', () => {
    const result = buildCheckoutProfileUpdate(
      {
        firstName: '  Jan  ',
        lastName: '  Kowalski ',
        phone: '500600700',
      },
      false
    )

    expect(result.name).toBe('Jan Kowalski')
  })
})
