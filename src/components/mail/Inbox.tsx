import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function Inbox({ messages, selectedId, onSelect }) {
  return (
    <ScrollArea className="h-[600px] rounded-md border">
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Inbox</h2>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No messages yet
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => onSelect(message)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors',
                  'hover:bg-muted',
                  selectedId === message.id && 'bg-muted',
                  !message.seen && 'font-semibold'
                )}
              >
                <p className="truncate font-medium">{message.from.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {message.subject}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}