import React from "react"

export interface NewsArticle {
  title: string
  source: string
  time: string
  summary: string
  category?: string
  imageUrl?: string
}

export interface NewsCardData {
  query: string
  articles: NewsArticle[]
  totalResults?: number
}

interface NewsCardProps {
  data: NewsCardData
}

const categoryColors: Record<string, string> = {
  "politics": "bg-purple-500/20 text-purple-400",
  "sports": "bg-green-500/20 text-green-400",
  "tech": "bg-blue-500/20 text-blue-400",
  "business": "bg-yellow-500/20 text-yellow-400",
  "entertainment": "bg-pink-500/20 text-pink-400",
  "world": "bg-cyan-500/20 text-cyan-400",
  "india": "bg-orange-500/20 text-orange-400",
}

function NewsArticleCard({ article }: { article: NewsArticle }) {
  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {article.imageUrl && (
        <div className="h-40 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        {article.category && (
          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${categoryColors[article.category.toLowerCase()] || "bg-gray-500/20 text-gray-400"}`}>
            {article.category}
          </span>
        )}
        <h4 className="text-base font-bold text-[#e5e5e5] mt-2 leading-tight">{article.title}</h4>
        <p className="text-sm text-[#6b7280] mt-2">{article.summary}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs font-medium text-[#9ca3af]">{article.source}</span>
          <span className="text-xs text-[#4b5563]">•</span>
          <span className="text-xs text-[#4b5563]">{article.time}</span>
        </div>
      </div>
    </div>
  )
}

export function NewsCard({ data }: NewsCardProps) {
  return (
    <div
      className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div>
          <span className="text-xs text-[#6b7280] uppercase tracking-wider">News</span>
          <h3 className="text-sm font-semibold text-[#e5e5e5] mt-0.5">{data.query}</h3>
        </div>
        <span className="text-[10px] text-[#6b7280]">
          {data.totalResults || data.articles.length} results
        </span>
      </div>

      {/* Responsive grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.articles.map((article, i) => (
            <NewsArticleCard key={i} article={article} />
          ))}
        </div>
      </div>
    </div>
  )
}
