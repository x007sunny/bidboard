import { SiteHeader } from "@/components/SiteHeader";
import { ConfirmListingForm } from "@/components/ConfirmListingForm";
import { getVisitorStats } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export default async function CheckListingPage() {
  const { onlineNow, totalVisitors } = await getVisitorStats();

  return (
    <main>
      <SiteHeader onlineNow={onlineNow} totalVisitors={totalVisitors} />
      <div className="mt-4">
        <ConfirmListingForm />
      </div>
    </main>
  );
}
