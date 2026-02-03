// src/api/search/download-ytmp3.js
const axios = require('axios');

module.exports = function(app) {
    app.get('/download/ytmp3', async (req, res) => {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'Debes enviar una URL de YouTube'
            });
        }

        try {
            // Llamamos a la API externa
            const response = await axios.get(`https://ruby-core.vercel.app/api/download/youtube/mp3?url=${encodeURIComponent(url)}`);
            
            if (!response.data || response.data.error) {
                return res.status(500).json({
                    status: false,
                    error: response.data?.error || 'No se pudo obtener el MP3'
                });
            }

            // Retornamos los datos al bot
            res.status(200).json({
                status: true,
                title: response.data.title,   // Título del video
                thumbnail: response.data.thumbnail, // Miniatura
                downloadUrl: response.data.result // URL del MP3
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });
};