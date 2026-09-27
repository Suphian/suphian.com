import { LIVE, getSupabase } from './backend.js';
import { checkRateLimit, getClientIdentifier } from './rateLimit.js';

const ACTION = 'contact_form';
const MAX_ATTEMPTS = 3;
const WINDOW_MINUTES = 60;
const SUBJECT = 'Contact Form Submission';

async function notify(supabase, body) {
  try {
    const { error } = await supabase.functions.invoke('notify-contact-submit', { body });
    if (error) console.warn('Email notification failed but form submitted:', error);
  } catch (error) {
    console.warn('Email notification failed but form submitted:', error);
  }
}

/**
 * Same order as suphian.com useContactForm: rate limit, insert, then email.
 * Resolves 'sent' or 'rate-limited'; rejects when the insert fails.
 * `data` is the sanitized payload from validateContact().
 */
export async function submitContact(data, source) {
  const rateLimit = {
    p_identifier: getClientIdentifier(),
    p_action: ACTION,
    p_max_attempts: MAX_ATTEMPTS,
    p_window_minutes: WINDOW_MINUTES,
  };
  const row = {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    subject: SUBJECT,
    message: data.message,
  };
  const email = { ...data, source, subject: SUBJECT };

  if (!LIVE) {
    console.group('%c[dry-run] contact form: no network calls were made', 'color:#ed2921;font-weight:bold');
    console.info("1. supabase.rpc('check_rate_limit', …)", rateLimit);
    console.info("2. supabase.from('contact_submissions').insert([…])", [row]);
    console.info("3. supabase.functions.invoke('notify-contact-submit', { body })", email);
    console.info('Set VITE_LIVE_BACKEND=true to send for real.');
    console.groupEnd();
    await new Promise((resolve) => setTimeout(resolve, 500));
    return 'sent';
  }

  const supabase = await getSupabase();
  const allowed = await checkRateLimit(
    supabase,
    rateLimit.p_identifier,
    ACTION,
    MAX_ATTEMPTS,
    WINDOW_MINUTES,
  );
  if (!allowed) return 'rate-limited';

  const { error } = await supabase.from('contact_submissions').insert([row]);
  if (error) throw error;

  // An email failure never fails the submit: the row is already saved.
  await notify(supabase, email);
  return 'sent';
}
