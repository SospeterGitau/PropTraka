
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatDialog } from '@/components/chat-dialog';

export function ChatBubble() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50 sm:bottom-6 sm:right-6">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 shadow-xl flex items-center justify-center transition-all hover:scale-110"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
          <span className="sr-only">Open Chat</span>
        </Button>
      </div>
      <ChatDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
