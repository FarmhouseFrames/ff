import { publicSupabase } from './supabasePublic.js';

const DEFAULT_COUNTRY = 'United States';

function readString(value) {
  return String(value || '').trim();
}

export function normalizeCustomerProfile(metadata = {}) {
  const firstName = readString(metadata.first_name || metadata.firstName);
  const lastName = readString(metadata.last_name || metadata.lastName);
  const fullName = readString(metadata.full_name || metadata.fullName || [firstName, lastName].filter(Boolean).join(' '));

  return {
    firstName,
    lastName,
    fullName,
    dateOfBirth: readString(metadata.date_of_birth || metadata.dateOfBirth).slice(0, 10),
    phone: readString(metadata.phone),
    addressLine1: readString(metadata.address_line_1 || metadata.addressLine1),
    addressLine2: readString(metadata.address_line_2 || metadata.addressLine2),
    city: readString(metadata.city),
    stateRegion: readString(metadata.state_region || metadata.stateRegion),
    postalCode: readString(metadata.postal_code || metadata.postalCode),
    country: readString(metadata.country) || DEFAULT_COUNTRY,
    preferredFulfillment: readString(metadata.preferred_fulfillment || metadata.preferredFulfillment) || 'Pickup',
    savedNotes: readString(metadata.saved_notes || metadata.savedNotes)
  };
}

export function profileToUserMetadata(values = {}) {
  const profile = normalizeCustomerProfile(values);
  const fullName = readString(profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' '));

  return {
    first_name: profile.firstName,
    last_name: profile.lastName,
    full_name: fullName,
    date_of_birth: profile.dateOfBirth,
    phone: profile.phone,
    address_line_1: profile.addressLine1,
    address_line_2: profile.addressLine2,
    city: profile.city,
    state_region: profile.stateRegion,
    postal_code: profile.postalCode,
    country: profile.country || DEFAULT_COUNTRY,
    preferred_fulfillment: profile.preferredFulfillment || 'Pickup',
    saved_notes: profile.savedNotes
  };
}

export function formatProfileName(profile = {}) {
  return readString(profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' '));
}

export function formatMailingAddress(profile = {}) {
  const normalized = normalizeCustomerProfile(profile);
  const cityLine = [normalized.city, normalized.stateRegion, normalized.postalCode].filter(Boolean).join(', ');
  return [normalized.addressLine1, normalized.addressLine2, cityLine, normalized.country].filter(Boolean).join('\n');
}

export function hasMailingAddress(profile = {}) {
  const normalized = normalizeCustomerProfile(profile);
  return Boolean(normalized.addressLine1 && normalized.city && normalized.stateRegion && normalized.postalCode);
}

export async function getSignedInCustomerAccount() {
  const { data, error } = await publicSupabase.auth.getSession();

  if (error) {
    throw error;
  }

  const user = data.session?.user || null;

  return {
    user,
    profile: normalizeCustomerProfile(user?.user_metadata || {})
  };
}