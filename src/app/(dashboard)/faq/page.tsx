
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
  "mainEntity": placeholderFaq.flatMap(category => 
    category.questions.map(item => ({
      "@type": "Question",
      "name": item.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.content.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?b>/gi, '')
      }
    }))
  )
};


export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageHeader title="Frequently Asked Questions" />
      <div className="max-w-4xl mx-auto space-y-8">
        {placeholderFaq.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h2 className="text-2xl font-bold mb-4">{category.category}</h2>
            <Accordion type="single" collapsible className="w-full">
              {category.questions.map((item, itemIndex) => (
                 <AccordionItem value={`item-${categoryIndex}-${itemIndex}`} key={itemIndex}>
                  <AccordionTrigger className="text-lg font-semibold text-left">{item.title}</AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed">
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </>
  );
}
