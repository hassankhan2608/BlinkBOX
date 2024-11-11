import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MailService } from './mail-service';
import { toast } from 'sonner';
import { Account, Message } from './types';
import { generateEmailUsername } from './utils';

interface MailState {
  loading: boolean;
  email: string;
  messages: Message[];
  refreshing: boolean;
  mailService: MailService | null;
  token: string | null;
  accountId: string | null;
  password: string | null;
  quota: number;
  used: number;
  createdAt: string | null;
  updatedAt: string | null;
  domains: { domain: string }[];
  setLoading: (loading: boolean) => void;
  setEmail: (email: string) => void;
  setMessages: (messages: Message[]) => void;
  refreshInbox: () => Promise<void>;
  generateNewEmail: () => Promise<void>;
  createCustomEmail: (username: string, domain: string, password: string) => Promise<void>;
  initialize: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  fetchDomains: () => Promise<void>;
  updateAccountInfo: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetState: () => void;
}

const initialState = {
  loading: true,
  email: '',
  messages: [],
  refreshing: false,
  mailService: null,
  token: null,
  accountId: null,
  password: null,
  quota: 41943040,
  used: 0,
  createdAt: null,
  updatedAt: null,
  domains: [],
};

export const useMailStore = create<MailState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLoading: (loading) => set({ loading }),
      setEmail: (email) => set({ email }),
      setMessages: (messages) => set({ messages }),

      resetState: () => {
        const { mailService } = get();
        if (mailService) {
          mailService.cleanup();
        }
        set(initialState);
      },

      deleteAccount: async () => {
        const { mailService } = get();
        if (!mailService) return;

        try {
          set({ loading: true });
          await mailService.deleteAccount();
          get().resetState();
          toast.success('Account deleted successfully');
          // Immediately generate a new account
          await get().generateNewEmail();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
          toast.error(errorMessage);
          set({ loading: false });
          throw error;
        }
      },

      updateAccountInfo: async () => {
        const { mailService } = get();
        if (!mailService) return;

        try {
          const accountInfo = await mailService.getAccountInfo();
          if (accountInfo) {
            set({
              quota: accountInfo.quota,
              used: accountInfo.used,
              createdAt: accountInfo.createdAt,
              updatedAt: accountInfo.updatedAt,
            });
          }
        } catch (error) {
          console.error('Failed to update account info:', error);
        }
      },

      fetchDomains: async () => {
        try {
          const mailService = new MailService();
          const domains = await mailService.getDomains();
          set({ domains });
        } catch (error) {
          console.error('Failed to fetch domains:', error);
          throw error;
        }
      },

      createCustomEmail: async (username: string, domain: string, password: string) => {
        try {
          set({ loading: true });
          const mailService = new MailService();

          if (!username || !domain || !password) {
            throw new Error('Please fill in all fields');
          }

          if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
          }

          const account = await mailService.createAccount(username, domain, password);

          set({
            mailService,
            email: account.address,
            token: account.token,
            accountId: account.id,
            password: account.password,
            quota: account.quota,
            used: account.used,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            messages: [],
            loading: false,
          });

          toast.success('Custom email created successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create custom email';
          toast.error(errorMessage);
          set({ loading: false });
          throw error;
        }
      },

      loginWithCredentials: async (email: string, password: string) => {
        try {
          set({ loading: true });
          const mailService = new MailService();
          const { token } = await mailService.getToken(email, password);
          
          const account = await mailService.getAccountInfo();
          if (!account) {
            throw new Error('Failed to get account details');
          }
          
          set({
            mailService,
            email,
            token,
            accountId: account.id,
            password,
            quota: account.quota,
            used: account.used,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            messages: [],
            loading: false,
          });

          const messages = await mailService.getMessages();
          set({ messages });

          toast.success('Successfully logged in');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to login';
          toast.error(errorMessage);
          set({ loading: false });
          throw error;
        }
      },

      initialize: async () => {
        const state = get();
        if (state.token && state.accountId && state.email) {
          try {
            const mailService = new MailService(state.token, state.accountId);
            set({ mailService });

            const accountInfo = await mailService.getAccountInfo();
            if (!accountInfo) {
              throw new Error('Invalid token');
            }

            set({
              quota: accountInfo.quota,
              used: accountInfo.used,
              createdAt: accountInfo.createdAt,
              updatedAt: accountInfo.updatedAt,
            });

            const messages = await mailService.getMessages();
            set({ messages, loading: false });

          } catch (error) {
            console.error('Token expired or invalid, generating new email');
            await get().generateNewEmail();
          }
        } else {
          await get().generateNewEmail();
        }
      },

      refreshInbox: async () => {
        const { mailService } = get();
        if (!mailService) return;

        set({ refreshing: true });
        try {
          const messages = await mailService.getMessages();
          set({ messages });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh inbox';
          console.error('Failed to refresh inbox:', errorMessage);
        } finally {
          set({ refreshing: false });
        }
      },

      generateNewEmail: async () => {
        const currentState = get();
        if (currentState.mailService) {
          currentState.mailService.cleanup();
        }

        try {
          set({ loading: true });
          const mailService = new MailService();
          const username = generateEmailUsername();
          const account = await mailService.createAccount(username);
          
          set({
            mailService,
            email: account.address,
            token: account.token,
            accountId: account.id,
            password: account.password || null,
            quota: account.quota,
            used: account.used,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            messages: [],
            loading: false,
          });

          toast.success('New email address generated');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate new email';
          console.error('Failed to generate new email:', errorMessage);
          toast.error(errorMessage);
          set({ loading: false });
          throw error;
        }
      },
    }),
    {
      name: 'mail-storage',
      partialize: (state) => ({
        email: state.email,
        token: state.token,
        accountId: state.accountId,
        password: state.password,
        quota: state.quota,
        used: state.used,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      }),
    }
  )
);