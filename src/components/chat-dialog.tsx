
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Bot, User, Send, Loader2, Sparkles, X } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
// This action will need to be created
// import { getChatResponse } from '@/lib/actions';


export function ChatDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemo(() => 
    user?.uid ? createUserQuery(firestore, 'chatMessages', user.uid) : null
  , [firestore, user?.uid]);

  const [messagesSnapshot, isLoading] = useCollection(messagesQuery);

  const messages = useMemo(() => 
    messagesSnapshot?.docs.map(doc => ({...doc.data(), id: doc.id } as ChatMessage))
    .sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis()) || []
  , [messagesSnapshot]);

  useEffect(() => {
    // Scroll to the bottom when new messages are added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isOpen]);
  
  useEffect(() => {
    if (!isOpen) {
        setInput('');
    }
  }, [isOpen]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content: input,
      ownerId: user.uid,
    };
    
    setInput('');
    setIsPending(true);

    try {
        await addDoc(collection(firestore, 'chatMessages'), { ...userMessage, timestamp: serverTimestamp() });
        // const response = await getChatResponse(input);
        // await addDoc(collection(firestore, 'chatMessages'), { ...response, ownerId: user.uid, timestamp: serverTimestamp() });
    } catch (error) {
        console.error("Error sending message:", error);
    } finally {
        setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 flex flex-col h-[70vh] max-h-[700px]">
        <DialogHeader className="p-4 border-b flex-row flex justify-between items-center">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="h-4 w-4"/></Button>
        </DialogHeader>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-4 space-y-6">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-3/4" />
                        <Skeleton className="h-16 w-3/4 ml-auto" />
                    </div>
                ) : messages.length > 0 ? (
                    messages.map((message) => (
                         <div key={message.id} className={cn("flex items-end gap-2", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                            {message.role === 'model' && (
                                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn("p-3 rounded-lg max-w-[80%]", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                             {message.role === 'user' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback><User size={20} /></AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))
                ) : (
                     <div className="text-center text-muted-foreground py-8 px-4">
                        <Sparkles className="mx-auto h-10 w-10 mb-4" />
                        <h3 className="font-semibold">Welcome to your AI Assistant!</h3>
                        <p className="text-sm">Ask me anything about managing your properties, and I'll do my best to help.</p>
                    </div>
                )}
                 {isPending && (
                    <div className="flex items-end gap-2 justify-start">
                         <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                            <AvatarFallback><Bot size={20} /></AvatarFallback>
                        </Avatar>
                        <div className="p-3 rounded-lg bg-muted">
                           <Loader2 className="h-5 w-5 animate-spin"/>
                        </div>
                    </div>
                 )}
            </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1"
                    disabled={isPending}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isPending}>
                    <Send className="h-4 w-4"/>
                    <span className="sr-only">Send</span>
                </Button>
            </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
