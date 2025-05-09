"""
lowbass_ai_painting_cog.py
-------------------------
Lowbass' AI Painting Cog - a **stand-alone** TwitchIO extension that adds an AI-powered "painting" feature to any existing bot.

Features
~~~~~~~~
* **Admin-only !paint command** - broadcasters & mods can generate paintings on demand.

Environment variables
~~~~~~~~~~~~~~~~~~~~~
OPENAI_API_KEY       # required - key for OpenAI Images API
IMGUR_CLIENT_ID      # required - Imgur API client ID
IMGUR_ALBUM_ID       # optional - album to contain generated paintings
BOT_BROADCASTER      # required - Twitch username of the broadcaster (for permission checks)
"""

import os
import openai
import pyimgur
import requests
from twitchio.ext import commands

class PaintingCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        print("[PaintingCog] Initializing cog...")

        # Load OpenAI API key from environment variables
        openai.api_key = os.getenv("OPENAI_API_KEY")
        print("[PaintingCog] OpenAI API key loaded.")

        # Initialize Imgur client with client ID from environment variables
        self.imgur_client = pyimgur.Imgur(os.getenv("IMGUR_CLIENT_ID"))
        print("[PaintingCog] Imgur client initialized.")

        # Optionally use a specific Imgur album to store uploaded images
        self.imgur_album_id = os.getenv("IMGUR_ALBUM_ID")

        # Store broadcaster's Twitch username for permission checks
        self.broadcaster = os.getenv("BOT_BROADCASTER")
        print(f"[PaintingCog] Broadcaster set to: {self.broadcaster}")

    @commands.command(name="paint")
    async def paint_command(self, ctx: commands.Context):
        print(f"[PaintingCog] Received !paint command from: {ctx.author.name}")

        # Only allow the broadcaster to use the !paint command
        if ctx.author.name.lower() != self.broadcaster.lower():
            print("[PaintingCog] Permission denied for user.")
            await ctx.send(f"Sorry {ctx.author.name}, only the broadcaster can use this command.")
            return

        # Parse the command for user and prompt
        content = ctx.message.content.strip()
        split_content = content.split(" ", 2)
        if len(split_content) < 3:
            print("[PaintingCog] Invalid command format.")
            await ctx.send("Usage: !paint <user> <prompt>")
            return

        user = split_content[1]
        prompt = split_content[2]
        print(f"[PaintingCog] Generating painting for user: {user}, prompt: {prompt}")
        await ctx.send(f"🎨 Generating painting for {user}: '{prompt}'…")

        try:
            # Generate and upload the painting, then get the image URL
            url = self.generate_and_upload_painting(prompt)
            await ctx.send(f"{user}, here is your painting: {url}")
        except Exception as e:
            print(f"[PaintingCog] Error during painting generation: {e}")
            await ctx.send(f"Sorry, an error occurred: {e}")

    def generate_and_upload_painting(self, prompt):
        print(f"[PaintingCog] Generating painting for prompt: {prompt}")

        # Use OpenAI's image generation API to create an image based on the prompt
        response = openai.Image.create(
            prompt=prompt,
            n=1,
            size="1024x1024"
        )

        # Extract the image URL from the API response
        image_url = response['data'][0]['url']
        print(f"[PaintingCog] Downloading generated image from {image_url}")

        # Download the image data from the generated URL
        image_data = requests.get(image_url).content

        # Save the image temporarily to disk
        temp_file_path = "/tmp/painting.png"
        with open(temp_file_path, "wb") as f:
            f.write(image_data)

        print("[PaintingCog] Uploading to Imgur…")

        # Upload the image to Imgur, optionally associating it with a specific album
        uploaded_image = self.imgur_client.upload_image(
            temp_file_path,
            album=self.imgur_album_id,
            title="AI Painting"
        )

        print(f"[PaintingCog] Upload complete: {uploaded_image.link}")
        # Return the Imgur URL of the uploaded image
        return uploaded_image.link
