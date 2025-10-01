
import { PageHeader } from '@/components/page-header';

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader title="Privacy Policy" />
      <div className="max-w-4xl mx-auto prose prose-sm sm:prose-base">
        <h2>Privacy Policy for RentVision</h2>
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h3>1. Introduction</h3>
        <p>
          This Privacy Policy outlines how RentVision ("the App") collects, uses, and manages personal data. 
          The user of this app ("you", "the Landlord") acts as the **Data Controller** for the personal data you enter into the App. 
          This app acts as a **Data Processor** on your behalf. This policy is designed to inform you of your responsibilities and how the App processes data.
        </p>

        <h3>2. Data We Process</h3>
        <p>
          The App processes the following categories of personal data about your tenants ("Data Subjects"):
        </p>
        <ul>
          <li><strong>Tenant Name:</strong> To identify the individual associated with a tenancy.</li>
          <li><strong>Tenant Email Address:</strong> To facilitate communication, such as sending rent reminders.</li>
        </ul>
        <p>
          This data is provided by you, the Landlord. It is your responsibility to ensure you have a lawful basis for processing this data, such as the tenant's consent or a contractual necessity.
        </p>

        <h3>3. Purpose of Data Processing</h3>
        <p>
          The personal data entered into the App is used exclusively for the following purposes:
        </p>
        <ul>
          <li>To associate revenue transactions (rent payments) with a specific tenant and property.</li>
          <li>To track payments and manage arrears.</li>
          <li>To enable you to send rent reminders via your own email client.</li>
        </ul>

        <h3>4. Lawful Basis for Processing</h3>
        <p>
          As the Data Controller, you are responsible for ensuring that you have a lawful basis for collecting and processing tenant data under the Kenya Data Protection Act, 2019. The App provides a consent checkbox in the "Add Tenancy" form to assist you in documenting that you have obtained the necessary consent from the tenant.
        </p>

        <h3>5. Data Storage and Security</h3>
        <p>
          All data you enter into RentVision, including personal data, is stored locally within your browser's storage on your device. It is not transmitted to or stored on any external servers owned or managed by RentVision.
        </p>
        <p>
          You are responsible for securing the device on which you use this App.
        </p>
        
        <h3>6. Data Retention</h3>
        <p>
          The App will retain tenant data as long as their tenancy records exist within the App. It is your responsibility as the Data Controller to remove or anonymize personal data when it is no longer needed for the purposes for which it was collected. You can delete a tenancy at any time, which will remove all associated personal information from the App's storage.
        </p>

        <h3>7. Data Subject Rights</h3>
        <p>
          Under the DPA, tenants have rights over their personal data. As the Data Controller, you are responsible for handling their requests. The App enables you to fulfill these rights:
        </p>
        <ul>
          <li><strong>Right to Access:</strong> You can access tenant data via the Revenue and Arrears pages.</li>
          <li><strong>Right to Rectification:</strong> You can edit tenancy details to correct any inaccurate information.</li>
          <li><strong>Right to Erasure:</strong> You can delete a tenancy record, which will erase the tenant's personal data from the App.</li>
        </ul>

        <h3>8. Changes to this Privacy Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </p>

        <h3>9. Disclaimer</h3>
        <p>
          This Privacy Policy is for informational purposes only and does not constitute legal advice. You should consult with a legal professional to ensure your full compliance with the Kenya Data Protection Act.
        </p>
      </div>
    </>
  );
}
