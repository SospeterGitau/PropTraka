
'use client';

import React, { useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import type { Query } from 'firebase/firestore';
import type { KnowledgeArticle } from '@/lib/types';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import placeholderFaq from '@/lib/placeholder-faq.json';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { KnowledgeArticleForm } from '@/components/knowledge-article-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal } from 'lucide-react';

export default function KnowledgeBaseTab() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

    const articlesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'knowledgeBase', user.uid) : null, [firestore, user?.uid]);
    const [articlesSnapshot, isDataLoading] = useCollection(articlesQuery as Query<KnowledgeArticle> | null);
    const articles = useMemo(() => articlesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as KnowledgeArticle)) || [], [articlesSnapshot]);

    const articlesToDisplay = (articles && articles.length > 0) ? articles : placeholderFaq.flatMap(cat => cat.questions.map(q => ({ id: '', ...q, ownerId: '' })));

    const handleSeedData = async () => {
        if (!user) return;
        const batch = writeBatch(firestore);
        placeholderFaq.flatMap(cat => cat.questions).forEach(article => {
            const docRef = doc(collection(firestore, 'knowledgeBase'));
            batch.set(docRef, { ...article, ownerId: user.uid });
        });
        await batch.commit();
        toast({
            title: "Knowledge Base Seeded",
            description: "The placeholder FAQs have been added to your knowledge base.",
        });
    };

    const handleAdd = () => {
        setSelectedArticle(null);
        setIsFormOpen(true);
    };

    const handleEdit = (article: KnowledgeArticle) => {
        setSelectedArticle(article);
        setIsFormOpen(true);
    };

    const handleDelete = (article: KnowledgeArticle) => {
        setSelectedArticle(article);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedArticle) {
            if (!articles?.find(a => a.id === selectedArticle.id)) {
                toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete a placeholder article. Seed the data first.' });
                setIsDeleteDialogOpen(false);
                return;
            }
            await deleteDoc(doc(firestore, 'knowledgeBase', selectedArticle.id));
            setIsDeleteDialogOpen(false);
            setSelectedArticle(null);
        }
    };

    const handleFormSubmit = async (data: Omit<KnowledgeArticle, 'id' | 'ownerId'> | KnowledgeArticle) => {
        if (!user) return;
        const isEditing = 'id' in data;

        if (isEditing) {
            if (!articles?.find(a => a.id === data.id)) {
                toast({ variant: 'destructive', title: 'Error', description: 'Cannot edit a placeholder article. Seed the data first.' });
                setIsFormOpen(false);
                return;
            }
            await updateDoc(doc(firestore, 'knowledgeBase', data.id), data as Partial<KnowledgeArticle>);
        } else {
            await addDoc(collection(firestore, 'knowledgeBase'), { ...data, ownerId: user.uid });
        }
        setIsFormOpen(false);
    };
  
  if (isDataLoading) {
    return (
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
            <CardDescription asChild>
                <div className="text-sm text-muted-foreground pt-1">
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>AI Knowledge Base</CardTitle>
            <CardDescription>
              This is the "brain" of the help system. Add FAQs and guides here.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {articles && articles.length === 0 && (
                <Button onClick={handleSeedData}>Seed with Placeholder FAQs</Button>
            )}
            <Button onClick={handleAdd}>Add Article</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title / Question</TableHead>
                <TableHead>Content / Answer</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articlesToDisplay.length > 0 ? (
                articlesToDisplay.map((article, index) => (
                  <TableRow key={(article as KnowledgeArticle).id || `placeholder-${index}`}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell className="max-w-md truncate">{article.content}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEdit(article as KnowledgeArticle)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(article as KnowledgeArticle)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No articles found. Add your first article to teach the AI.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <KnowledgeArticleForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        article={selectedArticle}
      />
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`the article titled: "${selectedArticle?.title}"`}
      />
    </>
  );
}
