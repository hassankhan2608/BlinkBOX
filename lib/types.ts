export interface Email {
  id: number;
  from: string;
  subject: string;
  date: string;
  attachments: Attachment[];
  body: string;
  textBody: string;
  htmlBody: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
}

export interface EmailAddress {
  username: string;
  domain: string;
  fullAddress: string;
}