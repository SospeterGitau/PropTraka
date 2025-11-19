
'use client';

import type { KnowledgeArticle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface KnowledgeArticleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<KnowledgeArticle, 'id' | 'ownerId'> | KnowledgeArticle) => void;
  article?: KnowledgeArticle | null;
}

export function KnowledgeArticleForm({ isOpen, onClose, onSubmit, article }: KnowledgeArticleFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const data: Omit<KnowledgeArticle, 'id' | 'ownerId'> | KnowledgeArticle = {
      ...(article ? { id: article.id } : {}),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    };
    
    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{article ? 'Edit' : 'Add'} Knowledge Article</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
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
