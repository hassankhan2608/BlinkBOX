import { RefreshCw, Inbox, Wand2 } from 'lucide-react';
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
    <div className="w-[320px] border-r bg-muted/10">
      <div className="p-4 space-y-4">
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
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-3">
            <Inbox className="h-4 w-4" /> Inbox
          </h2>
          <ScrollArea className="h-[calc(100vh-13rem)]">
            <div className="space-y-2 pr-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">
                  No messages yet
                </p>
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
      </div>
    </div>
  );
}