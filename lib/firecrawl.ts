import FirecrawlApp from "@mendable/firecrawl-js";

function getFirecrawl() {
  return new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
}

const SEARCH_LIMIT = 10;  // vendors found in search
const SCRAPE_LIMIT = 6;   // vendors deep-researched (scraped)

export interface VendorSearchResult {
  name: string;
  url: string;
}

export interface VendorScrapeResult {
  name: string;
  url: string;
  content: string;
  researched: boolean;
}

export async function searchVendors(query: string): Promise<VendorSearchResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await getFirecrawl().search(query, { limit: SEARCH_LIMIT }) as any;

  if (response.success === false) {
    throw new Error(`Firecrawl search error: ${response.error ?? "unknown"}`);
  }

  const results: { url?: string; title?: string }[] = response.web ?? [];
  if (results.length === 0) throw new Error("Firecrawl search returned no results");

  return results
    .filter((r) => r.url)
    .slice(0, SEARCH_LIMIT)
    .map((r) => ({
      name: r.title?.split(/[-|]/)[0].trim() || new URL(r.url!).hostname,
      url: r.url!,
    }));
}

export async function scrape(url: string): Promise<string> {
  const response = await getFirecrawl().scrape(url, { formats: ["markdown"] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (response as any).markdown ?? "";
}

// Scrapes the first SCRAPE_LIMIT vendors; the rest are returned as found-only.
export async function scrapeVendors(vendors: VendorSearchResult[]): Promise<VendorScrapeResult[]> {
  const toScrape = vendors.slice(0, SCRAPE_LIMIT);
  const foundOnly = vendors.slice(SCRAPE_LIMIT);

  const scraped = await Promise.allSettled(
    toScrape.map(async (vendor) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await getFirecrawl().scrape(vendor.url, { formats: ["markdown"] }) as any;
      return {
        name: vendor.name,
        url: vendor.url,
        content: response.markdown ?? "Could not retrieve content.",
        researched: true,
      };
    })
  );

  const scrapedResults: VendorScrapeResult[] = scraped
    .filter((r): r is PromiseFulfilledResult<VendorScrapeResult> => r.status === "fulfilled")
    .map((r) => r.value);

  const foundOnlyResults: VendorScrapeResult[] = foundOnly.map((v) => ({
    name: v.name,
    url: v.url,
    content: "",
    researched: false,
  }));

  return [...scrapedResults, ...foundOnlyResults];
}
