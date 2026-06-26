import { MfaFactor, VerificationType } from '@logto/schemas';

import { mfaErrorDataGuard, verificationIdsMapGuard } from './guard';

describe('guard', () => {
  it.each(Object.values(VerificationType))('verificationIdsMapGuard: %s', (type) => {
    expect(() => {
      verificationIdsMapGuard.parse({ [type]: 'verificationId' });
    }).not.toThrow();
  });

  it('should throw with invalid key', () => {
    expect(() => {
      verificationIdsMapGuard.parse({ invalidKey: 'verificationId' });
    }).toThrow();
  });

  it('should successfully parse the value', () => {
    const record = {
      [VerificationType.EmailVerificationCode]: 'verificationId',
      [VerificationType.PhoneVerificationCode]: 'verificationId',
      [VerificationType.Social]: 'verificationId',
    };

    const { error, data: value } = verificationIdsMapGuard.safeParse(record);

    expect(error).toBeUndefined();
    expect(value).toEqual(record);
  });

  it('mfaErrorDataGuard should accept passkey suggestion metadata', () => {
    expect(() => {
      mfaErrorDataGuard.parse({
        availableFactors: [MfaFactor.TOTP, MfaFactor.EmailVerificationCode],
        skippable: true,
        suggestion: true,
        isWebAuthnUsedAsSignInPasskey: true,
      });
    }).not.toThrow();
  });
});
