const API_BASE = 'https://www.1secmail.com/api/v1';

export async function generateRandomEmail(): Promise<string> {
  const response = await fetch(`${API_BASE}/?action=genRandomMailbox&count=1`);
  const emails = await response.json();
  return emails[0];
}

export async function getMessages(email: string): Promise<any[]> {
  const [username, domain] = email.split('@');
  const response = await fetch(
    `${API_BASE}/?action=getMessages&login=${username}&domain=${domain}`
  );
  return response.json();
}

export async function getMessage(
  email: string,
  messageId: number
): Promise<any> {
  const [username, domain] = email.split('@');
  const response = await fetch(
    `${API_BASE}/?action=readMessage&login=${username}&domain=${domain}&id=${messageId}`
  );
  return response.json();
}