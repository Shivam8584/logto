import { render } from '@testing-library/react';

import SocialSignIn from './SocialSignIn';
import useSocialSignInListener from './use-social-sign-in-listener';

jest.mock('./use-social-sign-in-listener', () => jest.fn());

const mockUseSocialSignInListener = useSocialSignInListener as jest.Mock;

const invalidSessionText = 'Session not found. Please go back and sign in again.';

/**
 * Regression guard for the "Session not found" flash during social sign-in.
 *
 * The callback page must NOT render an error screen in its finished (non-loading) state:
 * a finished callback is a SUCCESS handoff (the listener navigates away / shows a toast),
 * not an error. Rendering `<ErrorPage title="error.invalid_session" />` there used to leak
 * "Session not found" through the translucent loading/toast overlay during the transition
 * (most visibly right before the MFA OTP screen). Upstream renders `null`; keep it that way.
 */
describe('SocialSignIn finished-state rendering', () => {
  afterEach(() => {
    mockUseSocialSignInListener.mockReset();
  });

  it('renders a loading layer while the callback is in flight', () => {
    mockUseSocialSignInListener.mockReturnValue({ loading: true });

    const { container } = render(<SocialSignIn connectorId="google" />);

    // The loading layer is present, and no "Session not found" error leaks.
    expect(container.firstChild).not.toBeNull();
    expect(container.textContent).not.toContain(invalidSessionText);
  });

  it('renders NOTHING (not an error page) once the callback finishes', () => {
    mockUseSocialSignInListener.mockReturnValue({ loading: false });

    const { container } = render(<SocialSignIn connectorId="google" />);

    // Finished callback === success handoff: render nothing so the in-flight navigation
    // (e.g. to MFA verification) or toast takes over. An ErrorPage here would flash
    // "Session not found" behind the overlay — the regression this test guards.
    expect(container.firstChild).toBeNull();
    expect(container.textContent).toBe('');
  });
});
