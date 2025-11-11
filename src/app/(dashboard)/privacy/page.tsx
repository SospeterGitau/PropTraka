
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Our privacy policy outlines how LeaseLync collects, uses, and manages personal data, clarifying our role as a Data Processor and your responsibilities as a Data Controller under the Kenya Data Protection Act, 2019 (DPA).',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <PageHeader title="Privacy Policy" />
      <div className="max-w-4xl mx-auto prose prose-sm sm:prose-base">
        <p><strong>Last Updated:</strong> {lastUpdated}</p>

        <h2 className="pt-4 font-bold">1. Introduction</h2>
        <p>
          Welcome to LeaseLync. This Privacy Policy explains how LeaseLync processes personal data. A critical distinction under data protection laws, including the Kenya Data Protection Act, 2019 (DPA), is the role of the Data Controller and the Data Processor.
        </p>
        <ul>
            <li><strong>You, the user of LeaseLync, are the Data Controller.</strong> You own and control the personal data of your tenants that you enter into the application.</li>
            <li><strong>LeaseLync acts as the Data Processor on your behalf.</strong> Our application stores and processes this data based on your instructions to provide you with property management services.</li>
        </ul>
        <p>
          This policy details our role as a Data Processor and your responsibilities as a Data Controller under the DPA.
        </p>

        <h2 className="pt-4 font-bold">2. Data We Process on Your Behalf</h2>
        <p>
          LeaseLync processes the following categories of personal data about your tenants ("Data Subjects"), which you provide:
        </p>
        <ul>
          <li><strong>Identity and Contact Data:</strong> Tenant's full name, email address, and phone number.</li>
          <li><strong>Tenancy and Financial Data:</strong> Information linking a tenant to a property, including lease start/end dates, rent amounts, service charges, deposits, and payment records.</li>
        </ul>
        
        <h2 className="pt-4 font-bold">3. Data We Collect for Service Improvement</h2>
        <p>
          To maintain and improve our service, LeaseLync also collects anonymous usage data through Google Analytics for Firebase. This includes:
        </p>
        <ul>
            <li><strong>Usage Data:</strong> Information such as which pages are visited (e.g., `/dashboard`, `/properties`), features used, and general interaction patterns.</li>
        </ul>
        <p>
           This data is aggregated and anonymised. It does not contain any of your tenants' personal information and is used solely for the purpose of identifying bugs, improving app performance, and enhancing the user experience.
        </p>

        <h2 className="pt-4 font-bold">4. Purpose of Data Processing</h2>
        <p>
          As a Data Processor, LeaseLync uses the personal data you provide exclusively to:
        </p>
        <ul>
          <li>Associate revenue and expense transactions with specific tenancies and properties.</li>
          <li>Track rental payments and manage arrears.</li>
          <li>Enable you to send reminders and communications to tenants.</li>
          <li>Facilitate payment requests through integrated payment gateways.</li>
        </ul>

        <h2 className="pt-4 font-bold">5. Lawful Basis for Processing</h2>
        <p>
          As the Data Controller, you are responsible for ensuring you have a lawful basis under the DPA for processing tenant data. The two primary lawful bases in this context are:
        </p>
         <ul>
            <li><strong>Performance of a Contract:</strong> Processing the data is necessary to manage the tenancy agreement between you and your tenant.</li>
            <li><strong>Consent:</strong> You have obtained clear and explicit consent from the tenant to use their data for the purposes outlined in this policy. The "Add Tenancy" form includes a mandatory consent checkbox to help you document this.</li>
        </ul>

        <h2 className="pt-4 font-bold">6. Data Storage and Security</h2>
        <p>
          All data you enter into LeaseLync is stored securely in Google Cloud Firestore. We take the following measures to protect it:
        </p>
         <ul>
            <li><strong>Access Control:</strong> Firestore Security Rules ensure that only you, the authenticated owner of the data, can read, create, update, or delete your information.</li>
            <li><strong>Encryption:</strong> All data is automatically encrypted in transit between the app and Google's servers, and encrypted at rest when stored in Firestore.</li>
        </ul>
        <p>
          You are responsible for securing your account credentials and the devices on which you use LeaseLync.
        </p>
        
        <h2 className="pt-4 font-bold">7. Data Retention</h2>
        <p>
          LeaseLync retains tenant data as long as their tenancy records exist within your account. As the Data Controller, it is your responsibility to remove personal data when it is no longer necessary for its original purpose. You can permanently delete a tenancy and all associated personal information at any time from the app.
        </p>

        <h2 className="pt-4 font-bold">8. Data Subject Rights</h2>
        <p>
          Under the DPA, tenants have rights over their personal data. You, as the Data Controller, are responsible for handling their requests. LeaseLync provides you with the tools to fulfill these rights:
        </p>
        <ul>
          <li><strong>Right to Access:</strong> You can access all tenant data via the Revenue, Arrears, and specific Tenancy Detail pages.</li>
          <li><strong>Right to Rectification:</strong> You can edit tenancy details to correct any inaccurate information.</li>
          <li><strong>Right to Erasure:</strong> You can delete a tenancy record, which permanently erases the tenant's personal data from the app's database.</li>
        </ul>

        <h2 className="pt-4 font-bold">9. Changes to this Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>

        <h2 className="pt-4 font-bold">10. Disclaimer</h2>
        <p>
          This Privacy Policy is for informational purposes only and does not constitute legal advice. You should consult with a legal professional to ensure your full compliance with all applicable data protection laws, including the Kenya Data Protection Act, 2019.
        </p>
      </div>
    </>
  );
}
