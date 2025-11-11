
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { KnowledgeArticle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export function ChatDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(null);

  const articlesQuery = useMemo(() => user?.uid ? query(collection(firestore, 'knowledgeBase'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const { data: articles, loading: isLoading } = useCollection<KnowledgeArticle>(articlesQuery);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    if (!searchTerm) return articles;
    return articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articles, searchTerm]); // FIX: Added searchTerm to dependency array
  
  useEffect(() => {
    if (!isOpen) {
        setSearchTerm('');
        setActiveArticle(null);
    }
  }, [isOpen]);
  
  const handleBack = () => {
    setActiveArticle(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 flex flex-col h-[70vh] max-h-[600px]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {activeArticle ? (
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBack}><X className="h-4 w-4"/></Button>
            ) : (
                <Search className="h-5 w-5" />
            )}
            {activeArticle ? 'Article' : 'Help & FAQs'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
            {activeArticle ? (
                <div className="p-6">
                    <h3 className="font-bold text-lg mb-2">{activeArticle.title}</h3>
                    <p className="text-sm whitespace-pre-wrap">{activeArticle.content}</p>
                </div>
            ) : (
                <>
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search articles..."
                            className="pl-10"
                            />
                        </div>
                    </div>
                    <ScrollArea className="h-[calc(100%-72px)]">
                        <div className="p-4 space-y-2">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : filteredArticles.length > 0 ? (
                                filteredArticles.map(article => (
                                <button
                                    key={article.id}
                                    onClick={() => setActiveArticle(article)}
                                    className="w-full text-left p-3 rounded-md hover:bg-muted flex items-center justify-between"
                                >
                                    <span className="font-medium text-sm">{article.title}</span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                                </button>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                <p>No articles found for "{searchTerm}".</p>
                                <p className="text-xs">Try a different keyword or add more articles in the Admin panel.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
