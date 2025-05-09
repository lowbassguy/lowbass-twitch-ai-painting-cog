// lowbass_ai_painting_cog.js
// ---------------------------
// Lowbass' AI Painting Cog – a standalone module for integrating an AI-powered painting command into a Twitch bot.

const tmi = require('tmi.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load environment variables
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const IMGUR_ALBUM_ID = process.env.IMGUR_ALBUM_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BROADCASTER = process.env.BOT_BROADCASTER;

// Function to initialize the bot with the painting feature
function initializePaintingFeature(client) {
  console.log("[PaintingFeature] Initializing...");

  client.on('message', async (channel, tags, message, self) => {
    if (self) return;

    // Only respond to !paint commands
    if (!message.startsWith('!paint')) return;

    const username = tags['display-name'] || tags.username;
    console.log(`[PaintingFeature] Command received from: ${username}`);

    if (username.toLowerCase() !== BROADCASTER.toLowerCase()) {
      console.log("[PaintingFeature] Permission denied.");
      return;
    }

    const parts = message.trim().split(' ').slice(1);
    if (parts.length < 2) {
      client.say(channel, "Usage: !paint <user> <prompt>");
      return;
    }

    const user = parts[0];
    const prompt = parts.slice(1).join(' ');
    console.log(`[PaintingFeature] Generating painting for ${user}, prompt: ${prompt}`);

    client.say(channel, `🎨 Generating painting for ${user}: '${prompt}'...`);

    try {
      const imageUrl = await generateAndUploadPainting(prompt);
      client.say(channel, `${user}, here is your painting: ${imageUrl}`);
    } catch (error) {
      console.error("[PaintingFeature] Error generating or uploading image:", error);
      client.say(channel, `Sorry, an error occurred: ${error.message}`);
    }
  });
}

// Function to generate and upload painting
async function generateAndUploadPainting(prompt) {
  console.log(`[PaintingFeature] Sending prompt to OpenAI: ${prompt}`);

  // Request image from OpenAI
  const openaiResp = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      prompt,
      n: 1,
      size: "1024x1024"
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const imageUrl = openaiResp.data.data[0].url;
  console.log(`[PaintingFeature] Image received from OpenAI: ${imageUrl}`);

  // Download image locally
  const imageResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const filePath = path.join(__dirname, 'temp_painting.png');
  fs.writeFileSync(filePath, imageResp.data);
  console.log("[PaintingFeature] Image saved locally.");

  // Upload to Imgur
  const imgurResp = await axios.post(
    'https://api.imgur.com/3/image',
    {
      image: fs.readFileSync(filePath, { encoding: 'base64' }),
      type: 'base64',
      album: IMGUR_ALBUM_ID,
      title: 'AI Painting'
    },
    {
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
      }
    }
  );

  const uploadedUrl = imgurResp.data.data.link;
  console.log(`[PaintingFeature] Image uploaded to Imgur: ${uploadedUrl}`);

  return uploadedUrl;
}

module.exports = initializePaintingFeature;