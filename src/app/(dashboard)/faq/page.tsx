import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export default function FaqPage() {
  return (
    <>
      <PageHeader title="Frequently Asked Questions" />
      <div className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {/* General Section */}
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">What is RentVision?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              RentVision is a streamlined application designed to help small-scale landlords and property managers oversee their rental portfolios. It provides tools for tracking revenue and expenses, managing property details, monitoring tenant arrears, and generating financial reports, all in one centralized dashboard.
            </AccordionContent>
          </AccordionItem>

          {/* Dashboard Section */}
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">How does the Dashboard work?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/" className="text-primary underline">Dashboard</Link> provides a high-level overview of your entire portfolio's financial health. It features Key Performance Indicators (KPIs) like Total Property Value, Portfolio Equity, and monthly Revenue, Expenses, and Profit. It also includes charts that visualize your financial trends over the last six months and show profit breakdowns by property.
            </AccordionContent>
          </AccordionItem>
          
          {/* Properties Section */}
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">How do I manage my properties?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/properties" className="text-primary underline">Properties</Link> page is where you can add, view, and edit all the properties in your portfolio. Click the "Add Property" button to open a form where you can input details like address, property type, number of bedrooms/bathrooms, and financial information such as purchase price and current value.
            </AccordionContent>
          </AccordionItem>

          {/* Revenue Section */}
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold">How do I track revenue and tenancies?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              All income is managed on the <Link href="/revenue" className="text-primary underline">Revenue</Link> page. Revenue is tracked by "Tenancy." When you click "Add Tenancy," you link a tenant to a specific property for a defined period (e.g., a 12-month lease). The app automatically generates the expected monthly rent payments for that period. You can then click on a specific tenancy to view a detailed breakdown and record payments as they come in. You can also add a link to a contract document.
            </AccordionContent>
          </AccordionItem>

          {/* Expenses Section */}
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold">How do I manage expenses?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              Use the <Link href="/expenses" className="text-primary underline">Expenses</Link> page to log all costs associated with your properties or general business operations. You can categorize each expense, assign it to a specific property (or leave it as a general business expense), and add notes. The system supports both "One-off" and "Recurring" expenses to help you track everything from a single repair job to monthly management fees.
            </AccordionContent>
          </AccordionItem>

          {/* Reports Section */}
          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg font-semibold">What kind of reports can I generate?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/reports" className="text-primary underline">Financial Reports</Link> page provides two main views:
              <br /><br />
              - **Revenue Analysis:** This tab lets you compare projected revenue (what was due) versus actual revenue (what was paid) for any given month or year. It's a great tool for understanding the impact of late or missed payments.
              <br />
              - **P&L Statement:** This tab provides a simple Profit and Loss statement, summarizing your total income and breaking down your expenses by category for the selected period.
            </AccordionContent>
          </AccordionItem>

          {/* Arrears Section */}
          <AccordionItem value="item-7">
            <AccordionTrigger className="text-lg font-semibold">How can I see who is behind on rent?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/arrears" className="text-primary underline">Arrears</Link> page automatically lists all tenants who have outstanding balances on payments that are past their due date. It shows how much is owed, how many days the payment is overdue, and provides a "Send Reminder" button to easily open a pre-filled email to the tenant.
            </AccordionContent>
          </AccordionItem>
          
           {/* Calendar Section */}
          <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg font-semibold">What is the Calendar for?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/calendar" className="text-primary underline">Calendar</Link> provides a visual timeline of important events. It automatically populates with tenancy start and end dates, as well as logged expense transactions, giving you a clear view of key dates and activities across your portfolio each month.
            </AccordionContent>
          </AccordionItem>
          
           {/* Settings Section */}
          <AccordionItem value="item-9">
            <AccordionTrigger className="text-lg font-semibold">Can I change the currency or date format?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              Yes. In the <Link href="/settings" className="text-primary underline">Settings</Link> page, you can customize the currency symbol and locale (which controls date and number formatting) to match your preferences. Click the "Edit" button to make changes and then save them.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
