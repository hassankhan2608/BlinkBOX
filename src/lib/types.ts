export interface EmailAddress {
  address: string;
  name?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  disposition: string;
  size: number;
  downloadUrl: string;
}

export interface Message {
  id: string;
  accountId: string;
  subject: string;
  intro?: string;
  seen: boolean;
  from: EmailAddress;
  to: EmailAddress[];
  createdAt: string;
  updatedAt: string;
  html?: string;
  text?: string;
  attachments?: Attachment[];
}

export interface Account {
  id: string;
  address: string;
  token: string;
  password?: string;
  quota: number;
  used: number;
  createdAt: string;
  updatedAt: string;
  isDisabled: boolean;
  isDeleted: boolean;
}