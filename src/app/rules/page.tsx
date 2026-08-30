import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function RulesPage() {
  return (
    <main>
      <SiteHeader />
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Rules</h1>

      <div className="space-y-6 text-sm text-neutral-700 leading-relaxed max-w-lg dark:text-neutral-300">
        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">How ranking works</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>New listings start at $5 AUD minimum.</li>
            <li>Highest bid = highest rank. That is the only ranking rule.</li>
            <li>
              To go above any listing — including #1 — you only need to bid $1 more than that
              listing. There is no extra $5 jump for the top spot.
            </li>
            <li>
              You can still bid less than the current #1 price. You go on the board at whatever
              rank that amount can reach.
            </li>
            <li>
              Already listed? Enter the same URL and only pay the difference. The new bid must be
              at least $1 more than your current bid.
            </li>
            <li>If two bids are equal, the older listing keeps the higher rank.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">What you can list</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>A business website — yourproduct.com.au</li>
            <li>A Facebook page — facebook.com/yourpage</li>
            <li>An Instagram page — instagram.com/yourpage</li>
            <li>Paste the full URL. Bare @handles are not enough.</li>
            <li>Chat and invite links (Telegram, WhatsApp, Discord) are not allowed.</li>
            <li>Illegal or adult content is not allowed.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">How listings are filled in</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Websites: we pull the public title, description, and logo from the page.</li>
            <li>Facebook: we use the page name, intro if available, and the page profile photo.</li>
            <li>Instagram: we use the public profile name, bio, and profile photo.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2 dark:text-white">Payments</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>All amounts are in Australian dollars, paid through Stripe.</li>
            <li>Payments are final except where Australian Consumer Law says otherwise.</li>
            <li>We may remove a listing that breaks these rules, without a refund.</li>
          </ul>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
