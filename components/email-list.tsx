"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Mail, Loader2 } from "lucide-react";

interface EmailListProps {
  messages: any[];
  onSelect: (email: any) => void;
  selectedId?: number;
  loading?: boolean;
}

export function EmailList({ messages, onSelect, selectedId, loading }: EmailListProps) {
  if (loading) {
    return (
      <Card className="h-[600px] overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="text-sm text-gray-500">Loading inbox...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">Inbox</h2>
        <p className="text-sm text-gray-500">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </p>
      </div>
      <ScrollArea className="h-[520px]">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            <p>No messages yet</p>
            <p className="text-sm text-gray-400">New emails will appear here</p>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                  selectedId === message.id ? "bg-blue-50" : ""
                }`}
                onClick={() => onSelect(message)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium truncate flex-1">
                    {message.subject || "(No subject)"}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(message.date), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{message.from}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}