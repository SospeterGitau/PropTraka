
'use client';

import React, { useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { Query } from 'firebase/firestore';
import type { ApiKey } from '@/lib/types';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { format } from 'date-fns';

import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Copy } from 'lucide-react';

export default function ApiAccessTab() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const apiKeysQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'apiKeys', user.uid) : null, [firestore, user?.uid]);
    const [apiKeysSnapshot, isKeysLoading] = useCollection(apiKeysQuery as Query<ApiKey> | null);
    const apiKeys = useMemo(() => apiKeysSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as ApiKey)) || [], [apiKeysSnapshot]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);

    const handleGenerateKey = async () => {
        if (!user || !firestore) return;
        setIsGenerating(true);
        setNewKey(null);

        try {
            // In a real app, this would be a call to a secure cloud function
            // that generates a cryptographically secure random string.
            // For this demo, we'll create a simple, readable one.
            const key = `proptraka_dev_${user.uid.slice(0, 5)}_${Date.now()}`;
            const keyDocRef = doc(firestore, 'apiKeys', key);
            
            await setDoc(keyDocRef, {
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });

            setNewKey(key);
            toast({
                title: "API Key Generated",
                description: "Your new API key has been created successfully.",
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate API key.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "API key copied to clipboard." });
    };

    if (isKeysLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>API Access</CardTitle>
                    <CardDescription>Manage API keys for programmatic access to your data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTitle>API Endpoint</AlertTitle>
                        <AlertDescription>
                            Your base API endpoint is: <code className="font-mono bg-muted p-1 rounded-sm">/api/v1</code>
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                     <div className="flex items-center justify-between w-full">
                        <div>
                            <h3 className="font-medium">Generate New Key</h3>
                            <p className="text-sm text-muted-foreground">Create a new key to use with the API.</p>
                        </div>
                        <Button onClick={handleGenerateKey} disabled={isGenerating}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Key
                        </Button>
                    </div>
                    {newKey && (
                        <Alert variant="default" className="w-full flex items-center justify-between">
                            <div>
                                <AlertTitle>New Key Generated!</AlertTitle>
                                <AlertDescription className="break-all font-mono text-sm">{newKey}</AlertDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newKey)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </Alert>
                    )}
                </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Your API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>API Key (Hashed)</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Last Used</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {apiKeys.length > 0 ? (
                                apiKeys.map(key => (
                                    <TableRow key={key.id}>
                                        <TableCell className="font-mono">...{key.id.slice(-8)}</TableCell>
                                        <TableCell>{key.createdAt ? format(key.createdAt.toDate(), 'PP, p') : 'N/A'}</TableCell>
                                        <TableCell>{key.lastUsed ? format(key.lastUsed.toDate(), 'PP, p') : 'Never'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        No API keys have been generated yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
    );
}
