import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { EmailDisplay } from './EmailDisplay';
import { useMailStore } from '@/lib/store';
import { Message } from '@/lib/types';

function MailApp() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { loading, initialize } = useMailStore();

  useEffect(() => {
    initialize();
    return () => {
      const mailService = useMailStore.getState().mailService;
      if (mailService) {
        mailService.listenForMessages('', '', () => {})();
      }
    };
  }, [initialize]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onMessageSelect={setSelectedMessage} selectedId={selectedMessage?.id} />
        <main className="flex-1 overflow-hidden bg-muted/10">
          <EmailDisplay message={selectedMessage} />
        </main>
      </div>
    </div>
  );
}

export default MailApp;