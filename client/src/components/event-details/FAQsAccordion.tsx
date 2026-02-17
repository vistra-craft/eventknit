import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQsAccordionProps {
  faqs: FAQ[];
}

export function FAQsAccordion({ faqs }: FAQsAccordionProps) {
  return (
    <Accordion.Root type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <Accordion.Item
          key={i}
          value={`faq-${i}`}
          className="border-b border-border/30 last:border-b-0"
        >
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-4 text-left text-base font-medium text-foreground hover:text-primary transition-colors group">
              <span className="pr-4">{faq.question}</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
              {faq.answer}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
