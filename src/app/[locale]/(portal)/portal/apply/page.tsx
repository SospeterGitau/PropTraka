import { TenantApplicationForm } from "@/components/portal/TenantApplicationForm";

export default function TenantApplicationPage() {
    return (
        <div className="container py-10 max-w-4xl">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Tenant Application</h1>
                <p className="text-muted-foreground">
                    Complete the form below to apply for your rental. Our AI-powered system ensures a fair assessment for everyone.
                </p>
            </div>
            <TenantApplicationForm />
        </div>
    );
}
