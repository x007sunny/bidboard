import { SiteHeader } from "@/components/SiteHeader";
import { ConfirmListingForm } from "@/components/ConfirmListingForm";

export const dynamic = "force-dynamic";

export default async function CheckListingPage() {
  return (
    <main>
      <SiteHeader />
      <div className="mt-4">
        <ConfirmListingForm />
      </div>
    </main>
  );
}
