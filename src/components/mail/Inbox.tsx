import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Mail } from 'lucide-react';

interface InboxProps {
  messages: Message[];
  selectedId?: string;
  onSelect: (message: Message) => void;
}

export function Inbox({ messages, selectedId, onSelect }: InboxProps) {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)] rounded-md">
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Inbox</h2>
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
          <div className="space-y-2">
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => onSelect(message)}
                className={cn(
                  'w-full text-left p-4 rounded-lg transition-all duration-200',
                  'hover:bg-accent hover:shadow-md',
                  'border border-transparent',
                  selectedId === message.id && 'bg-accent shadow-md border-accent',
                  !message.seen && 'bg-primary/5'
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-none truncate mb-1",
                        !message.seen ? "font-bold text-primary" : "font-medium"
                      )}>
                        {message.from.name || message.from.address}
                      </p>
                      <p className={cn(
                        "text-xs truncate",
                        !message.seen ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {message.from.address}
                      </p>
                    </div>
                    <p className="text-[0.65rem] text-muted-foreground whitespace-nowrap">
                      {new Date(message.createdAt).toLocaleString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className={cn(
                      "text-sm truncate",
                      !message.seen && "font-bold"
                    )}>
                      {message.subject}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                      {message.intro}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {!message.seen && (
                      <Badge variant="default" className="bg-primary text-[0.65rem]">
                        New
                      </Badge>
                    )}
                    {message.attachments && message.attachments.length > 0 && (
                      <Badge variant="outline" className="text-[0.65rem] gap-1">
                        <Paperclip className="h-3 w-3" />
                        {message.attachments.length}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}