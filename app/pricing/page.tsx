import Link from "next/link";

function PlanCard({
  name,
  price,
  description,
  features,
  cta,
  ctaHref,
  comingSoon,
  highlighted,
}: {
  name: string;
  price: string;
  description: string;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaHref?: string;
  comingSoon?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-7 flex flex-col ${highlighted ? "border-gray-900 shadow-md" : "border-gray-200"} bg-white`}>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
          {comingSoon && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
              Coming soon
            </span>
          )}
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{price}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <ul className="space-y-2.5 mb-7 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className={`mt-0.5 font-bold ${f.included ? "text-green-500" : "text-gray-300"}`}>
              {f.included ? "✓" : "✗"}
            </span>
            <span className={f.included ? "text-gray-700" : "text-gray-400"}>{f.text}</span>
          </li>
        ))}
      </ul>

      {comingSoon ? (
        <button
          disabled
          className="w-full text-center bg-gray-100 text-gray-400 px-5 py-3 rounded-xl font-medium cursor-not-allowed"
        >
          {cta}
        </button>
      ) : (
        <Link
          href={ctaHref ?? "/sign-up"}
          className="block w-full text-center bg-gray-900 text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Simple pricing</h1>
          <p className="text-gray-500">Start for free. Upgrade when you need privacy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlanCard
            name="Free"
            price="$0"
            description="Forever free, unlimited analyses"
            features={[
              { text: "Unlimited analyses", included: true },
              { text: "Full vendor research", included: true },
              { text: "Build challenge deep dives", included: true },
              { text: "LLM vs deterministic breakdown", included: true },
              { text: "Analysis data shared with relevant vendors", included: false },
            ]}
            cta="Get started free"
            ctaHref="/sign-up"
          />
          <PlanCard
            name="Pro"
            price="$29/mo"
            description="25 analyses per month, full privacy"
            features={[
              { text: "25 analyses per month", included: true },
              { text: "Full vendor research", included: true },
              { text: "Build challenge deep dives", included: true },
              { text: "LLM vs deterministic breakdown", included: true },
              { text: "Data never shared with vendors", included: true },
            ]}
            cta="Coming soon"
            comingSoon={true}
            highlighted={true}
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Questions?{" "}
          <a href="mailto:hello@buyvsbuild.ai" className="underline hover:text-gray-600">
            Get in touch
          </a>
        </p>
      </div>
    </main>
  );
}
