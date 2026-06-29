import {
  CustomProfileFieldType,
  InteractionEvent,
  MfaFactor,
  MissingProfile,
  SignInIdentifier,
  type SsoConnectorMetadata,
  SupportedDateFormat,
  VerificationType,
} from '@logto/schemas';
import { z } from 'zod';

import { type IdentifierInputValue } from '@/shared/components/InputFields/SmartInputField';

import { UserFlow } from '.';

export const userFlowGuard = z.enum([
  UserFlow.SignIn,
  UserFlow.Register,
  UserFlow.ForgotPassword,
  UserFlow.Continue,
]);

/* Social Flow Guard */
const registeredSocialIdentity = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .optional();

export const missingProfileErrorDataGuard = z.object({
  missingProfile: z.array(
    z.union([
      z.literal(MissingProfile.password),
      z.literal(MissingProfile.email),
      z.literal(MissingProfile.phone),
      z.literal(MissingProfile.username),
      z.literal(MissingProfile.emailOrPhone),
      z.literal(MissingProfile.extraProfile),
    ])
  ),
  registeredSocialIdentity,
});

export const registeredSocialIdentityStateGuard = z.looseObject({
  registeredSocialIdentity,
});

export const socialAccountNotExistErrorDataGuard = z.object({
  relatedUser: z.object({
    type: z.union([z.literal('email'), z.literal('phone')]),
    value: z.string(),
  }),
});

export type SocialRelatedUserInfo = z.infer<
  typeof socialAccountNotExistErrorDataGuard
>['relatedUser'];

/* Mfa */
const mfaFactorsGuard = z.array(
  z.union([
    z.literal(MfaFactor.TOTP),
    z.literal(MfaFactor.WebAuthn),
    z.literal(MfaFactor.BackupCode),
    z.literal(MfaFactor.EmailVerificationCode),
    z.literal(MfaFactor.PhoneVerificationCode),
  ])
);

const mfaFactorEnumValues = [
  MfaFactor.EmailVerificationCode,
  MfaFactor.PhoneVerificationCode,
] as const;

export const mfaErrorDataGuard = z.object({
  availableFactors: mfaFactorsGuard,
  skippable: z.boolean().optional(),
  // `z.record(z.enum(...))` is EXHAUSTIVE in zod v4 (requires every enum key), but the
  // backend only sends the masked identifier for the enrolled factor(s). Use `partialRecord`
  // so a single-factor payload (e.g. phone-only) still parses. See git f719dc1a9: the original
  // `s.record(s.enums(...))` was partial; the s.*->z.* migration silently changed the semantics.
  maskedIdentifiers: z.partialRecord(z.enum(mfaFactorEnumValues), z.string()).optional(),
  // Whether this MFA flow is an optional suggestion (e.g., add another factor after sign-up)
  suggestion: z.boolean().optional(),
  // Whether the current WebAuthn factor is used as a sign-in passkey.
  isWebAuthnUsedAsSignInPasskey: z.boolean().optional(),
});

export const mfaFlowStateGuard = mfaErrorDataGuard;

export type MfaFlowState = z.infer<typeof mfaFlowStateGuard>;

export const totpBindingStateGuard = z.object({
  secret: z.string(),
  secretQrCode: z.string(),
  ...mfaFlowStateGuard.shape,
});

export type TotpBindingState = z.infer<typeof totpBindingStateGuard>;

export const backupCodeBindingStateGuard = z.object({
  codes: z.array(z.string()),
});

export type BackupCodeBindingState = z.infer<typeof backupCodeBindingStateGuard>;

export const webAuthnStateGuard = z.object({
  options: z.record(z.string(), z.unknown()),
  ...mfaFlowStateGuard.shape,
});

export type WebAuthnState = z.infer<typeof webAuthnStateGuard>;

/* Single Sign On */
export const ssoConnectorMetadataGuard = z.object({
  id: z.string(),
  logo: z.string(),
  darkLogo: z.string().optional(),
  connectorName: z.string(),
}) satisfies z.ZodType<SsoConnectorMetadata>;

const identifierEnumGuard = z.enum([
  SignInIdentifier.Email,
  SignInIdentifier.Phone,
  SignInIdentifier.Username,
]);
/**
 * Defines the type guard for user identifier input value caching.
 *
 * Purpose:
 * - Used in conjunction with the HiddenIdentifierInput component to assist
 * password managers in associating the correct identifier with passwords.
 *
 * - Cache the identifier so that when the user returns from the verification
 *  page or the password page, the identifier they entered will not be cleared.
 */
