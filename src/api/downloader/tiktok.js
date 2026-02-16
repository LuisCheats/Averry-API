import axios from "axios";
import * as cheerio from "cheerio"; // solo lo dejamos por si acaso, pero ya casi no se usa aquí
import { createApiKeyMiddleware } from "../../middleware/apikey.js";

export default (app) => {
  // Cliente simple con axios (mantiene cookies/User-Agent si hace falta)
  const apiClient = axios.create({
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  });

  /**
   * Descarga info de TikTok usando Cobalt.tools API (recomendado 2026)
   * Soporta video, slideshow (photos), sin watermark
   */
  async function scrapeTiktokCobalt(tiktokUrl) {
    try {
      const response = await apiClient.post("https://api.cobalt.tools/api/json", {
        url: tiktokUrl.trim(),
        vCodec: "h264",       // h264 es más compatible; puedes probar "av1"
        vQuality: "1080",     // "max" también funciona
        isAudioOnly: false,
        isNoTTWatermark: true, // fuerza sin watermark cuando posible
      });

      const data = response.data;

      if (data.status === "error") {
        throw new Error(data.text || "Cobalt API error");
      }

      let type = "video";
      let urls = [];
      let thumbnail = data.thumb || null;
      let title = data.text || "TikTok video";

      if (data.status === "picker") {
        // Es slideshow / galería de fotos
        type = data.picker.length > 1 ? "slideshow" : "photo";
        urls = data.picker.map((item) => item.url).filter(Boolean);
        thumbnail = data.picker[0]?.thumb || thumbnail;
      } else if (data.status === "video" || data.status === "stream") {
        // Video normal
        type = "video";
        urls = [data.url].filter(Boolean);
      } else {
        throw new Error("Unknown response status from Cobalt");
      }

      // Si hay audio separado (raro en TikTok)
      if (data.audio) {
        urls.push(data.audio);
      }

      return {
        original_url: tiktokUrl,
        type,
        urls: urls.filter((u) => u && typeof u === "string"),
        metadata: {
          title: title || null,
          description: title || null,
          thumbnail: thumbnail || null,
          creator: null, // Cobalt no siempre da creator, puedes agregar lógica extra si necesitas
        },
        oembed_url: data.url || null, // o el link directo
      };
    } catch (error) {
      console.error("Cobalt scrape error:", error.message);
      return {
        original_url: tiktokUrl,
        error: error.message || "Failed to fetch from Cobalt",
      };
    }
  }

  // Versión fallback mínima con snaptik (solo si cobalt falla, pero no recomendado)
  async function scrapeTiktokSnapTikFallback(url) {
    // ... puedes mantener tu código viejo aquí como backup, pero probablemente seguirá fallando
    // Por ahora lo dejamos comentado para evitar errores
    return { error: "SnapTik fallback disabled - use Cobalt" };
  }

  // Endpoint GET
  app.get("/downloader/tiktok", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query;

      if (!url || typeof url !== "string" || url.trim().length < 10) {
        return res.status(400).json({
          status: false,
          error: "Valid TikTok URL parameter is required",
        });
      }

      const result = await scrapeTiktokCobalt(url.trim());

      if (result.error) {
        return res.status(500).json({
          status: false,
          error: result.error,
        });
      }

      res.status(200).json({
        status: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Internal Server Error",
      });
    }
  });

  // Endpoint POST (mismo que GET, pero desde body)
  app.post("/downloader/tiktok", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== "string" || url.trim().length < 10) {
        return res.status(400).json({
          status: false,
          error: "Valid TikTok URL is required in body",
        });
      }

      const result = await scrapeTiktokCobalt(url.trim());

      if (result.error) {
        return res.status(500).json({
          status: false,
          error: result.error,
        });
      }

      res.status(200).json({
        status: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Internal Server Error",
      });
    }
  });
};