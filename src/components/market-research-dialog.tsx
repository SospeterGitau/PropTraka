
'use client';

import { useState, useTransition } from 'react';
import { Clipboard, Lightbulb, Loader2, AlertTriangle, FileText, ChevronsUpDown } from 'lucide-react';
import type { Property } from '@/lib/types';
import { getMarketResearch } from '@/lib/actions';
import { useDataContext } from '@/context/data-context';
import { MARKET_RESEARCH_PROMPT } from '@/lib/prompts/market-research-prompt';

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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface MarketResearchDialogProps {
  properties: Property[];
}

export function MarketResearchDialog({ properties }: MarketResearchDialogProps) {
  const { settings } = useDataContext();
  const { currency } = settings;
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<{ code: string; hint: string } | null>(null);
  const [prompt, setPrompt] = useState(MARKET_RESEARCH_PROMPT);

  const handleGenerateAnalysis = () => {
    startTransition(async () => {
      setReport(null);
      setError(null);
      
      const propertiesToAnalyse = properties.map(({ id, addressLine1, city, state, postalCode, propertyType, buildingType, bedrooms, bathrooms, size, sizeUnit, rentalValue }) => ({
        id,
        address: `${addressLine1}, ${city}, ${state} ${postalCode}`,
        propertyType,
        buildingType,
        bedrooms,
        bathrooms,
        size: size ? `${size} ${sizeUnit}` : undefined,
        currentRent: rentalValue,
      }));

      const result = await getMarketResearch({
        properties: JSON.stringify(propertiesToAnalyse, null, 2),
        currency: currency,
        prompt: prompt,
      });

      if (result.error) {
        setError({ code: result.error, hint: result.hint || 'An unexpected error occurred.' });
      } else {
        setReport(result.report);
      }
    });
  };
  
  const handleCopyToClipboard = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      toast({
        title: "Copied to Clipboard",
        description: "The market analysis has been copied.",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setReport(null);
      setError(null);
      setPrompt(MARKET_RESEARCH_PROMPT);
    }
  };
  
  const handleStartOver = () => {
    setReport(null);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Lightbulb className="mr-2 h-4 w-4" />
        Market Research
      </Button>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI-Powered Market Analysis</DialogTitle>
          <DialogDescription>
            Generate a detailed analysis of your portfolio's competitiveness against current market rates.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
            {report ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-sans text-sm">
                {report}
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {isPending ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Analysing market data, please wait...</p>
                    <p className="text-xs text-muted-foreground">(This can take up to a minute)</p>
                  </div>
                ) : error ? (
                    <Alert variant="destructive" className="w-full">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error: {error.code}</AlertTitle>
                      <AlertDescription>
                        {error.hint}
                      </AlertDescription>
                    </Alert>
                ) : (
                  <div className="space-y-4">
                     <div className="text-center space-y-4">
                         <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
                         <p className="mt-4 max-w-md mx-auto text-muted-foreground">
                            This tool will use AI to analyse your portfolio based on market data. The generated report will assess if your rental prices are competitive and provide recommendations.
                         </p>
                     </div>
                     <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-sm">
                             <ChevronsUpDown className="mr-2 h-4 w-4" />
                             View & Edit Prompt
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2 text-left">
                            <Label htmlFor="prompt-textarea">Market Research Prompt</Label>
                            <Textarea
                                id="prompt-textarea"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="h-64 font-mono text-xs"
                            />
                        </CollapsibleContent>
                     </Collapsible>
                  </div>
                )}
              </div>
            )}
        </div>
        
        <DialogFooter>
          {report ? (
            <>
                <Button variant="secondary" onClick={handleCopyToClipboard}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy Report
                </Button>
                <Button onClick={handleStartOver}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate New Report
                </Button>
            </>
          ) : error ? (
            <Button onClick={handleStartOver}>
                <FileText className="mr-2 h-4 w-4" />
                Generate New Report
            </Button>
          ) : (
             <Button onClick={handleGenerateAnalysis} disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : 'Generate Analysis'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
