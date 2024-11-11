import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { EmailDisplay } from './EmailDisplay';
import { useMailStore } from '@/lib/store';
import { Message } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

function LoadingSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 flex-1 max-w-2xl" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[320px] border-r p-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="h-4" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-hidden">
          <Skeleton className="h-full w-full" />
        </main>
      </div>
    </div>
  );
}

function MailApp() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { loading, initialize, mailService } = useMailStore();

  const handleMessageSelect = useCallback(async (message: Message) => {
    setSelectedMessage(message);
    if (!message.seen && mailService) {
      try {
        await mailService.markAsRead(message.id);
        // Update the message in the store
        useMailStore.getState().refreshInbox();
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  }, [mailService]);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
  }, [initialize]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onMessageSelect={handleMessageSelect} selectedId={selectedMessage?.id} />
        <main className="flex-1 overflow-hidden">
          <EmailDisplay message={selectedMessage} />
        </main>
      </div>
    </div>
  );
}

export default MailApp;