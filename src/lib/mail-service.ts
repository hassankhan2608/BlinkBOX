import { Account, Message } from './types';

export class MailService {
  public API_URL = 'https://api.mail.tm';
  private token: string | null = null;
  private accountId: string | null = null;
  private messageListeners: Set<(message: Message) => void> = new Set();
  private pollInterval: number | null = null;

  constructor(token?: string, accountId?: string) {
    if (token) this.token = token;
    if (accountId) this.accountId = accountId;
  }

  cleanup() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.messageListeners.clear();
  }

  async deleteAccount(): Promise<void> {
    if (!this.token || !this.accountId) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.API_URL}/accounts/${this.accountId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error['hydra:description'] || 'Failed to delete account');
    }
  }

  async getToken(address: string, password: string): Promise<{ token: string }> {
    const response = await fetch(`${this.API_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error['hydra:description'] || 'Authentication failed');
    }

    const data = await response.json();
    this.token = data.token;
    return data;
  }

  async getAccountInfo(): Promise<Account | null> {
    if (!this.token) return null;

    const response = await fetch(`${this.API_URL}/me`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid token');
      }
      return null;
    }

    return await response.json();
  }

  async getDomains() {
    const response = await fetch(`${this.API_URL}/domains`);
    if (!response.ok) {
      throw new Error('Failed to fetch domains');
    }

    const data = await response.json();
    return data['hydra:member'] || [];
  }

  async createAccount(username?: string, domain?: string, customPassword?: string): Promise<Account> {
    try {
      const domains = await this.getDomains();
      if (!domains.length) {
        throw new Error('No available domains found');
      }

      const selectedDomain = domain || domains[0].domain;
      const address = `${username || Math.random().toString(36).substring(2, 12)}@${selectedDomain}`;
      const password = customPassword || Math.random().toString(36).substring(2, 12) + 'X!1';

      const accountResponse = await fetch(`${this.API_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });

      if (!accountResponse.ok) {
        const error = await accountResponse.json();
        if (error['hydra:description']?.includes('already exists')) {
          throw new Error('This email address is already taken');
        }
        throw new Error(error['hydra:description'] || 'Failed to create account');
      }

      const account = await accountResponse.json();
      const tokenData = await this.getToken(address, password);
      this.token = tokenData.token;
      this.accountId = account.id;

      const accountInfo = await this.getAccountInfo();
      if (!accountInfo) {
        throw new Error('Failed to get account info');
      }

      this.startPolling();

      return {
        ...account,
        ...accountInfo,
        token: tokenData.token,
        password,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create account');
    }
  }

  private startPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.pollInterval = window.setInterval(async () => {
      try {
        const messages = await this.getMessages();
        this.messageListeners.forEach(listener => {
          messages.forEach(message => {
            listener(message);
          });
        });
      } catch (error) {
        console.error('Failed to poll messages:', error);
      }
    }, 10000);
  }

  async getMessages(): Promise<Message[]> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.API_URL}/messages`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid token');
      }
      throw new Error(`Failed to fetch messages: ${await response.text()}`);
    }

    const data = await response.json();
    return data['hydra:member'] || [];
  }

  async getMessage(id: string): Promise<Message> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.API_URL}/messages/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid token');
      }
      throw new Error(`Failed to fetch message: ${await response.text()}`);
    }

    return await response.json();
  }

  async markAsRead(messageId: string): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.API_URL}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/merge-patch+json'
      },
      body: JSON.stringify({ seen: true })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid token');
      }
      throw new Error('Failed to mark message as read');
    }
  }

  onNewMessage(callback: (message: Message) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }
}