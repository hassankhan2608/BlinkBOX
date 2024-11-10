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
  setLoading: (loading: boolean) => void;
  setEmail: (email: string) => void;
  setMessages: (messages: Message[]) => void;
  refreshInbox: () => Promise<void>;
  generateNewEmail: () => Promise<void>;
  initialize: () => Promise<void>;
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

      setLoading: (loading) => set({ loading }),
      setEmail: (email) => set({ email }),
      setMessages: (messages) => set({ messages }),

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

            // Fetch initial messages
            const messages = await mailService.getMessages();
            set({ messages, loading: false });
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
        if (!mailService) {
          toast.error('Mail service not initialized');
          return;
        }

        set({ refreshing: true });
        try {
          const messages = await mailService.getMessages();
          set({ messages });
          toast.success('Inbox refreshed');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh inbox';
          console.error('Failed to refresh inbox:', errorMessage);
          toast.error(errorMessage);
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
      }),
    }
  )
);