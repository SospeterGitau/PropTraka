'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatDialog } from '@/components/chat-dialog';

export function ChatBubble() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-20 right-4 sm:bottom-20 sm:right-6 md:bottom-24 md:right-8 z-40">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg"
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
