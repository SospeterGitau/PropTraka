
'use client';

import { useRef, useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { Paperclip, Send, Bot } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function ChatDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useUser();
  const { messages, sendMessage, isLoading, isSending } = useChat();
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg p-0 flex flex-col h-[80vh] max-h-[700px]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Bot /> LeaseLync Support AI
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
                <Skeleton className="h-16 w-3/4" />
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-end gap-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'model' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                   {message.role === 'user' && (
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL ?? undefined} />
                        <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
             {isSending && (
                <div className="flex items-end gap-2 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-2 w-2 bg-primary rounded-full animate-pulse delay-0"></span>
                            <span className="h-2 w-2 bg-primary rounded-full animate-pulse delay-150"></span>
                            <span className="h-2 w-2 bg-primary rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your portfolio..."
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isSending}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
