import { SiteHeader } from "@/components/SiteHeader";
import { ConfirmListingForm } from "@/components/ConfirmListingForm";

export default function CheckListingPage() {
  return (
    <main>
      <SiteHeader />
      <div className="mt-4">
        <ConfirmListingForm />
      </div>
    </main>
  );
}
