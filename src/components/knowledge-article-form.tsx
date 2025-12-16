
'use client';

import { useState, useEffect } from 'react';
import type { KnowledgeArticle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface KnowledgeArticleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<KnowledgeArticle, 'id' | 'ownerId'> | KnowledgeArticle) => void;
  article?: KnowledgeArticle | null;
}

const categories = [
  'Getting Started', 'Properties', 'Expenses', 'Revenue',
  'Reports', 'Settings', 'Contractors', 'Troubleshooting', 'Other',
];

export function KnowledgeArticleForm({ isOpen, onClose, onSubmit, article }: KnowledgeArticleFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(article?.title || '');
      setContent(article?.content || '');
      setCategory(article?.category || '');
    }
  }, [isOpen, article]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const nowIso = new Date().toISOString();
    const data: Omit<KnowledgeArticle, 'id' | 'ownerId'> | KnowledgeArticle = {
      ...(article ? { id: article.id, createdAt: article.createdAt } : { createdAt: nowIso }),
      title,
      content,
      category,
      updatedAt: nowIso,
    };
    
    onSubmit(data as KnowledgeArticle);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" aria-describedby="article-description">
        <DialogHeader>
          <DialogTitle>{article ? 'Edit' : 'Add'} Knowledge Article</DialogTitle>
          <DialogDescription id="article-description">
            Create or edit a knowledge base article for your AI assistant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title / Keywords / Question *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., How do I add a new property?"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content / Answer *</Label>
            <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required className="min-h-[200px]" placeholder="Provide a detailed step-by-step answer or explanation."/>
          </div>

          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Article</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
