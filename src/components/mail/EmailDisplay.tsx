import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMailStore } from '@/lib/store';
import { 
  Loader2, 
  Paperclip,
  Mail,
  User,
  Download,
  ArrowLeft,
  MoreVertical,
  Reply,
  Trash2,
  Forward,
  Star,
  File,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  FileArchive,
  Code
} from 'lucide-react';
import { Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface EmailDisplayProps {
  message?: Message | null;
  onBack?: () => void;
}

const formatDate = (date: string) => {
  const messageDate = new Date(date);
  return messageDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return ImageIcon;
  if (contentType.startsWith('video/')) return Film;
  if (contentType.startsWith('audio/')) return Music;
  if (contentType.startsWith('text/')) return FileText;
  if (contentType.includes('compressed') || contentType.includes('zip')) return FileArchive;
  if (contentType.includes('javascript') || contentType.includes('json') || contentType.includes('xml')) return Code;
  return File;
};

export function EmailDisplay({ message, onBack }: EmailDisplayProps) {
  const [fullMessage, setFullMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const mailService = useMailStore((state) => state.mailService);
  const deleteMessage = useMailStore((state) => state.deleteMessage);
  const markMessageAsRead = useMailStore((state) => state.markMessageAsRead);
  const [isMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    async function fetchMessage() {
      if (!message?.id || !mailService) return;
      
      setLoading(true);
      try {
        const details = await mailService.getMessage(message.id);
        setFullMessage(details);
        if (!message.seen) {
          await markMessageAsRead(message.id);
        }
      } catch (error) {
        console.error('Failed to fetch message:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMessage();
  }, [message?.id, mailService, markMessageAsRead, message?.seen]);

  const handleDownload = async (url: string, filename: string, id: string) => {
    setDownloading(prev => new Set(prev).add(id));
    
    try {
      const token = mailService?.token;
      if (!token) {
        throw new Error('No authorization token available');
      }

      const downloadUrl = `https://api.mail.tm/messages/${message?.id}/attachment/${id}`;

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download ${filename}`);
    } finally {
      setDownloading(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!message) return;
    
    setIsDeleting(true);
    try {
      await deleteMessage(message.id);
      if (onBack) onBack();
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
        <Mail className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Select an email to read</p>
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
    <div className="h-full flex flex-col bg-background">
      <div className="flex-none border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          {isMobile && (
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-semibold leading-tight break-words">
              {message.subject}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="icon">
                <Star className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Reply className="h-4 w-4 mr-2" /> Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Forward className="h-4 w-4 mr-2" /> Forward
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this message? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">
                {message.from.name || message.from.address.split('@')[0]}
              </div>
              <div className="text-sm text-muted-foreground">
                {message.from.address}
              </div>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              {formatDate(message.createdAt)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">To:</span>
            {message.to.map((recipient, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {recipient.name || recipient.address}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 max-w-[900px] mx-auto">
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            "prose-headings:font-semibold prose-headings:text-foreground",
            "prose-p:text-foreground/90 prose-p:leading-relaxed",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-code:text-muted-foreground prose-code:bg-muted prose-code:rounded prose-code:px-1",
            "prose-pre:bg-muted prose-pre:text-muted-foreground prose-pre:rounded-lg"
          )}>
            {sanitizedHtml ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
            ) : (
              <div className="whitespace-pre-wrap">
                {fullMessage?.text || message.intro || 'No content'}
              </div>
            )}
          </div>

          {fullMessage?.attachments?.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({fullMessage.attachments.length})
              </h3>
              <div className="grid gap-2">
                {fullMessage.attachments.map((file) => {
                  const FileIcon = getFileIcon(file.contentType);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size)} • {file.contentType.split('/')[1].toUpperCase()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(
                          file.downloadUrl,
                          file.filename,
                          file.id
                        )}
                        disabled={downloading.has(file.id)}
                      >
                        {downloading.has(file.id) ? (
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
          )}
        </div>
      </ScrollArea>
    </div>
  );
}