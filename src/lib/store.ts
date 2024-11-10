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
}

export const useMailStore = create<MailState>()(
  persist(
    (set, get) => ({
      loading: true,
      email: '',
      messages: [],
      refreshing: false,
      mailService: null,
      token: null,
      accountId: null,
      password: null,
      domains: [],

      setLoading: (loading) => set({ loading }),
      setEmail: (email) => set({ email }),
      setMessages: (messages) => set({ messages }),

      fetchDomains: async () => {
        try {
          const mailService = new MailService();
          const domains = await mailService.getDomains();
          set({ domains });
        } catch (error) {
          console.error('Failed to fetch domains:', error);
        }
      },

      createCustomEmail: async (username: string, domain: string, password: string) => {
        try {
          set({ loading: true });
          const mailService = new MailService();

          // Validate inputs
          if (!username || !domain || !password) {
            throw new Error('Please fill in all fields');
          }

          if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
          }

          // Create account with custom details
          const account = await mailService.createAccount(username, domain, password);

          set({
            mailService,
            email: account.address,
            token: account.token,
            accountId: account.id,
            password: account.password,
            messages: [],
            loading: false,
          });

          // Start listening for new messages
          mailService.listenForMessages(account.id, account.token, (message) => {
            set((state) => ({
              messages: [message, ...state.messages],
            }));
          });

          toast.success('Custom email created successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create custom email';
          toast.error(errorMessage);
          set({ loading: false });
          throw error; // Re-throw to handle in the component
        }
      },

      loginWithCredentials: async (email: string, password: string) => {
        try {
          set({ loading: true });
          const mailService = new MailService();
          const { token } = await mailService.getToken(email, password);
          
          // Get account details
          const accountResponse = await fetch(`${mailService.API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (!accountResponse.ok) {
            throw new Error('Failed to get account details');
          }
          
          const account = await accountResponse.json();
          
          set({
            mailService,
            email,
            token,
            accountId: account.id,
            password,
            messages: [],
            loading: false,
          });

          // Start listening for new messages
          mailService.listenForMessages(account.id, token, (message) => {
            set((state) => ({
              messages: [message, ...state.messages],
            }));
          });

          // Fetch initial messages
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

            // Verify token is still valid by attempting to fetch messages
            await mailService.getMessages();

            // Start listening for new messages
            mailService.listenForMessages(state.accountId, state.token, (message) => {
              set((state) => ({
                messages: [message, ...state.messages],
              }));
            });

            // Set up auto-refresh
            const refreshInterval = setInterval(() => {
              get().refreshInbox();
            }, 5000);

            // Fetch initial messages
            const messages = await mailService.getMessages();
            set({ messages, loading: false });

            // Cleanup interval on unmount
            return () => clearInterval(refreshInterval);
          } catch (error) {
            console.error('Token expired or invalid, generating new email');
            await get().generateNewEmail();
          }
        } else {
          // No existing session, create new email
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
          // Clean up existing EventSource
          currentState.mailService.listenForMessages('', '', () => {})();
        }

        try {
          const mailService = new MailService();
          const username = generateEmailUsername();
          const account = await mailService.createAccount(username);
          
          set({
            mailService,
            email: account.address,
            token: account.token,
            accountId: account.id,
            password: account.password || null,
            messages: [],
            loading: false,
          });

          // Start listening for new messages
          mailService.listenForMessages(account.id, account.token, (message) => {
            set((state) => ({
              messages: [message, ...state.messages],
            }));
          });

          toast.success('New email address generated');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate new email';
          console.error('Failed to generate new email:', errorMessage);
          toast.error(errorMessage);
          set({ loading: false });
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
      }),
    }
  )
);