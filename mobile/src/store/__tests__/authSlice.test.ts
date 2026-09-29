import { authApi } from '@/api/auth.api';
import { hasRefreshToken } from '@/api/tokenStorage';
import { useAuthStore } from '@/store/authSlice';

jest.mock('@/api/auth.api', () => ({
  authApi: { getMe: jest.fn() },
}));

jest.mock('@/api/tokenStorage', () => ({
  hasRefreshToken: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
}));

jest.mock('@/api/client', () => ({
  setAuthClientListener: jest.fn(),
}));

const mockedGetMe = authApi.getMe as jest.Mock;
const mockedHasToken = hasRefreshToken as jest.Mock;

const httpError = (status: number) => Object.assign(new Error('Request failed'), { response: { status } });
/** What axios rejects with when nothing ever answered: no timeout, refused, DNS. */
const networkError = () => Object.assign(new Error('Network Error'), { request: {} });

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, status: 'idle', bootError: false });
});

describe('hydrate', () => {
  it('signs in when a stored session is still valid', async () => {
    mockedHasToken.mockResolvedValue(true);
    mockedGetMe.mockResolvedValue({ data: { data: { _id: 'u1', name: 'Priya' } } });

    await useAuthStore.getState().hydrate();

    const { status, user, bootError } = useAuthStore.getState();
    expect(status).toBe('authenticated');
    expect(user?.name).toBe('Priya');
    expect(bootError).toBe(false);
  });

  it('reports no session when there is no refresh token, without asking the server', async () => {
    mockedHasToken.mockResolvedValue(false);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(mockedGetMe).not.toHaveBeenCalled();
  });

  it('flips to a retryable boot error when the server cannot be reached', async () => {
    mockedHasToken.mockResolvedValue(true);
    mockedGetMe.mockRejectedValue(networkError());

    await useAuthStore.getState().hydrate();

    const { status, bootError } = useAuthStore.getState();
    expect(bootError).toBe(true);
    // Deliberately still 'hydrating': this is "we do not know yet", not
    // "signed out". Sending it to the login screen is what this fixes.
    expect(status).toBe('hydrating');
  });

  it('treats a real HTTP error as signed out, not as a network problem', async () => {
    mockedHasToken.mockResolvedValue(true);
    mockedGetMe.mockRejectedValue(httpError(401));

    await useAuthStore.getState().hydrate();

    const { status, bootError } = useAuthStore.getState();
    expect(status).toBe('unauthenticated');
    expect(bootError).toBe(false);
  });

  it('clears a previous boot error once a retry succeeds', async () => {
    mockedHasToken.mockResolvedValue(true);
    mockedGetMe.mockRejectedValueOnce(networkError());
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().bootError).toBe(true);

    mockedGetMe.mockResolvedValue({ data: { data: { _id: 'u1', name: 'Priya' } } });
    await useAuthStore.getState().hydrate();

    const { status, bootError } = useAuthStore.getState();
    expect(status).toBe('authenticated');
    expect(bootError).toBe(false);
  });
});
