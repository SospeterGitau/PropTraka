
'use client';

import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import faqData from '@/lib/placeholder-faq.json';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function FAQPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Help Center
        </Button>
      </div>
      <div className="text-center pb-8 border-b">
        <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Find quick answers to the most common questions about PropTraka.</p>
      </div>

      <div className="space-y-4">
        {faqData.map((category) => (
          <div key={category.category} className="space-y-2">
            <h2 id={category.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '')} className="text-2xl font-bold mb-4 mt-6">{category.category}</h2>
            <div className="space-y-3">
              {category.questions.map((q, index) => (
                <Collapsible key={index} className="rounded-md border p-4 bg-card text-card-foreground shadow-sm" defaultOpen={false}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between font-semibold cursor-pointer py-2">
                      <span className="text-lg">{q.title}</span>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div
                      className="text-base text-muted-foreground space-y-2"
                      dangerouslySetInnerHTML={{ __html: q.content }}
                    />
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
