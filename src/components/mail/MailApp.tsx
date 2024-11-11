import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { EmailDisplay } from './EmailDisplay';
import { useMailStore } from '@/lib/store';
import { Message } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Mail } from 'lucide-react';

function LoadingSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="glass">
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
        <div className="w-[320px] lg:w-[380px] glass m-2 rounded-xl">
          <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="h-4" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <main className="flex-1 m-2">
          <Skeleton className="h-full w-full rounded-xl" />
        </main>
      </div>
    </div>
  );
}

function MailApp() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const { loading, initialize, mailService, email, refreshInbox } = useMailStore();

  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMessageSelect = useCallback(async (message: Message) => {
    setSelectedMessage(message);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
    if (!message.seen && mailService) {
      try {
        await mailService.markAsRead(message.id);
        refreshInbox();
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  }, [mailService, refreshInbox]);

  const handleBack = useCallback(() => {
    setShowSidebar(true);
    setSelectedMessage(null);
  }, []);

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

  useEffect(() => {
    if (!loading) {
      const intervalId = setInterval(() => {
        refreshInbox();
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [loading, refreshInbox]);

  useEffect(() => {
    setSelectedMessage(null);
  }, [email]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* Sidebar with conditional rendering for mobile */}
        <div className={`
          md:relative md:translate-x-0 md:flex
          ${showSidebar ? 'flex' : 'hidden'}
          ${window.innerWidth < 768 ? 'absolute inset-0 z-20 m-0 bg-background' : ''}
        `}>
          <Sidebar 
            onMessageSelect={handleMessageSelect} 
            selectedId={selectedMessage?.id}
          />
        </div>

        {/* Main content */}
        <main className={`
          flex-1 glass rounded-xl overflow-hidden
          ${(!showSidebar || window.innerWidth >= 768) ? 'flex' : 'hidden'}
        `}>
          <EmailDisplay 
            message={selectedMessage} 
            onBack={handleBack}
          />
        </main>
      </div>
    </div>
  );
}

export default MailApp;