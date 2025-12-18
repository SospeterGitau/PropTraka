
'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react';
import { useUser } from '@/firebase/auth'; // CORRECTED IMPORT PATH for useUser
import { firestore, errorEmitter } from '@/firebase'; // firestore and errorEmitter are still from @/firebase
import { FirestorePermissionError } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, serverTimestamp, Timestamp, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { collection, addDoc, serverTimestamp, Timestamp, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
// import { getChatResponse } from '@/ai/flows/get-chat-response-flow'; // Replaced by Portfolio Assistant
import { portfolioAssistantChat } from '@/ai/flows/portfolio-assistant-chat';
import { useDataContext } from '@/context/data-context';
import { format } from 'date-fns';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Timestamp;
}

export function ChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { user } = useUser();
    const { properties, tenancies, tenants } = useDataContext(); // Access Data Context
    const [newMessage, setNewMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'chatMessages'),
            where('ownerId', '==', user.uid),
            orderBy('timestamp', 'asc'),
            limit(100)
        );
    }, [user]);

    const [messagesSnapshot, loading, error] = useCollection(messagesQuery);

    const messages: ChatMessage[] = useMemo(() => {
        if (!messagesSnapshot) return [];
        return messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as ChatMessage[];
    }, [messagesSnapshot]);

    useEffect(() => {
        if (error) {
            console.error("Chat Error:", error);
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'chatMessages', operation: 'list' }));
            }
        }
    }, [error]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const userMessage = newMessage;
        setNewMessage('');
        setIsThinking(true);

        try {
            await addDoc(collection(firestore, 'chatMessages'), {
                text: userMessage,
                sender: 'user',
                timestamp: serverTimestamp(),
                ownerId: user.uid,
            });

            await addDoc(collection(firestore, 'chatMessages'), {
                text: userMessage,
                sender: 'user',
                timestamp: serverTimestamp(),
                ownerId: user.uid,
            });

            // Prepare Portfolio Context
            const activeTenancies = tenancies.filter(t => t.status === 'Active');
            const vacantProperties = properties.filter(p => p.status === 'vacant' || !activeTenancies.some(t => t.propertyId === p.id));

            // Simple Arrears Calculation (assuming we can get basic view here, deeper analysis might need full ledger)
            // For now, let's just pass the list of tenants and properties to start.
            // Ideally we'd calculate arrears here or pass the pre-calculated metrics if available.
            // Since `arrears` isn't directly exposed in dataContext here (it's in DashboardPage), we might miss it.
            // BUT, `tenants` and `properties` are good enough for many questions.

            const contextData = {
                properties: properties.map(p => ({
                    name: p.name,
                    address: p.address.street,
                    status: p.status,
                    type: p.type
                })),
                tenants: tenants.map(t => ({
                    name: `${t.firstName} ${t.lastName}`,
                    email: t.email
                })),
                vacancies: vacantProperties.length,
                totalProperties: properties.length
            };

            const botResponseText = await portfolioAssistantChat({
                question: userMessage,
                portfolioContext: JSON.stringify(contextData)
            }).then(res => res.answer);

            // Fallback or legacy flow could be used here if needed, but we're fully switching.

            await addDoc(collection(firestore, 'chatMessages'), {
                text: botResponseText,
                sender: 'bot',
                timestamp: serverTimestamp(),
                ownerId: user.uid,
            });
        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Assistant
                    </DialogTitle>
                    <DialogDescription>
                        Ask me anything about your property portfolio, market trends, or maintenance queries.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {loading && <div className="text-center p-4">Loading messages...</div>}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    'flex items-start gap-3',
                                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {msg.sender === 'bot' && (
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <Bot className="w-6 h-6 text-primary" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'p-3 rounded-lg max-w-[80%]',
                                        msg.sender === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="bg-muted p-2 rounded-full">
                                        <User className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex items-start gap-3 justify-start">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <Bot className="w-6 h-6 text-primary" />
                                </div>
                                <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <form onSubmit={handleSendMessage} className="flex items-center w-full gap-2">
                        <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={isThinking}
                        />
                        <Button type="submit" disabled={!newMessage.trim() || isThinking}>
                            {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
