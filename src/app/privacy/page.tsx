import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  return (
    <main>
      <SiteHeader />
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Effective 23 August 2026. Last updated 30 August 2026.
      </p>

      <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <p>
          This policy explains how bidboard.com.au ("Bidboard") handles information.
          Contact:{" "}
          <a href="mailto:sunny.singh@outlook.com" className="underline">
            sunny.singh@outlook.com
          </a>
          .
        </p>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Who is responsible</h2>
          <p>
            The operator of bidboard.com.au is responsible for personal information
            collected through the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">What we collect</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Listing details you submit: website URL, category, bid amount, and any
              public name, description, or logo we fetch from that website.
            </li>
            <li>
              Payment confirmation from Stripe (session id, amount, payment status).
              Card details are collected by Stripe, not by Bidboard.
            </li>
            <li>Clicks on listings, used to show click counts and reduce abuse.</li>
            <li>
              Technical data such as IP address, user agent, and referrer, processed
              by our host (Vercel) and database provider for security and operation.
            </li>
            <li>Emails you send us, kept so we can reply and keep a legal record.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Cookies</h2>
          <p>
            We use a strictly necessary cookie to keep you logged in to the admin
            area, and a local setting for light/dark mode. We do not run advertising
            cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Why we use this data</h2>
          <p>
            To run the leaderboard, process payments, prevent fraud and fake clicks,
            respond to you, and meet legal and accounting duties.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Public listings</h2>
          <p>
            Listings are public. Title, description, logo, URL, category, bid, and
            click counts are visible to anyone. Do not submit information you want
            to keep private.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Who we share data with</h2>
          <p>
            Stripe (payments), Vercel (hosting), and our database host. We do not
            sell personal information. Overseas processors may store data outside
            Australia; we only use them to operate the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">How long we keep it</h2>
          <p>
            Listings stay until removed. Payment records are kept for accounting and
            fraud prevention. Click logs are kept only as needed for rate limiting
            and the public count. You can ask us to remove a listing by emailing
            sunny.singh@outlook.com.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Your rights</h2>
          <p>
            Under the Australian Privacy Principles you may request access to, or
            correction of, personal information we hold about you. Email
            sunny.singh@outlook.com. If you are unhappy with our response you can
            contact the Office of the Australian Information Commissioner.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Children</h2>
          <p>The Service is for adults. We do not knowingly collect information from children.</p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-black dark:text-white">Changes</h2>
          <p>
            We may update this policy. The date at the top will change. Continued use
            of Bidboard after an update means you accept the new policy.
          </p>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
