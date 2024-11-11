import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMailStore } from '@/lib/store';
import { Loader2, Paperclip, Mail, Calendar, User, AtSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';

interface EmailDisplayProps {
  message?: Message | null;
}

export function EmailDisplay({ message }: EmailDisplayProps) {
  const [fullMessage, setFullMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const mailService = useMailStore((state) => state.mailService);

  useEffect(() => {
    async function fetchFullMessage() {
      if (message?.id && mailService) {
        setLoading(true);
        try {
          // Mark as read first
          if (!message.seen) {
            await mailService.markAsRead(message.id);
          }
          // Then fetch full message
          const details = await mailService.getMessage(message.id);
          setFullMessage(details);
        } catch (error) {
          console.error('Failed to fetch message details:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setFullMessage(null);
      }
    }

    fetchFullMessage();
  }, [message?.id, mailService, message?.seen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Mail className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium mb-2">No message selected</p>
        <p className="text-sm text-center">
          Select a message from your inbox to view its contents
        </p>
      </div>
    );
  }

  const sanitizedHtml = fullMessage?.html 
    ? DOMPurify.sanitize(fullMessage.html[0] || '', { 
        ADD_TAGS: ['style'],
        ADD_ATTR: ['target']
      })
    : '';

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-muted/30">
        <div className="container max-w-6xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4 break-words">
            {message.subject}
          </h1>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{message.from?.name || 'Unknown Sender'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AtSign className="h-4 w-4" />
                <span>{message.from?.address}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <time dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </time>
              </div>
              {fullMessage?.attachments && fullMessage.attachments.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Paperclip className="h-4 w-4" />
                    {fullMessage.attachments.length} attachment{fullMessage.attachments.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="container max-w-6xl mx-auto p-6">
          <Card className="p-6">
            {fullMessage ? (
              <>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none break-words"
                  dangerouslySetInnerHTML={{
                    __html: sanitizedHtml || fullMessage.text?.replace(/\n/g, '<br>') || 'No content'
                  }}
                />
                
                {fullMessage.attachments?.length > 0 && (
                  <div className="mt-8 border rounded-lg p-4">
                    <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Paperclip className="h-4 w-4" />
                      Attachments ({fullMessage.attachments.length})
                    </h3>
                    <div className="grid gap-2">
                      {fullMessage.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-accent transition-colors"
                        >
                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {attachment.filename}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(attachment.size / 1024)} KB • {attachment.contentType}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground break-words">
                {message.intro || 'Loading message content...'}
              </div>
            )}
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}