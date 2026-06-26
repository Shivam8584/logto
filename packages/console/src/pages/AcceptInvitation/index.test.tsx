import { useLogto } from '@logto/react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useSWR from 'swr';
import { vi } from 'vitest';

import { useCloudApi } from '@/cloud/hooks/use-cloud-api';

import AcceptInvitation from '.';

vi.mock('swr', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('@logto/react', () => ({
  useLogto: vi.fn(),
}));

const mockCloudApi = {
  get: vi.fn(),
  patch: vi.fn(),
};
const mockSilentCloudApi = {
  get: vi.fn(),
  patch: vi.fn(),
};

vi.mock('@/cloud/hooks/use-cloud-api', () => ({
  useCloudApi: vi.fn((options?: { readonly hideErrorToast?: boolean }) =>
    options?.hideErrorToast ? mockSilentCloudApi : mockCloudApi
  ),
}));

vi.mock('@/hooks/use-redirect-uri', () => ({
  __esModule: true,
  default: vi.fn(() => new URL('/callback', window.location.origin)),
}));

vi.mock('@/contexts/TenantsProvider', async () => {
  const { createContext } = await vi.importActual<typeof import('react')>('react');

  return {
    TenantsContext: createContext({
      navigateTenant: vi.fn(),
      resetTenants: vi.fn(),
    }),
  };
});

vi.mock('@/utils/storage', () => ({
  saveRedirect: vi.fn(),
}));

vi.mock('@/components/AppLoading', () => ({
  __esModule: true,
  default: () => <div>loading</div>,
}));

vi.mock('@/components/AppError', () => ({
  __esModule: true,
  default: ({ errorMessage }: { readonly errorMessage: string }) => <div>{errorMessage}</div>,
}));

vi.mock('./SwitchAccount', () => ({
  __esModule: true,
  default: () => <button type="button">switch account</button>,
}));

const mockedUseLogto = vi.mocked(useLogto);
const mockedUseCloudApi = vi.mocked(useCloudApi);
const mockedUseSWR = vi.mocked(useSWR);

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useParams: () => ({ invitationId: 'invitation-id' }),
}));

const renderAcceptInvitation = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AcceptInvitation />
    </MemoryRouter>
  );

describe('AcceptInvitation', () => {
  const requestSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLFormElement.prototype, 'requestSubmit').mockImplementation(requestSubmit);
    mockedUseLogto.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
    } as unknown as ReturnType<typeof useLogto>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the invitation details with error toast suppressed', async () => {
    mockedUseSWR.mockReturnValue({} as unknown as ReturnType<typeof useSWR>);
    mockSilentCloudApi.get.mockResolvedValue({});

    renderAcceptInvitation('/accept/invitation-id?one_time_token=one-time-token');

    const fetchInvitation = mockedUseSWR.mock.calls[0]?.[1] as () => Promise<unknown>;
    await fetchInvitation();

    expect(mockedUseCloudApi).toHaveBeenCalledWith({ hideErrorToast: true });
    expect(mockSilentCloudApi.get).toHaveBeenCalledWith('/api/invitations/:invitationId', {
      params: { invitationId: 'invitation-id' },
    });
    expect(mockCloudApi.get).not.toHaveBeenCalled();
  });

  it('starts invitation one-time-token auth for a signed-in mismatched user', async () => {
    mockedUseSWR.mockReturnValue({
      error: { status: 403 },
    } as unknown as ReturnType<typeof useSWR>);

    renderAcceptInvitation('/accept/invitation-id?one_time_token=one-time-token');

    await waitFor(() => {
      expect(requestSubmit).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole('button', { name: 'switch account' })).toBeNull();
    expect(document.querySelector('form')?.getAttribute('method')).toBe('post');
    expect(document.querySelector('form')?.getAttribute('action')).toBe(
      '/api/invitations/invitation-id/auth?one_time_token=one-time-token'
    );
  });

  it('shows the manual switch-account page for a signed-in mismatched user without one-time token', () => {
    mockedUseSWR.mockReturnValue({
      error: { status: 403 },
    } as unknown as ReturnType<typeof useSWR>);

    renderAcceptInvitation('/accept/invitation-id');

    expect(requestSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'switch account' })).toBeTruthy();
  });
});
