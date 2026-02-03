const express = require('express');
const { createCanvas, loadImage } = require('canvas');

module.exports = function(app) {
    app.get('/welcomev2', async (req, res) => {
        const { username, guildName, memberCount, avatar, background } = req.query;

        if (!username || !guildName) {
            return res.status(400).json({ status: false, error: 'username y guildName son requeridos' });
        }

        try {
            // Crear canvas
            const width = 800;
            const height = 400;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // Cargar fondo
            if (background) {
                const bg = await loadImage(background);
                ctx.drawImage(bg, 0, 0, width, height);
            } else {
                // Fondo default
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(0, 0, width, height);
            }

            // Avatar
            if (avatar) {
                const imgAvatar = await loadImage(avatar);
                const avatarSize = 150;
                ctx.beginPath();
                ctx.arc(125, height / 2, avatarSize / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(imgAvatar, 50, height / 2 - avatarSize / 2, avatarSize, avatarSize);
                ctx.restore();
            }

            // Texto de bienvenida
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 40px Sans';
            ctx.fillText(`¡Bienvenido, ${username}!`, 250, 150);

            ctx.font = '28px Sans';
            ctx.fillText(`Al grupo: ${guildName}`, 250, 220);
            if (memberCount) ctx.fillText(`Eres el miembro #${memberCount}`, 250, 270);

            // Devolver imagen
            res.setHeader('Content-Type', 'image/png');
            res.send(canvas.toBuffer());
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};