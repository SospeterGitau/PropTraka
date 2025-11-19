
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Metadata } from 'next';
import placeholderFaq from '@/lib/placeholder-faq.json';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) for PropTraka',
  description: 'Find answers to common questions about the PropTraka property management app, including how to manage properties, track revenue, handle maintenance, and use AI reporting features.',
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": placeholderFaq.map(item => ({
    "@type": "Question",
    "name": item.title,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.content.replace(/<br\s*\/?>/g, '\n') // Convert <br> to newlines for plain text
    }
  }))
};


export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageHeader title="Frequently Asked Questions" />
      <div className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {placeholderFaq.map((item, index) => (
             <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-lg font-semibold text-left">{item.title.replace(/LeaseLync/g, 'PropTraka')}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: item.content.replace(/LeaseLync/g, 'PropTraka').replace(/\n/g, '<br />') }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
}
