
'use client';

import { useState } from 'react';
import type { KnowledgeArticle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
  'Getting Started',
  'Properties',
  'Expenses',
  'Revenue',
  'Reports',
  'Settings',
  'Contractors',
  'Troubleshooting',
  'Other',
];


export function KnowledgeArticleForm({ isOpen, onClose, onSubmit, article }: KnowledgeArticleFormProps) {
  const [category, setCategory] = useState(article?.category || '');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const data = {
      ...(article ? { id: article.id } : {}),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      category: category,
    } as unknown as Omit<KnowledgeArticle, 'id' | 'ownerId'> | KnowledgeArticle;
    
    onSubmit(data);
    onClose();
  };


  if (!isOpen) return null;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" aria-describedby="article-description">
        <DialogHeader>
          <DialogTitle>{article ? 'Edit' : 'Add'} Knowledge Article</DialogTitle>
          <DialogDescription id="article-description">
            Create or edit a knowledge base article for your team or tenants.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
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
            <Label htmlFor="title">Title / Keywords / Question</Label>
            <Input id="title" name="title" defaultValue={article?.title} required placeholder="e.g., How do I add a new property?"/>
          </div>


          <div className="space-y-2">
            <Label htmlFor="content">Content / Answer</Label>
            <Textarea id="content" name="content" defaultValue={article?.content} required className="min-h-[200px]" placeholder="Provide a detailed step-by-step answer or explanation."/>
          </div>


          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Article</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
