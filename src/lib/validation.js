import { sanitizeInput } from './sanitize.js';

// Same rules as suphian.com features/contact/hooks/contactFormSchema.ts.
export const LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 160 },
  phone: { max: 48 },
  message: { min: 10, max: 2500 },
};

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
// Checked after stripping common formatting (spaces, dashes, parens, dots).
const PHONE = /^[+]?[1-9][\d]{0,15}$/;
const PHONE_FORMATTING = /[\s().-]/g;

export const FIELDS = ['name', 'email', 'phone', 'message', 'website'];

function fieldError(field, value, messages) {
  const v = value ?? '';
  switch (field) {
    case 'name':
      if (v.length < LIMITS.name.min) return messages.nameMin;
      if (v.length > LIMITS.name.max) return messages.nameMax;
      return null;
    case 'email':
      if (!EMAIL.test(v)) return messages.emailInvalid;
      if (v.length > LIMITS.email.max) return messages.emailMax;
      return null;
    case 'phone': {
      if (v.length > LIMITS.phone.max) return messages.phoneMax;
      const digits = v.replace(PHONE_FORMATTING, '');
      if (digits !== '' && !PHONE.test(digits)) return messages.phoneInvalid;
      return null;
    }
    case 'message':
      if (v.length < LIMITS.message.min) return messages.messageMin;
      if (v.length > LIMITS.message.max) return messages.messageMax;
      return null;
    case 'website':
      return v.length > 0 ? messages.bot : null;
    default:
      return null;
  }
}

export function validateField(field, values, messages) {
  return fieldError(field, values[field], messages);
}

/** Returns { errors, data }: data is the sanitized payload, null when invalid. */
export function validateContact(values, messages) {
  const errors = {};
  for (const field of FIELDS) {
    const error = fieldError(field, values[field], messages);
    if (error) errors[field] = error;
  }
  if (Object.keys(errors).length) return { errors, data: null };
  return {
    errors,
    data: {
      name: sanitizeInput(values.name, LIMITS.name.max),
      email: values.email,
      phone: (values.phone ?? '').replace(PHONE_FORMATTING, ''),
      message: sanitizeInput(values.message, LIMITS.message.max),
    },
  };
}
