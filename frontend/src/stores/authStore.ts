import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
}

interface CachedCredential {
  username: string;
  hash: string;
  user: UserProfile;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<UserProfile | null>(
    localStorage.getItem('user_profile')
      ? JSON.parse(localStorage.getItem('user_profile')!)
      : null,
  );
  const authError = ref<string | null>(null);
  const authLoading = ref(false);
  const isOfflineSession = ref(false);

  // Helper to load offline cached credentials
  const getCachedCredentials = (): CachedCredential[] => {
    const raw = localStorage.getItem('hs_cached_creds');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CachedCredential[];
    } catch {
      return [];
    }
  };

  const cacheUserCredential = (username: string, pass: string, userProfile: UserProfile) => {
    const creds = getCachedCredentials();
    const hash = CryptoJS.SHA256(`${username.toLowerCase()}:${pass}`).toString();

    const existingIndex = creds.findIndex((c) => c.username === username.toLowerCase());
    const newCred: CachedCredential = {
      username: username.toLowerCase(),
      hash,
      user: userProfile,
    };

    if (existingIndex >= 0) {
      creds[existingIndex] = newCred;
    } else {
      creds.push(newCred);
    }

    localStorage.setItem('hs_cached_creds', JSON.stringify(creds));
  };

  const deriveEncryptionKey = (password: string): string => {
    // Derive a 256-bit AES key using SHA256 with salt
    const salt = user.value?.id || 'humanitysync_salt';
    return CryptoJS.SHA256(`${password}:${salt}`).toString();
  };

  const login = async (usernameInput: string, passwordInput: string): Promise<string> => {
    authLoading.value = true;
    authError.value = null;

    try {
      // 1. Try online HTTP login
      const res = await axios.post<{
        token: string;
        user: UserProfile;
      }>('/api/auth/login', {
        username: usernameInput,
        password: passwordInput,
      });

      const { token: userToken, user: userData } = res.data;

      // Set online session state
      token.value = userToken;
      user.value = userData;
      isOfflineSession.value = false;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user_profile', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

      // Cache credentials for offline fallback
      cacheUserCredential(usernameInput, passwordInput, userData);

      return deriveEncryptionKey(passwordInput);
    } catch (err: unknown) {
      // 2. Check if failure was due to network offline / unreachability
      const isNetworkError =
        axios.isAxiosError(err) && (!err.response || err.code === 'ERR_NETWORK');

      if (isNetworkError) {
        console.warn('Network unavailable. Attempting offline authentication...');
        const creds = getCachedCredentials();
        const inputHash = CryptoJS.SHA256(`${usernameInput.toLowerCase()}:${passwordInput}`).toString();
        const matched = creds.find(
          (c) => c.username === usernameInput.toLowerCase() && c.hash === inputHash,
        );

        if (matched) {
          user.value = matched.user;
          token.value = 'offline_token_' + matched.user.id;
          isOfflineSession.value = true;

          localStorage.setItem('user_profile', JSON.stringify(matched.user));
          authError.value = null;
          return deriveEncryptionKey(passwordInput);
        }
      }

      let msg = 'Authentication failed';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        msg = String(err.response.data.error);
      } else if (isNetworkError) {
        msg = 'Offline authentication failed. No cached credentials found for this user.';
      }
      authError.value = msg;
      throw new Error(msg);
    } finally {
      authLoading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    isOfflineSession.value = false;
    authError.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user_profile');
    delete axios.defaults.headers.common['Authorization'];
  };

  return {
    token,
    user,
    authError,
    authLoading,
    isOfflineSession,
    login,
    logout,
    deriveEncryptionKey,
  };
});
