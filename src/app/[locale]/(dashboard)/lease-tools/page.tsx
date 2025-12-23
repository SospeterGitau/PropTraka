
'use client';

import { useState, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Clipboard, ClipboardCheck, Download } from 'lucide-react';
import { generateLeaseClause } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function LeaseToolsPage() {
  const [description, setDescription] = useState('');
  const [generatedClause, setGeneratedClause] = useState('');
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!description) return;
    startTransition(async () => {
      setGeneratedClause('');
      const result = await generateLeaseClause({ description });
      setGeneratedClause(result.clause);
    });
  };

  const handleCopy = () => {
    if (!generatedClause) return;
    navigator.clipboard.writeText(generatedClause);
    setCopied(true);
    toast({ title: "Clause copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Lease Tools" />
        <Button variant="outline" onClick={() => window.open('/assets/standard-lease-template.pdf', '_blank')}>
          <Download className="mr-2 h-4 w-4" />
          Standard Template
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>AI Lease Clause Generator</CardTitle>
            <CardDescription>
              Describe the lease clause you need, and the AI will draft it for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Clause Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., a clause about no smoking inside the property, or rules for keeping pets..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            <Button onClick={handleGenerate} disabled={!description || isPending} className="w-full">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Clause
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Clause</CardTitle>
            <CardDescription>
              Review the AI-generated text below. You can copy it to use in your lease agreement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : generatedClause ? (
              <div className="relative">
                <Textarea
                  value={generatedClause}
                  readOnly
                  className="min-h-[250px] bg-muted"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={handleCopy}
                >
                  {copied ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Your generated clause will appear here.
              </div>
            )}
            <Alert className="mt-4">
              <AlertTitle>Disclaimer</AlertTitle>
              <AlertDescription>
                This AI-generated text is for informational purposes only and does not constitute legal advice. Always consult with a qualified legal professional.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
