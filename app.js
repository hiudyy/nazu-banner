const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const app = express();
const PORT = 3000;

app.get('/banner', async (req, res) => {
    const { num, theme } = req.query;

    if (!num || !theme) {
        return res.status(400).send('Parâmetros "num" e "theme" são obrigatórios.');
    }

    const formattedNum = num.padStart(4, '0');
    const images = [];
    let totalWidth = 0;
    let maxHeight = 0;

    for (let i = 0; i < formattedNum.length; i++) {
        const digit = formattedNum[i];
        const imagePath = path.join(__dirname, 'imgs', theme, `${digit}.png`);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).send(`Imagem não encontrada para o dígito ${digit} no tema ${theme}.`);
        }

        const image = sharp(imagePath);
        const metadata = await image.metadata();

        totalWidth += metadata.width;
        if (metadata.height > maxHeight) {
            maxHeight = metadata.height;
        }

        images.push({
            buffer: await image.toBuffer(),
            width: metadata.width,
            height: metadata.height
        });
    }

    const marginHorizontal = 20;
    const marginVertical = 20;
    const spacingBetweenImages = 7 * (images.length - 1);

    const bannerWidth = totalWidth + marginHorizontal + spacingBetweenImages;
    const bannerHeight = maxHeight + marginVertical;

    const banner = await sharp({
        create: {
            width: bannerWidth,
            height: bannerHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0 }
        }
    })
    .composite(images.map((img, index) => {
        const left = 10 + images.slice(0, index).reduce((sum, img) => sum + img.width + 7, 0);
        const top = 10 + (maxHeight - img.height) / 2;
        return {
            input: img.buffer,
            left: Math.round(left),
            top: Math.round(top)
        };
    }))
    .png()
    .toBuffer();

    res.type('png').send(banner);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});