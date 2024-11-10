import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMailStore } from '@/lib/store';
import { Loader2, Paperclip } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Message } from '@/lib/types';
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
  }, [message?.id, mailService]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a message to view its contents
      </div>
    );
  }

  const sanitizedHtml = fullMessage?.html 
    ? DOMPurify.sanitize(fullMessage.html, { 
        ADD_TAGS: ['style'],
        ADD_ATTR: ['target']
      })
    : '';

  return (
    <div className="h-full p-4">
      <Card className="h-full">
        <div className="h-full flex flex-col">
          <div className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5 flex-1">
                <h2 className="text-2xl font-bold leading-tight break-words">
                  {message.subject}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground break-all">
                    {message.from?.name || message.from?.address}
                  </span>
                  <span className="break-all">〈{message.from?.address}〉</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <ScrollArea className="flex-1 p-6">
            <div className="max-w-[900px] mx-auto">
              {fullMessage ? (
                <>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none break-words"
                    dangerouslySetInnerHTML={{
                      __html: sanitizedHtml || fullMessage.text?.replace(/\n/g, '<br>') || 'No content'
                    }}
                  />
                  {fullMessage.attachments?.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Paperclip className="h-4 w-4" />
                        Attachments ({fullMessage.attachments.length})
                      </h3>
                      <div className="space-y-2">
                        {fullMessage.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-sm font-medium">{attachment.filename}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(attachment.size / 1024)} KB
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
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}