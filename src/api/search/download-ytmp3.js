module.exports = function(app) {
  const yts = require('yt-search');
  const ytdl = require('ytdl-core');

  // 🔍 Buscar videos en YouTube
  app.get('/search/youtube', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, error: 'Query is required' });

    try {
      const ytResults = await yts.search(q);
      const ytTracks = ytResults.videos.map(video => ({
        title: video.title,
        channel: video.author.name,
        duration: video.duration.timestamp,
        imageUrl: video.thumbnail,
        link: video.url
      }));
      res.status(200).json({ status: true, result: ytTracks });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });

  // 🎵 Descargar video en MP3
  app.get('/download/ytmp3', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, error: 'URL is required' });

    try {
      if (!ytdl.validateURL(url)) return res.status(400).json({ status: false, error: 'Invalid YouTube URL' });

      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;

      // Enviar respuesta JSON
      res.status(200).json({
        status: true,
        title,
        channel: info.videoDetails.author.name,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails.pop().url,
        link: `https://api-ytdl.vercel.app/api/mp3?url=${encodeURIComponent(url)}`
      });

      // ⚠️ Nota: este "link" usa una API pública para entregar el MP3.
      // Si quieres alojarlo en tu propia API, te puedo ayudar a que descargue directamente desde tu servidor.
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};