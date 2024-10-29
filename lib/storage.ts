export const saveEmailToStorage = (email: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tempmail_address', email);
  }
};

export const getEmailFromStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tempmail_address');
  }
  return null;
};