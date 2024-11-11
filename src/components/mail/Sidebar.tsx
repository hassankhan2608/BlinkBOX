import { RefreshCw, Inbox, Wand2, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { useMailStore } from '@/lib/store';
import { Message } from '@/lib/types';

interface SidebarProps {
  onMessageSelect: (message: Message) => void;
  selectedId?: string;
}

export function Sidebar({ onMessageSelect, selectedId }: SidebarProps) {
  const { messages, refreshInbox, generateNewEmail, refreshing } = useMailStore();

  return (
    <div className="w-[320px] lg:w-[380px] glass rounded-xl flex flex-col h-full">
      <div className="flex-none p-4 space-y-4">
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={generateNewEmail}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate New Email
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={refreshInbox}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')}
            />
            Refresh Inbox
          </Button>
        </div>

        <Separator />

        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Inbox className="h-4 w-4" /> Inbox
          </h2>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-2 pr-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                No messages yet. Your inbox is empty.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <button
                key={message.id}
                onClick={() => onMessageSelect(message)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  selectedId === message.id && 'bg-accent text-accent-foreground',
                  !message.seen && 'font-medium'
                )}
              >
                <div className="space-y-1">
                  <p className="font-medium leading-none truncate">
                    {message.from.name || message.from.address}
                  </p>
                  <p className="text-sm font-medium truncate">{message.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                    {message.intro}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}