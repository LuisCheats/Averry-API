import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

/**
 * Limpia URLs de TikWM
 */
function formatUrl(url) {
  if (!url) return null
  if (url.startsWith("http")) return url
  return `https://www.tikwm.com${url}`
}

class TikWMClient {
  constructor(config = {}) {
    this.config = {
      baseURL: "https://www.tikwm.com",
      timeout: 15000,
      ...config,
    }

    this.axios = axios.create({
      ...this.config,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      },
    })
  }

  async process(url) {
    try {
      const endpoint = `/api/?url=${encodeURIComponent(url)}&hd=1`
      const { data } = await this.axios.get(endpoint)

      const d = data?.data
      if (!d) {
        throw new Error("No data returned from TikWM")
      }

      return {
        original_url: url,
        type: "video",
        urls: {
          hd: formatUrl(d.hdplay || d.play),
          wm: formatUrl(d.wmplay),
          audio: formatUrl(d.music),
        },
        metadata: {
          title: d.title || null,
          thumbnail: formatUrl(d.cover),
          creator: {
            nickname: d.author?.nickname || null,
            username: d.author?.unique_id || null,
            avatar: formatUrl(d.author?.avatar),
          },
          stats: {
            views: d.play_count || 0,
            likes: d.digg_count || 0,
            comments: d.comment_count || 0,
            shares: d.share_count || 0,
          },
        },
      }
    } catch (error) {
      return {
        original_url: url,
        error: error.message,
      }
    }
  }
}

async function scrapeTiktok(url) {
  const client = new TikWMClient()
  return await client.process(url)
}

export default (app) => {
  app.get("/downloader/tiktok", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query

      if (!url || typeof url !== "string" || !url.trim()) {
        return res.status(400).json({
          status: false,
          error: "URL parameter is required",
        })
      }

      const result = await scrapeTiktok(url.trim())

      if (result?.error) {
        return res.status(500).json({
          status: false,
          error: result.error,
        })
      }

      res.status(200).json({
        status: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Internal Server Error",
      })
    }
  })

  app.post("/downloader/tiktok", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.body

      if (!url || typeof url !== "string" || !url.trim()) {
        return res.status(400).json({
          status: false,
          error: "URL parameter is required",
        })
      }

      const result = await scrapeTiktok(url.trim())

      if (result?.error) {
        return res.status(500).json({
          status: false,
          error: result.error,
        })
      }

      res.status(200).json({
        status: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Internal Server Error",
      })
    }
  })
}