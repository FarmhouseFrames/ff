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

function profileToDbRow(userId, values = {}) {
  const profile = normalizeCustomerProfile(values);
  const fullName = readString(profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' '));

  return {
    user_id: userId,
    first_name: profile.firstName,
    last_name: profile.lastName,
    full_name: fullName,
    date_of_birth: profile.dateOfBirth || null,
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

function looksLikeMissingTableError(error) {
  if (!error) {
    return false;
  }

  const message = String(error.message || '').toLowerCase();
  return message.includes('customer_profiles') || message.includes('does not exist') || message.includes('relation');
}

export async function getSignedInCustomerAccount() {
  const { data, error } = await publicSupabase.auth.getSession();

  if (error) {
    throw error;
  }

  const user = data.session?.user || null;
  const metadataProfile = normalizeCustomerProfile(user?.user_metadata || {});

  if (!user) {
    return {
      user,
      profile: metadataProfile
    };
  }

  const { data: dbProfile, error: dbError } = await publicSupabase
    .from('customer_profiles')
    .select('first_name,last_name,full_name,date_of_birth,phone,address_line_1,address_line_2,city,state_region,postal_code,country,preferred_fulfillment,saved_notes')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!dbError && dbProfile) {
    return {
      user,
      profile: normalizeCustomerProfile(dbProfile)
    };
  }

  if (!dbError && !dbProfile) {
    const hasMetadataValues = Object.values(metadataProfile).some((value) => readString(value).length > 0);

    if (hasMetadataValues) {
      try {
        await publicSupabase
          .from('customer_profiles')
          .upsert(profileToDbRow(user.id, metadataProfile), { onConflict: 'user_id' });
      } catch {
        // Keep storefront usable even if profile sync fails.
      }
    }
  }

  if (dbError && !looksLikeMissingTableError(dbError)) {
    throw dbError;
  }

  return {
    user,
    profile: metadataProfile
  };
}

export async function saveCustomerProfile(userId, values = {}) {
  if (!userId) {
    throw new Error('Cannot save customer profile without a signed-in user.');
  }

  const dbRow = profileToDbRow(userId, values);
  const metadata = profileToUserMetadata(values);

  const { error: dbError } = await publicSupabase
    .from('customer_profiles')
    .upsert(dbRow, { onConflict: 'user_id' });

  if (dbError && !looksLikeMissingTableError(dbError)) {
    throw dbError;
  }

  const { data, error } = await publicSupabase.auth.updateUser({ data: metadata });
  if (error) {
    throw error;
  }

  return {
    user: data.user,
    profile: normalizeCustomerProfile(metadata)
  };
}