export interface AuthSession { userId: string; email: string; provider: 'apple' | 'google' | 'magic_link' }
/** Real impl: expo-apple-authentication, Google Sign-In, and an emailed magic link exchanged for a session by the backend. */
export interface AuthService {
  signIn(provider: AuthSession['provider'], email?: string): Promise<AuthSession>;
  signOut(): Promise<void>;
}
export class MockAuthService implements AuthService {
  async signIn(provider: AuthSession['provider'], email = 'guest@example.com') { return { userId: 'mock-user', email, provider }; }
  async signOut() {}
}
export const authService: AuthService = new MockAuthService();
