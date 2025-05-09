// lowbass_ai_painting_cog.js
// ---------------------------
// Lowbass' AI Painting Cog – a standalone module for integrating an AI-powered painting command into a Twitch bot.

const tmi = require('tmi.js'); // Import the tmi.js library for Twitch chat interaction
const axios = require('axios'); // Import axios for making HTTP requests
const fs = require('fs'); // Import the file system module for file operations
const path = require('path'); // Import the path module for handling file paths
require('dotenv').config(); // Load environment variables from a .env file

// Load environment variables for API keys and other configurations
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID; // Imgur API client ID
const IMGUR_ALBUM_ID = process.env.IMGUR_ALBUM_ID; // Optional Imgur album ID
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // OpenAI API key
const BROADCASTER = process.env.BOT_BROADCASTER; // Twitch username of the broadcaster

// Function to initialize the bot with the painting feature
function initializePaintingFeature(client) {
  console.log("[PaintingFeature] Initializing...");

  // Listen for messages in the Twitch chat
  client.on('message', async (channel, tags, message, self) => {
    if (self) return; // Ignore messages from the bot itself

    // Only respond to messages that start with the !paint command
    if (!message.startsWith('!paint')) return;

    // Get the username of the message sender
    const username = tags['display-name'] || tags.username;
    console.log(`[PaintingFeature] Command received from: ${username}`);

    // Check if the user is the broadcaster; if not, deny permission
    if (username.toLowerCase() !== BROADCASTER.toLowerCase()) {
      console.log("[PaintingFeature] Permission denied.");
      return;
    }

    // Split the message into parts and check if it has enough arguments
    const parts = message.trim().split(' ').slice(1);
    if (parts.length < 2) {
      client.say(channel, "Usage: !paint <user> <prompt>"); // Inform the user of the correct usage
      return;
    }

    // Extract the target user and the painting prompt from the message
    const user = parts[0];
    const prompt = parts.slice(1).join(' ');
    console.log(`[PaintingFeature] Generating painting for ${user}, prompt: ${prompt}`);

    // Notify the channel that the painting is being generated
    client.say(channel, `🎨 Generating painting for ${user}: '${prompt}'...`);

    try {
      // Generate and upload the painting, then send the image URL to the channel
      const imageUrl = await generateAndUploadPainting(prompt);
      client.say(channel, `${user}, here is your painting: ${imageUrl}`);
    } catch (error) {
      // Log and notify the channel of any errors that occur
      console.error("[PaintingFeature] Error generating or uploading image:", error);
      client.say(channel, `Sorry, an error occurred: ${error.message}`);
    }
  });
}

// Function to generate and upload a painting based on a prompt
async function generateAndUploadPainting(prompt) {
  console.log(`[PaintingFeature] Sending prompt to OpenAI: ${prompt}`);

  // Request an image from OpenAI using the provided prompt
  const openaiResp = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      prompt, // The prompt for the image generation
      n: 1, // Number of images to generate
      size: "1024x1024" // Size of the generated image
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`, // Authorization header with OpenAI API key
        'Content-Type': 'application/json' // Content type for the request
      }
    }
  );

  // Extract the image URL from the OpenAI response
  const imageUrl = openaiResp.data.data[0].url;
  console.log(`[PaintingFeature] Image received from OpenAI: ${imageUrl}`);

  // Download the image locally to a temporary file
  const imageResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const filePath = path.join(__dirname, 'temp_painting.png'); // Path for the temporary file
  fs.writeFileSync(filePath, imageResp.data); // Save the image data to the file
  console.log("[PaintingFeature] Image saved locally.");

  // Upload the image to Imgur
  const imgurResp = await axios.post(
    'https://api.imgur.com/3/image',
    {
      image: fs.readFileSync(filePath, { encoding: 'base64' }), // Read and encode the image file
      type: 'base64', // Specify the image type
      album: IMGUR_ALBUM_ID, // Optional album ID for Imgur
      title: 'AI Painting' // Title for the uploaded image
    },
    {
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}` // Authorization header with Imgur client ID
      }
    }
  );

  // Extract the uploaded image URL from the Imgur response
  const uploadedUrl = imgurResp.data.data.link;
  console.log(`[PaintingFeature] Image uploaded to Imgur: ${uploadedUrl}`);

  return uploadedUrl; // Return the URL of the uploaded image
}

module.exports = initializePaintingFeature; // Export the initialize function for use in other modules