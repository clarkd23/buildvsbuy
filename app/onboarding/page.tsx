import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to buyvsbuild.ai</h1>
          <p className="text-gray-500 text-sm">One thing before you dive in.</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-blue-800 mb-2">Free plan — how it works</p>
          <p className="text-sm text-blue-700 leading-relaxed">
            This tool is free to use. In exchange, your problem statement and analysis results
            may be shared with relevant vendors who can help with your project. We never share
            your personal contact info beyond your email.
          </p>
        </div>

        <ul className="space-y-3 mb-8">
          <li className="flex items-start gap-3 text-sm text-gray-600">
            <span className="text-green-500 mt-0.5 font-bold">✓</span>
            Unlimited analyses
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-600">
            <span className="text-green-500 mt-0.5 font-bold">✓</span>
            Full AI-powered vendor research
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-600">
            <span className="text-green-500 mt-0.5 font-bold">✓</span>
            Build challenge deep dives + component pricing
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-500">
            <span className="text-gray-300 mt-0.5 font-bold">~</span>
            Your analysis data shared with vendors (anonymized contact info)
          </li>
        </ul>

        <Link
          href="/"
          className="block w-full text-center bg-gray-900 text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
        >
          Start analyzing →
        </Link>

        <p className="text-center text-xs text-gray-400 mt-4">
          Want full privacy?{" "}
          <Link href="/pricing" className="underline hover:text-gray-600">
            See Pro plan
          </Link>
          {" "}(coming soon)
        </p>
      </div>
    </div>
  );
}
