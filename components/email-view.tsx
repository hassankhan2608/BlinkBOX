"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Paperclip, Mail, Calendar, User } from "lucide-react";
import { getMessage } from "@/lib/email-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface EmailViewProps {
  email: string;
  selectedEmail: any;
  onClose: () => void;
}

export function EmailView({ email, selectedEmail, onClose }: EmailViewProps) {
  const [emailContent, setEmailContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedEmail) {
      fetchEmailContent();
    } else {
      setEmailContent(null);
    }
  }, [selectedEmail]);

  const fetchEmailContent = async () => {
    setLoading(true);
    try {
      const content = await getMessage(email, selectedEmail.id);
      setEmailContent(content);
    } catch (error) {
      console.error("Failed to fetch email content:", error);
    }
    setLoading(false);
  };

  const downloadAttachment = async (attachment: any) => {
    const [username, domain] = email.split('@');
    const url = `https://www.1secmail.com/api/v1/?action=download&login=${username}&domain=${domain}&id=${selectedEmail.id}&file=${attachment.filename}`;
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to download attachment:", error);
    }
  };

  if (!selectedEmail) {
    return (
      <Card className="h-[600px] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Select an email to view its content</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold">Email Content</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-[520px] overflow-auto">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          emailContent && (
            <div className="divide-y">
              <div className="p-6 space-y-4">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-2xl font-semibold">
                    {emailContent.subject || "(No subject)"}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Badge variant="secondary">Inbox</Badge>
                    <span>{new Date(emailContent.date).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 pt-4">
                  <div className="bg-blue-100 rounded-full p-2">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{emailContent.from}</p>
                    <p className="text-sm text-gray-500">to me</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {new Date(emailContent.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="prose max-w-none">
                  {emailContent.htmlBody ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: emailContent.htmlBody }}
                      className="prose max-w-none"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans">
                      {emailContent.textBody}
                    </pre>
                  )}
                </div>
              </div>

              {emailContent.attachments?.length > 0 && (
                <div className="p-6 bg-gray-50">
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({emailContent.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {emailContent.attachments.map((attachment: any) => (
                      <div
                        key={attachment.filename}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-sm">
                            <p className="font-medium">{attachment.filename}</p>
                            <p className="text-gray-500">
                              {(attachment.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </Card>
  );
}