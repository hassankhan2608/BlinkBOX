import { Account, Message } from './types';

export class MailService {
  public API_URL = 'https://api.mail.tm';
  private MERCURE_URL = 'https://mercure.mail.tm/.well-known/mercure';
  private token: string | null = null;
  private accountId: string | null = null;
  private eventSource: EventSource | null = null;

  constructor(token?: string, accountId?: string) {
    if (token) this.token = token;
    if (accountId) this.accountId = accountId;
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
      // Get available domains if not provided
      const domains = await this.getDomains();
      if (!domains.length) {
        throw new Error('No available domains found');
      }

      const selectedDomain = domain || domains[0].domain;
      const address = `${username || Math.random().toString(36).substring(2, 12)}@${selectedDomain}`;
      const password = customPassword || Math.random().toString(36).substring(2, 12) + 'X!1';

      // Create account
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

      // Get token
      const tokenData = await this.getToken(address, password);
      this.token = tokenData.token;
      this.accountId = account.id;

      return {
        ...account,
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

  async getMessages(): Promise<Message[]> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.API_URL}/messages`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!response.ok) {
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
      throw new Error(`Failed to fetch message: ${await response.text()}`);
    }

    return await response.json();
  }

  listenForMessages(accountId: string, token: string, callback: (message: Message) => void) {
    if (!accountId || !token) {
      console.warn('Missing accountId or token for message listening');
      return () => {};
    }

    // Clean up existing connection
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = new URL(this.MERCURE_URL);
    url.searchParams.append('topic', `/accounts/${accountId}`);

    this.eventSource = new EventSource(url.toString());

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.eventSource.onerror = () => {
      console.warn('EventSource connection failed, retrying...');
      if (this.eventSource) {
        this.eventSource.close();
      }
      // Attempt to reconnect after a delay
      setTimeout(() => {
        this.listenForMessages(accountId, token, callback);
      }, 5000);
    };

    return () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }
}