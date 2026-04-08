import { Vendor } from "@/types/analysis";

export default function VendorCard({ vendor, context }: { vendor: Vendor; context?: string }) {
  const introHref = `mailto:clarkd23@gmail.com?subject=${encodeURIComponent(`Intro request: ${vendor.name}`)}&body=${encodeURIComponent(`Hi,\n\nI found ${vendor.name} while researching a build vs buy decision on buildvsbuy.ai.\n\n${context ? `Context: ${context}\n\n` : ""}I'd love an introduction. Could you help connect me?\n\nThanks`)}`;

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
