import Link from "next/link";

export default function RulesPage() {
  return (
    <main>
      <header className="mb-8">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black">
          ← Back
        </Link>
      </header>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">Rules</h1>

      <div className="space-y-6 text-sm text-neutral-700 leading-relaxed max-w-lg">
        <section>
          <h2 className="font-semibold text-black mb-2">How ranking works</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>New listings start at $5 AUD minimum.</li>
            <li>Highest bid = highest rank. Nothing else matters.</li>
            <li>To take #1 you must bid at least $5 more than the current top bid.</li>
            <li>Paying less still puts you on the board at whatever rank that amount can reach.</li>
            <li>Already listed? Enter the same URL or @handle and only pay the difference to raise your position.</li>
            <li>Equal bids: the older listing keeps the higher rank.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-black mb-2">What you can list</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>A business website, online shop, or an X @handle.</li>
            <li>Chat and invite links are not allowed.</li>
            <li>Illegal or adult content is not allowed.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
