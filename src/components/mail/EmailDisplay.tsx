import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMailStore } from '@/lib/store';
import { 
  Loader2, 
  Paperclip, 
  Mail, 
  Calendar, 
  User, 
  Download,
  File,
  Image as ImageIcon,
  FileText,
  FileArchive,
  Film,
  Music,
  Code,
  Clock,
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface EmailDisplayProps {
  message?: Message | null;
  onBack?: () => void;
}

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return ImageIcon;
  if (contentType.startsWith('video/')) return Film;
  if (contentType.startsWith('audio/')) return Music;
  if (contentType.startsWith('text/')) return FileText;
  if (contentType.includes('compressed') || contentType.includes('zip')) return FileArchive;
  if (contentType.includes('javascript') || contentType.includes('json') || contentType.includes('xml')) return Code;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (date: string) => {
  const messageDate = new Date(date);
  const now = new Date();
  const diff = now.getTime() - messageDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return messageDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

export function EmailDisplay({ message, onBack }: EmailDisplayProps) {
  const [fullMessage, setFullMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingAttachments, setDownloadingAttachments] = useState<Set<string>>(new Set());
  const mailService = useMailStore((state) => state.mailService);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchFullMessage() {
      if (message?.id && mailService) {
        setLoading(true);
        try {
          if (!message.seen) {
            await mailService.markAsRead(message.id);
          }
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

  const handleDownload = async (url: string, filename: string, attachmentId: string) => {
    setDownloadingAttachments(prev => new Set(prev).add(attachmentId));
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    } finally {
      setDownloadingAttachments(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachmentId);
        return newSet;
      });
    }
  };

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
        ADD_ATTR: ['target', 'style']
      })
    : '';

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Header */}
      {isMobileView && (
        <div className="border-b p-2 flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold truncate flex-1">
            {message.subject}
          </h2>
        </div>
      )}

      {/* Email Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className={cn(
              "font-bold break-words flex-1",
              isMobileView ? "text-lg" : "text-2xl"
            )}>
              {message.subject}
            </h1>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.from.address)}>
                  Copy sender email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.subject)}>
                  Copy subject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium leading-none">
                  {message.from?.name || 'Unknown Sender'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {message.from?.address}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-13 md:ml-auto">
              <Clock className="h-4 w-4" />
              <time dateTime={message.createdAt} className="tabular-nums">
                {formatDate(message.createdAt)}
              </time>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">To:</span>
            {message.to.map((recipient, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {recipient.name || recipient.address}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Email Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          <Card className="overflow-hidden border-0 bg-card/50 backdrop-blur-sm">
            <div className="p-4 md:p-6">
              {fullMessage ? (
                <div
                  className="prose prose-sm md:prose dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: sanitizedHtml || fullMessage.text?.replace(/\n/g, '<br>') || 'No content'
                  }}
                />
              ) : (
                <div className="text-muted-foreground break-words">
                  {message.intro || 'Loading message content...'}
                </div>
              )}
            </div>

            {fullMessage?.attachments?.length > 0 && (
              <>
                <Separator />
                <div className="p-4 md:p-6 bg-muted/30">
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-4">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({fullMessage.attachments.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {fullMessage.attachments.map((attachment) => {
                      const FileIcon = getFileIcon(attachment.contentType);
                      const isDownloading = downloadingAttachments.has(attachment.id);
                      
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-background/95 hover:bg-background/80 transition-colors"
                        >
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileIcon className="h-5 w-5 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)} • {attachment.contentType.split('/')[1].toUpperCase()}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => handleDownload(
                              attachment.downloadUrl,
                              attachment.filename,
                              attachment.id
                            )}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}