import React, { useId, useRef, useState } from 'react';
import { contact } from '../content.js';
import { LIMITS, validateContact, validateField } from '../lib/validation.js';
import { submitContact } from '../lib/contactSubmit.js';
import { useUI } from '../hooks/useUI.js';

const EMPTY = { name: '', email: '', phone: '', message: '', website: '' };
const VISIBLE_FIELDS = ['name', 'email', 'phone', 'message'];

function Label({ htmlFor, field }) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {field.label}
      {field.required ? (
        <span className="field-mark" aria-hidden="true">{contact.requiredMark}</span>
      ) : (
        <span className="field-optional">{contact.optionalMark}</span>
      )}
    </label>
  );
}

/** Ported from suphian.com ContactForm + useContactForm; same rules, same pipeline. */
export default function ContactForm({ source, onSubmitted }) {
  const { toast } = useUI();
  const uid = useId();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const refs = { name: useRef(null), email: useRef(null), phone: useRef(null), message: useRef(null) };
  const id = (field) => `${uid}-${field}`;

  const update = (field, value) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Like react-hook-form's default: validate on submit, then re-validate as you type.
    if (attempted) setErrors((current) => ({ ...current, [field]: validateField(field, next, contact.validation) }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;
    setAttempted(true);
    const { errors: found, data } = validateContact(values, contact.validation);
    setErrors(found);
    if (!data) {
      if (found.website) {
        toast({ ...contact.toasts.blocked, tone: 'error' });
        return;
      }
      refs[VISIBLE_FIELDS.find((field) => found[field])]?.current?.focus();
      return;
    }

    setSending(true);
    try {
      const result = await submitContact(data, source);
      if (result === 'rate-limited') {
        toast({ ...contact.toasts.rateLimited, tone: 'error' });
        return;
      }
      toast(contact.toasts.success);
      setValues(EMPTY);
      setErrors({});
      setAttempted(false);
      onSubmitted?.();
    } catch (error) {
      console.error('Failed to send form submission:', error);
      toast({ ...contact.toasts.error, tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  const describe = (field) => (errors[field] ? `${id(field)}-error` : undefined);
  const error = (field) =>
    errors[field] ? (
      <p id={`${id(field)}-error`} className="field-error">{errors[field]}</p>
    ) : null;
  const { fields } = contact;

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
      <input
        className="honeypot"
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={values.website}
        onChange={(event) => update('website', event.target.value)}
      />

      <div className="field" data-invalid={errors.name ? '' : undefined}>
        <Label htmlFor={id('name')} field={fields.name} />
        <input
          ref={refs.name}
          id={id('name')}
          name="name"
          type="text"
          autoComplete="name"
          placeholder={fields.name.placeholder}
          maxLength={LIMITS.name.max}
          aria-required="true"
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={describe('name')}
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
        />
        {error('name')}
      </div>

      <div className="field" data-invalid={errors.email ? '' : undefined}>
        <Label htmlFor={id('email')} field={fields.email} />
        <input
          ref={refs.email}
          id={id('email')}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={fields.email.placeholder}
          maxLength={LIMITS.email.max}
          aria-required="true"
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={describe('email')}
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
        />
        {error('email')}
      </div>

      <div className="field" data-invalid={errors.phone ? '' : undefined}>
        <Label htmlFor={id('phone')} field={fields.phone} />
        <input
          ref={refs.phone}
          id={id('phone')}
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={fields.phone.placeholder}
          maxLength={LIMITS.phone.max}
          aria-invalid={errors.phone ? 'true' : undefined}
          aria-describedby={describe('phone')}
          value={values.phone}
          onChange={(event) => update('phone', event.target.value)}
        />
        {error('phone')}
      </div>

      <div className="field" data-invalid={errors.message ? '' : undefined}>
        <Label htmlFor={id('message')} field={fields.message} />
        <textarea
          ref={refs.message}
          id={id('message')}
          name="message"
          rows={6}
          placeholder={fields.message.placeholder}
          maxLength={LIMITS.message.max}
          aria-required="true"
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={describe('message')}
          value={values.message}
          onChange={(event) => update('message', event.target.value)}
        />
        {error('message')}
      </div>

      <button
        type="submit"
        className="button button--primary contact-submit"
        aria-disabled={sending || undefined}
      >
        {sending ? contact.sending : contact.submit}
        <span className="cta-arrow" aria-hidden="true">→</span>
      </button>
    </form>
  );
}
