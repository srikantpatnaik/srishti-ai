import axios from "axios"
import { TtlCache } from "./cache"

const cache = new TtlCache(5 * 60 * 1000) // 5 min

export interface NewsArticle {
  title: string
  source: string
  time: string
  summary: string
  category?: string
  imageUrl?: string
  link?: string
}

const FEEDS: Record<string, string[]> = {
  top: [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://www.ndtv.com/rss",
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  ],
  business: [
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
  ],
  sports: [
    "https://www.espn.com/espn/rss/news",
    "https://timesofindia.indiatimes.com/sports-heads/rssfeedstopstories.cms",
  ],
}

function sourceName(url: string): string {
  return url.includes("ndtv") ? "NDTV"
    : url.includes("timesofindia") ? "TOI"
    : url.includes("economictimes") ? "ET"
    : url.includes("bbc") ? "BBC"
    : url.includes("espn") ? "ESPN"
    : "Unknown"
}

function timeAgo(isoDate: string): string {
  const d = new Date(isoDate)
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export async function getNews(category: string, limit: number = 10): Promise<{ structured: NewsArticle[]; result: string }> {
  const t0 = Date.now()
  console.log(`[tools] news(category=${category}, limit=${limit})`)
  const key = `news:${category}:${limit}`
  const cached = cache.get(key) as { structured: NewsArticle[]; result: string }
  if (cached) {
    console.log(`[tools] news HIT ${Date.now()-t0}ms`)
    return cached
  }

  const { default: Parser } = await import("rss-parser")
  const parser = new Parser()

  const urls = FEEDS[category.toLowerCase()] || FEEDS.top
  const rawArticles: Array<{ title: string; link: string; isoDate?: string; description?: string; mediaContent?: Array<{ url: string }> }> = []

  for (const feedUrl of urls) {
    try {
      const resp = await axios.get(feedUrl, {
        timeout: 5000,
        headers: { "User-Agent": "Mozilla/5.0 (SrishtiAI News Reader)" },
        maxRedirects: 5,
      })

      const feed = await parser.parseString(resp.data)
      const src = sourceName(feedUrl)

      for (const item of (feed.items ?? []).slice(0, limit * 2)) {
        const title = (item.title || "").replace(/<[^>]*>/g, "").trim()
        if (!title) continue
        rawArticles.push({
          title,
          link: typeof item.link === "string" ? item.link : "#",
          isoDate: typeof item.isoDate === "string" ? item.isoDate : undefined,
          description: (item.description || "").replace(/<[^>]*>/g, "").trim().substring(0, 200),
          mediaContent: (item.mediaContent as any[]) || (item["media:content"] as any[]) || [],
        })
      }

      if (rawArticles.length >= limit) break
    } catch (e: any) {
      console.log(`[tools] news feed FAIL ${feedUrl}: ${e.message}`)
    }
  }

  const items: NewsArticle[] = rawArticles.slice(0, limit).map(a => ({
    title: a.title,
    source: sourceName(urls[0] || ""),
    time: a.isoDate ? timeAgo(a.isoDate) : "",
    summary: a.description || a.title,
    link: a.link,
    imageUrl: a.mediaContent?.[0]?.url,
    category: category !== "top" ? category : undefined,
  }))

  if (!items.length) {
    console.log(`[tools] news EMPTY ${Date.now()-t0}ms`)
    return {
      structured: [],
      result: `[news] No articles available for "${category}".`,
    }
  }

  const lines = [`News: ${category.toUpperCase()} (${items.length} articles)`, ""]
  items.forEach((a, i) => {
    lines.push(`${i + 1}. [${a.source}] ${a.title}${a.time ? ` (${a.time})` : ""}`)
    if (a.summary && a.summary !== a.title) lines.push(`   ${a.summary}`)
  })

  const result = lines.join("\n")
  const out = { structured: items, result }
  cache.set(key, out)
  console.log(`[tools] news OK ${Date.now()-t0}ms (${items.length} articles)`)
  return out
}
