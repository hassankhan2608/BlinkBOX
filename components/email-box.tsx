"use client";

import { useState, useEffect } from "react";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { generateRandomEmail, getMessages } from "@/lib/email-service";
import { saveEmailToStorage, getEmailFromStorage } from "@/lib/storage";
import { EmailList } from "@/components/email-list";
import { EmailView } from "@/components/email-view";

export function EmailBox() {
  const [email, setEmail] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedEmail = getEmailFromStorage();
    if (savedEmail) {
      setEmail(savedEmail);
      refreshMessages(savedEmail);
    } else {
      generateNewEmail();
    }
  }, []);

  useEffect(() => {
    if (email) {
      const interval = setInterval(() => refreshMessages(email), 10000);
      return () => clearInterval(interval);
    }
  }, [email]);

  const generateNewEmail = async () => {
    setLoading(true);
    try {
      const newEmail = await generateRandomEmail();
      setEmail(newEmail);
      saveEmailToStorage(newEmail);
      setMessages([]);
      setSelectedEmail(null);
      toast({
        title: "New email generated",
        description: "Your temporary email address is ready to use",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate email address",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const refreshMessages = async (emailAddress: string = email) => {
    if (!emailAddress) return;
    setRefreshing(true);
    try {
      const newMessages = await getMessages(emailAddress);
      setMessages(newMessages);
      if (selectedEmail) {
        const updatedSelectedEmail = newMessages.find(
          (msg) => msg.id === selectedEmail.id
        );
        if (updatedSelectedEmail) {
          setSelectedEmail(updatedSelectedEmail);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    }
    setRefreshing(false);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard",
    });
  };

  return (
    <Card className="w-full max-w-[1400px] mx-auto p-6 bg-white shadow-xl rounded-xl">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                value={email}
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#044cab]"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-transform hover:scale-110"
                onClick={copyEmail}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="flex-1 md:flex-none relative"
              onClick={() => refreshMessages()}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
              {refreshing && (
                <span className="absolute top-0 right-0 -mt-2 -mr-2">
                  <div className="animate-ping h-3 w-3 rounded-full bg-blue-400 opacity-75"></div>
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={generateNewEmail}
              disabled={loading}
            >
              <Trash2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              New Email
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <EmailList
              messages={messages}
              onSelect={setSelectedEmail}
              selectedId={selectedEmail?.id}
              loading={loading}
            />
          </div>
          <div className="col-span-12 md:col-span-8 lg:col-span-9">
            <EmailView
              email={email}
              selectedEmail={selectedEmail}
              onClose={() => setSelectedEmail(null)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}