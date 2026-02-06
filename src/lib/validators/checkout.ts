import { z } from 'zod'

// Dane kontaktowe (wymagane dla obu typów: pickup i delivery)
export const contactSchema = z.object({
    firstName: z.string().min(2, 'Imię jest zbyt krótkie'),
    lastName: z.string().min(2, 'Nazwisko jest zbyt krótkie'),
    email: z.string().email('Nieprawidłowy adres email'),
    phone: z.string().regex(/^\d{9}$/, 'Numer telefonu musi mieć 9 cyfr'),
})

export type ContactFormData = z.infer<typeof contactSchema>

// Pola adresowe (tylko dla delivery)
export const addressFieldsSchema = z.object({
    street: z.string().min(3, 'Podaj nazwę ulicy'),
    houseNumber: z.string().min(1, 'Podaj numer domu'),
    apartmentNumber: z.string().optional(),
    postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Format kodu pocztowego: 00-000'),
    city: z.string().min(2, 'Podaj nazwę miasta'),
    notes: z.string().optional(),
})

// Pełny adres = kontakt + pola adresowe
export const addressSchema = contactSchema.merge(addressFieldsSchema)

export type AddressFormData = z.infer<typeof addressSchema>

export const deliverySchema = z.object({
    type: z.enum(['delivery', 'pickup']),
    time: z.enum(['asap', 'scheduled']),
    scheduledTime: z.string().optional(),
})

export type DeliveryFormData = z.infer<typeof deliverySchema>

export const paymentSchema = z.object({
    method: z.enum(['blik', 'card', 'google_pay', 'apple_pay', 'cash']),
})

export type PaymentFormData = z.infer<typeof paymentSchema>
