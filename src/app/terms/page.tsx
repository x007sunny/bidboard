import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  return (
    <main>
      <SiteHeader />
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Effective 23 August 2026. Last updated 30 August 2026.
      </p>

      <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <p>
          These Terms of Service ("Terms") govern your use of bidboard.com.au
          ("Bidboard", "the Service"). By using the Service or paying for a listing
          you agree to these Terms and the public{" "}
          <a href="/rules" className="underline">
            Rules
          </a>
          . If they conflict, these Terms prevail.
        </p>
        <p>
          Contact:{" "}
          <a href="mailto:sunny.singh@outlook.com" className="underline">
            sunny.singh@outlook.com
          </a>
        </p>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">The Service</h2>
          <p>
            Bidboard is Australia's pay-to-rank business leaderboard. You pay to
            place or raise a public listing for a website URL. Rank is determined by
            bid amount in Australian dollars. Listings are paid advertisements, not
            reviews, certifications, or endorsements. Higher bids can outrank you at
            any time. We do not guarantee traffic, clicks, leads, or time at a rank.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Eligibility</h2>
          <p>
            You must be 18 or older and able to enter a contract. If you list for a
            company, you must have authority to bind it. You must not use the Service
            if Australian law prohibits you from doing so.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Payments</h2>
          <p>
            Payments are processed by Stripe. Amounts are in AUD. Applicable taxes
            (including GST, if any) may be added at checkout. Rank is assigned after
            Stripe confirms payment. Minimum bids, #1 increments, and how raises work
            are described in the Rules and shown before you pay.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">No refunds</h2>
          <p>
            All payments are final and non-refundable except where Australian Consumer
            Law requires otherwise. The Service is performed immediately when your
            listing is created or your bid is raised. Being outranked, losing clicks,
            downtime, or removal for breach does not entitle you to a refund.
            Chargebacks without a legal basis are a breach and may lead to removal
            and a ban.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Listings</h2>
          <p>
            You may only list a website you are authorised to represent. Destinations
            must be lawful, not adult or illegal content, and not chat/invite links.
            We may fetch public metadata (title, description, logo) from your URL and
            display it on the leaderboard. We may refuse, edit, hide, or remove a
            listing with or without notice if it breaches these Terms, the Rules, or
            the law, or if there is a legal, security, or reputational risk. Removal
            does not create a refund.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Your warranties</h2>
          <p>
            You warrant that you have the right to list the URL, that the destination
            complies with law, that you are not impersonating anyone, and that the
            site is not malware, phishing, or deceptive.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Fair use of brands</h2>
          <p>
            Public names, logos, and descriptions are displayed only to identify the
            listed business. That is not an endorsement. Do not copy the Service or
            scrape it to build a competing product.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Licence</h2>
          <p>
            You grant Bidboard a worldwide, non-exclusive, royalty-free licence to
            host, cache, and display your listing and fetched metadata so visitors
            can see the leaderboard. To request a takedown, email
            sunny.singh@outlook.com. A takedown does not refund payment.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">No endorsement</h2>
          <p>
            We do not verify product claims. Click and visitor counts are reported
            figures, not guarantees. Linked websites have their own terms. Bidboard
            is not responsible for those destinations.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Availability</h2>
          <p>
            The Service is provided as-is and may be unavailable, slow, or inaccurate.
            We may change ranking rules, categories, or these Terms. Continued use
            after an update means you accept the new Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Liability</h2>
          <p>
            To the extent permitted by Australian Consumer Law, we exclude lost
            profits, data, goodwill, and indirect loss. Nothing in these Terms limits
            liability that cannot be limited by law, including for fraud or personal
            injury. For payment-related claims that can be limited, liability is
            capped at the amount you paid in the previous three months.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Indemnity</h2>
          <p>
            You will indemnify the operator of Bidboard against claims arising from
            your listing, destination, payment, or breach of these Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Governing law</h2>
          <p>
            These Terms are governed by the laws of Victoria, Australia. Mandatory
            consumer protections under Australian Consumer Law still apply.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Questions</h2>
          <p>
            Email{" "}
            <a href="mailto:sunny.singh@outlook.com" className="underline">
              sunny.singh@outlook.com
            </a>
            .
          </p>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