export const identifierInputValueGuard = z.object({
  type: identifierEnumGuard.optional(),
  value: z.string(),
}) satisfies z.ZodType<IdentifierInputValue>;

/**
 * Type guard for the `identifier` search param config on the identifier sign-in/register page.
 */
export const identifierSearchParamGuard = z.array(identifierEnumGuard);

/* Identifier-based passkey sign-in state - only contains WebAuthn options.
 * Identifier and available methods are read from UserInteractionContext and useSieMethods(). */
export const identifierPasskeyStateGuard = z.object({
  options: z.record(z.string(), z.unknown()),
});

export type IdentifierPasskeyState = z.infer<typeof identifierPasskeyStateGuard>;

// eslint-disable-next-line no-restricted-syntax -- Object.fromEntries can not infer the key type
const mapGuard = Object.fromEntries(
  Object.values(VerificationType).map((type) => [type, z.string()])
) as { [key in VerificationType]: z.ZodString };

/**
 * Defines the type guard for the verification ids map.
 */
// `strictObject` rejects unknown keys (matching the previous superstruct behavior): the map may
// only contain known `VerificationType` keys, all optional.
export const verificationIdsMapGuard = z.strictObject(mapGuard).partial();
export type VerificationIdsMap = z.infer<typeof verificationIdsMapGuard>;

/**
 * Define the interaction event state guard.
 *
 * This is used to pass the current interaction event state to the continue flow page.
 *
 * - If is in the sign in flow, directly call the submitInteraction endpoint after the user completes the profile.
 * - If is in the register flow, we need to call the identify endpoint first after the user completes the profile.
 */
export const continueFlowStateGuard = z.object({
  interactionEvent: z.enum([InteractionEvent.SignIn, InteractionEvent.Register]),
});

export type InteractionFlowState = z.infer<typeof continueFlowStateGuard>;

export const extraProfileFieldNamesGuard = z.union([
  z.literal('name'),
  z.literal('avatar'),
  z.literal('givenName'),
  z.literal('familyName'),
  z.literal('middleName'),
  z.literal('nickname'),
  z.literal('preferredUsername'),
  z.literal('profile'),
  z.literal('website'),
  z.literal('gender'),
  z.literal('birthdate'),
  z.literal('zoneinfo'),
  z.literal('locale'),
  z.literal('fullname'),
  z.literal('address.formatted'),
  z.literal('address.streetAddress'),
  z.literal('address.locality'),
  z.literal('address.region'),
  z.literal('address.postalCode'),
  z.literal('address.country'),
]);

export const addressFieldValueGuard = z
  .object({
    formatted: z.string().optional(),
    streetAddress: z.string().optional(),
    locality: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  })
  .optional();

const profileFieldTypeGuard = z.enum(Object.values(CustomProfileFieldType));

const dateFormatEnumGuard = z.enum(Object.values(SupportedDateFormat));

export const dateFieldConfigGuard = z.object({
  format: dateFormatEnumGuard,
  placeholder: z.string().optional(),
  customFormat: z.string().optional(),
});

const baseConfigPartGuard = z.object({
  enabled: z.boolean(),
  type: profileFieldTypeGuard,
  label: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean(),
  config: z
    .object({
      placeholder: z.string().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      options: z.array(z.object({ value: z.string(), label: z.string().optional() })).optional(),
      format: z.string().optional(),
      customFormat: z.string().optional(),
      defaultValue: z.string().optional(),
    })
    .optional(),
});

export const addressFieldConfigGuard = z.object({
  parts: z.array(
    z.object({
      ...baseConfigPartGuard.shape,
      name: z.union([
        z.literal('streetAddress'),
        z.literal('locality'),
        z.literal('region'),
        z.literal('postalCode'),
        z.literal('country'),
        z.literal('formatted'),
      ]),
    })
  ),
});

export const fullnameFieldValueGuard = z
  .object({
    givenName: z.string().optional(),
    middleName: z.string().optional(),
    familyName: z.string().optional(),
  })
  .optional();

export const fullnameFieldConfigGuard = z.object({
  parts: z.array(
    z.object({
      ...baseConfigPartGuard.shape,
      name: z.union([z.literal('givenName'), z.literal('middleName'), z.literal('familyName')]),
    })
  ),
});
