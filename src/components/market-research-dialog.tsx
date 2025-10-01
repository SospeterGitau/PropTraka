
'use client';

import { useState, useTransition } from 'react';
import { Clipboard, Lightbulb, Loader2 } from 'lucide-react';
import type { Property } from '@/lib/types';
import { getMarketResearchPrompt } from '@/lib/actions';
import { useDataContext } from '@/context/data-context';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface MarketResearchDialogProps {
  properties: Property[];
}

export function MarketResearchDialog({ properties }: MarketResearchDialogProps) {
  const { currency } = useDataContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState<string | null>(null);

  const handleGeneratePrompt = () => {
    startTransition(async () => {
      setPrompt(null);
      
      const propertiesToAnalyze = properties.map(({ id, addressLine1, city, state, postalCode, propertyType, buildingType, bedrooms, bathrooms, size, sizeUnit, rentalValue }) => ({
        id,
        address: `${addressLine1}, ${city}, ${state} ${postalCode}`,
        propertyType,
        buildingType,
        bedrooms,
        bathrooms,
        size: size ? `${size} ${sizeUnit}` : undefined,
        currentRent: rentalValue,
      }));

      const result = await getMarketResearchPrompt({
        properties: JSON.stringify(propertiesToAnalyze, null, 2),
        currency: currency,
      });

      setPrompt(result.prompt);
    });
  };
  
  const handleCopyToClipboard = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      toast({
        title: "Copied to Clipboard",
        description: "The research prompt has been copied.",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPrompt(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Lightbulb className="mr-2 h-4 w-4" />
        Market Research
      </Button>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Market Research Prompt</DialogTitle>
          <DialogDescription>
            Create a powerful, detailed prompt to analyze your portfolio's competitiveness using an advanced AI model.
          </DialogDescription>
        </DialogHeader>

        {prompt ? (
          <div className="prose prose-sm max-w-none h-[60vh] overflow-y-auto border rounded-md p-4 bg-muted/50 whitespace-pre-wrap font-sans text-sm">
            {prompt}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center min-h-[300px]">
            {isPending ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Generating your custom prompt...</p>
              </>
            ) : (
              <div className="text-center">
                 <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
                 <p className="mt-4 max-w-md text-muted-foreground">
                    This tool will generate a detailed prompt based on your current property portfolio. You can then use this prompt in a large language model (like Gemini or ChatGPT) to get a deep analysis of your rental prices vs. the market.
                 </p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          {prompt ? (
            <>
                <Button variant="secondary" onClick={handleCopyToClipboard}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy Prompt
                </Button>
                <Button onClick={() => setPrompt(null)}>Start Over</Button>
            </>
          ) : (
             <Button onClick={handleGeneratePrompt} disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : 'Generate Prompt'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
