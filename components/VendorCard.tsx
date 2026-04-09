import { Vendor } from "@/types/analysis";

export default function VendorCard({ vendor, context }: { vendor: Vendor; context?: string }) {
  const introHref = `mailto:clarkd23@gmail.com?subject=${encodeURIComponent(`Intro request: ${vendor.name}`)}&body=${encodeURIComponent(`Hi,\n\nI found ${vendor.name} while researching a build vs buy decision on buyorbuild.ai.\n\n${context ? `Context: ${context}\n\n` : ""}I'd love an introduction. Could you help connect me?\n\nThanks`)}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-gray-900 text-lg">{vendor.name}</h3>
            {vendor.researched
              ? <span className="text-xs bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5 font-medium">Researched</span>
              : <span className="text-xs bg-gray-100 text-gray-400 rounded-full px-2 py-0.5">Found</span>
            }
          </div>
          <a
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 text-sm hover:underline truncate block max-w-[200px]"
          >
            {vendor.url}
          </a>
        </div>
        <div className="flex flex-col items-center ml-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              vendor.fit_score >= 8
                ? "bg-green-500"
                : vendor.fit_score >= 6
                ? "bg-yellow-500"
                : "bg-red-400"
            }`}
          >
            {vendor.fit_score}
          </div>
          <span className="text-xs text-gray-400 mt-1">fit</span>
        </div>
      </div>

      <div className="mb-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
        <span className="font-medium">Pricing: </span>
        {vendor.pricing_info}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Pros</p>
          <ul className="space-y-1">
            {vendor.pros.map((pro, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-1">
                <span className="text-green-500 mt-0.5">+</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Cons</p>
          <ul className="space-y-1">
            {vendor.cons.map((con, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-1">
                <span className="text-red-400 mt-0.5">−</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(vendor.reddit_pros?.length || vendor.reddit_cons?.length) ? (
        <div className="mb-3 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="10"/><path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 .07-.5l-2.38-.5a.25.25 0 0 0-.3.19l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .62-1.39zm-9.5 1a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.64a3.57 3.57 0 0 1-2.75.89 3.57 3.57 0 0 1-2.75-.89.25.25 0 0 1 .35-.35 3.13 3.13 0 0 0 2.4.74 3.13 3.13 0 0 0 2.4-.74.25.25 0 0 1 .35.35zm-.17-1.64a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>
            What Reddit says
          </p>
          <div className="grid grid-cols-2 gap-3">
            {vendor.reddit_pros && vendor.reddit_pros.length > 0 && (
              <ul className="space-y-1">
                {vendor.reddit_pros.map((p, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1">
                    <span className="text-green-500 mt-0.5 shrink-0">+</span>{p}
                  </li>
                ))}
              </ul>
            )}
            {vendor.reddit_cons && vendor.reddit_cons.length > 0 && (
              <ul className="space-y-1">
                {vendor.reddit_cons.map((c, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1">
                    <span className="text-red-400 mt-0.5 shrink-0">−</span>{c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : vendor.researched ? (
        <div className="mb-3 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse inline-block" />
            Loading Reddit sentiment…
          </p>
        </div>
      ) : null}

      {vendor.notable_features.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Key Features</p>
          <div className="flex flex-wrap gap-1">
            {vendor.notable_features.map((f, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {vendor.fit_score >= 7 && (
        <a
          href={introHref}
          className="block w-full text-center text-xs font-medium bg-gray-900 text-white rounded-lg py-2 hover:bg-gray-700 transition-colors"
        >
          Request intro →
        </a>
      )}
    </div>
  );
}
