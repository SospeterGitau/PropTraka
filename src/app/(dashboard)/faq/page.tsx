
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FaqPage() {
  return (
    <>
      <PageHeader title="Frequently Asked Questions" />
      <div className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {/* General Section */}
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">About LeaseLync: What is it and who is it for?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              LeaseLync is a comprehensive, mobile-first web application designed to help landlords and property managers of all scales—from those with a single unit to those overseeing large portfolios—efficiently manage their rental properties. It provides a centralised dashboard with a suite of powerful tools for tracking income and expenses, managing property and tenant details, monitoring maintenance tasks, generating financial reports, and staying on top of tenant arrears. The goal of LeaseLync is to simplify property management, automate financial tracking, and provide clear, actionable insights into the performance of your real estate assets, all in one accessible place.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-13">
            <AccordionTrigger className="text-lg font-semibold">How do I sign up or log in?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              LeaseLync uses a simplified authentication system. Simply use the <Link href="/login" className="text-primary underline">Login</Link> page to enter your email and a password. If an account with that email already exists, you will be logged in. If not, a new account will be created for you automatically with those credentials. If you forget your password, you can use the "Forgot Password?" link on the login page to securely reset it via email.
            </AccordionContent>
          </AccordionItem>

          {/* Dashboard Section */}
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">How does the Dashboard work?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/dashboard" className="text-primary underline">Dashboard</Link> provides a high-level overview of your entire portfolio's financial health. It features Key Performance Indicators (KPIs) like Total Property Value, Portfolio Equity, and monthly Revenue, Expenses, and Net Operating Income. It also includes charts that visualise your cash flow trends over the last six months and show a year-to-date profit breakdown by property.
            </AccordionContent>
          </AccordionItem>
          
          {/* Properties Section */}
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">How do I manage my properties?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/properties" className="text-primary underline">Properties</Link> page is where you can add, view, and edit all the properties in your portfolio. When adding a property, you can input key details like address, property type (Domestic or Commercial), building type, number of bedrooms/bathrooms, and financial information such as purchase price, purchase taxes/fees, current value, mortgage balance, and the asking/target rent.
            </AccordionContent>
          </AccordionItem>

          {/* Revenue Section */}
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold">How do I track revenue and tenancies?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              All income is managed on the <Link href="/revenue" className="text-primary underline">Revenue</Link> page. Revenue is tracked by creating a "Tenancy," which links a tenant to a property for a specific lease period. When you add a tenancy, you can set the base rent, a security deposit, and any fixed monthly service charges (e.g., security fees). The app automatically generates the expected monthly payment records. You can then click on a tenancy to view its detailed breakdown and record payments. To handle variable charges like a metered water bill, you can edit the invoice for a specific month to add or adjust charges.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-10">
            <AccordionTrigger className="text-lg font-semibold">How do I handle a tenancy that ends early?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              You can end a tenancy earlier than its original end date. Go to the specific tenancy's detail page by clicking on it from the <Link href="/revenue" className="text-primary underline">Revenue</Link> page. In the header, click the "End Tenancy" button. A dialog will appear allowing you to select a new, earlier end date. Confirming this action will automatically delete any future, unpaid rent records after the new end date, ensuring your financial projections remain accurate.
            </AccordionContent>
          </AccordionItem>
          
           {/* Maintenance Section */}
          <AccordionItem value="item-11">
            <AccordionTrigger className="text-lg font-semibold">How do I manage maintenance and repairs?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/maintenance" className="text-primary underline">Maintenance</Link> page provides a Kanban-style board to track tasks through stages: "To Do," "In Progress," "Done," and "Cancelled." You can create new requests, assign them to a property and a contractor, set a priority, and log the reported date. Once a task is moved to "Done," you can log the final cost and generate a corresponding expense record with a single click, linking it directly to the completed job.
            </AccordionContent>
          </AccordionItem>
          
           {/* Contractors Section */}
          <AccordionItem value="item-12">
            <AccordionTrigger className="text-lg font-semibold">How do I manage contractors and vendors?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              You can maintain a directory of your trusted contractors and service providers on the <Link href="/contractors" className="text-primary underline">Contractors</Link> page. For each contractor, you can store their name, specialty, contact details (email and phone), and any relevant notes. This list is then used to assign jobs in the Maintenance section, keeping your records organised.
            </AccordionContent>
          </AccordionItem>

          {/* Expenses Section */}
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold">How do I manage expenses?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              Use the <Link href="/expenses" className="text-primary underline">Expenses</Link> page to log all costs. You can categorise each expense (e.g., Repairs, Insurance), assign it to a property, link it to a contractor from your list, and add notes or a URL to a receipt. The system supports both "One-off" and "Recurring" expenses, helping you track everything from a single repair to monthly management fees.
            </AccordionContent>
          </AccordionItem>

          {/* Reports Section */}
          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg font-semibold">What kind of reports can I generate?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/reports" className="text-primary underline">Financial Reports</Link> page provides powerful tools to understand your business's performance.
              <br /><br />
              - **Interactive Dashboards:** Switch between a "Revenue Analysis" view to compare projected vs. actual income, and a "P&L Statement" view that summarises your income and expenses for any period. You can toggle between monthly and yearly views and navigate through different periods.
              <br /><br />
              - **AI-Powered P&L Statements:** For a more formal report, use the "P&L Statement" generator. This AI tool creates a professional Profit and Loss statement with an executive summary, suitable for sharing with banks or investors.
              <br /><br />
              - **AI-Powered Market Research:** Get an AI-generated analysis of how your properties' rental prices compare to current market rates in Kenya, complete with data-backed recommendations.
            </AccordionContent>
          </AccordionItem>

          {/* Arrears Section */}
          <AccordionItem value="item-7">
            <AccordionTrigger className="text-lg font-semibold">How can I see who is behind on rent?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/arrears" className="text-primary underline">Arrears</Link> page automatically lists all tenants with outstanding balances on payments that are past their due date. It shows how much is owed, how many days the payment is overdue, and provides two actions:
              <br /><br />
              - **Send Reminder:** This button opens a pre-filled email to the tenant, which you can send from your own email client.
              <br /><br />
              - **Request Payment:** This button opens a dialog to initiate a payment request. This feature is designed for future integration with payment gateways like Pesapal or InstaSend to automate M-Pesa payment requests.
            </AccordionContent>
          </AccordionItem>
          
           {/* Calendar Section */}
          <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg font-semibold">What is the Calendar for?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              The <Link href="/calendar" className="text-primary underline">Calendar</Link> provides a visual timeline of important events. It automatically populates with tenancy start and end dates, logged expense transactions, and reported maintenance requests, giving you a clear view of key dates and activities across your portfolio each month.
            </AccordionContent>
          </AccordionItem>
          
           {/* Account Section */}
          <AccordionItem value="item-9">
            <AccordionTrigger className="text-lg font-semibold">Can I change the currency or other settings?</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">
              Yes. The <Link href="/settings" className="text-primary underline">Account</Link> page is where you manage all your personal and application-wide settings. It is organized into two tabs:
              <br /><br />
              - **Profile & Settings:** Customise the currency, date format, and color theme. You can also set your company name and logo for reports, define your tax residency status (which affects P&L report calculations), enable or disable AI features, and change your password.
              <br /><br />
              - **Subscription & Billing:** Manage your LeaseLync subscription plan. When you first sign up, you will be directed here to choose a plan.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
