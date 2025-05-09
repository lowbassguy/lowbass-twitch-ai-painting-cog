# Lowbass AI Painting Cog

A modular, AI-powered painting feature for Twitch bots, available in three flavors:
- **Python (TwitchIO)**
- **JavaScript (tmi.js)**
- **Streamer.bot (C#)**

Generate unique AI art on demand with the `!paint` command, powered by OpenAI DALL·E and Imgur.

---

## Table of Contents
- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Python (TwitchIO)](#python-twitchio)
- [JavaScript (tmi.js)](#javascript-tmijs)
- [Streamer.bot (C#)](#streamerbot-c)
- [Example Usage](#example-usage)
- [Custom Triggers & Extending](#custom-triggers--extending)
- [License](#license)

---

## Overview
- **Admin-only `!paint` command** — Only the broadcaster can generate AI paintings on demand.
- **OpenAI DALL·E image generation** — Uses OpenAI's API to create unique images from prompts.
- **Imgur upload** — Automatically uploads generated images to Imgur and shares the link in chat.
- **Easy integration** — Add to any existing Twitch bot in Python, JavaScript, or Streamer.bot.

---

## Environment Variables
Set these in your environment (or a `.env` file for JavaScript):

| Variable           | Required | Description                                      |
|--------------------|----------|--------------------------------------------------|
| `OPENAI_API_KEY`   | Yes      | OpenAI Images API key                            |
| `IMGUR_CLIENT_ID`  | Yes      | Imgur API client ID                              |
| `IMGUR_ALBUM_ID`   | No       | Imgur album to contain generated paintings       |
| `BOT_BROADCASTER`  | Yes*     | Twitch username of the broadcaster (permissions) |

*Not required for Streamer.bot (C#); permissions are set in the UI.

---

## Python (TwitchIO)

### Features
- `!paint <user> <prompt>` — Only the broadcaster can use this command.
- Generates an image with OpenAI, uploads to Imgur, and posts the link in chat.

### Dependencies
- `twitchio`
- `openai`
- `pyimgur`
- `requests`

Install dependencies:
```bash
pip install twitchio openai pyimgur requests
```

### Setup & Usage
1. Add `PaintingCog` to your TwitchIO bot:
    ```python
    from lowbass_ai_painting_cog import PaintingCog
    bot.add_cog(PaintingCog(bot))
    ```
2. Set the required environment variables.
3. Use `!paint <user> <prompt>` in chat (broadcaster only).

#### Adding Custom Triggers (Cheers, Channel Points, etc.)
- Listen for Twitch events (such as cheers or channel point redeems) in your bot code.
- Call `self.generate_and_upload_painting(prompt)` from your event handler.
- Example (cheer event):
    ```python
    @bot.event
    async def event_cheer(event):
        user = event.user.name
        prompt = f"A painting celebrating {user}'s cheer!"
        url = bot.get_cog('PaintingCog').generate_and_upload_painting(prompt)
        await bot.connected_channels[0].send(f"{user}, here is your painting: {url}")
    ```
- For channel point redeems, use TwitchIO's custom reward event and call the painting function similarly.

---

## JavaScript (tmi.js)

### Features
- `!paint <user> <prompt>` — Only the broadcaster can use this command.
- Generates an image with OpenAI, uploads to Imgur, and posts the link in chat.

### Dependencies
- `tmi.js`
- `axios`
- `dotenv`

Install dependencies:
```bash
npm install tmi.js axios dotenv
```

### Setup & Usage
1. Add the painting feature to your tmi.js client:
    ```js
    const tmi = require('tmi.js');
    const initializePaintingFeature = require('./JavaScript/lowbass_ai_painting_cog');
    const client = new tmi.Client({ /* ... */ });
    initializePaintingFeature(client);
    client.connect();
    ```
2. Set the required environment variables (in a `.env` file or your environment).
3. Use `!paint <user> <prompt>` in chat (broadcaster only).

#### Adding Custom Triggers (Cheers, Channel Points, etc.)
- Listen for custom events (such as cheers or channel point redeems) using tmi.js or an additional Twitch API library.
- Call `generateAndUploadPainting(prompt)` from your event handler.
- Example (cheer event):
    ```js
    // Example using tmi.js for cheers (requires additional setup for IRC tags)
    client.on('cheer', async (channel, userstate, message) => {
      const username = userstate['display-name'] || userstate.username;
      const prompt = `A painting celebrating ${username}'s cheer!`;
      const imageUrl = await generateAndUploadPainting(prompt);
      client.say(channel, `${username}, here is your painting: ${imageUrl}`);
    });
    ```
- For channel point redeems, use a PubSub or EventSub listener and call the painting function similarly.

---

## Streamer.bot (C#)

### Features
- `!paint <user> <prompt>` — Only the broadcaster (or mods, if allowed in Streamer.bot) can use this command.
- Generates an image with OpenAI, uploads to Imgur, and posts the link in chat.
- Minimal dependencies: just .NET built-in libraries.

### Setup & Usage
1. Open **Actions → C# Scripts** in Streamer.bot and add a new script.
2. Paste the contents of `Streamer.bot (C#)/lowbass_ai_painting_cog.cs` and click **Compile**.
3. Create a new **Twitch Chat Command** called `!paint`.
    - Set parameters: `[TargetUser] [PromptArgs]` (PromptArgs = everything after the first two words).
    - In the command, call this script's `Run` method, passing the parameters.
4. Restrict the command to **Broadcaster** (and Mods if you wish) in the Streamer.bot UI.
5. Set the required environment variables in Windows or Streamer.bot's C# Variables:
    - `OPENAI_API_KEY` (required)
    - `IMGUR_CLIENT_ID` (required)
    - `IMGUR_ALBUM_ID` (optional)
6. Use `!paint <user> <prompt>` in chat.

#### Adding Custom Triggers (Cheers, Channel Points, etc.)
- In Streamer.bot, create a new Action for the desired event (e.g., cheer, channel point redeem).
- Add a C# Script Action and select your painting script.
- Pass the appropriate parameters (e.g., user and prompt) to the script's `Run` method.
- Example: For a channel point redeem, set up the Action to call `Run` with the redeemer's name and a custom prompt.

---

## Example Usage
```
!paint Alice a futuristic cityscape at sunset
```
The bot will reply:
```
🎨 Generating painting for Alice: 'a futuristic cityscape at sunset'…
Alice, here is your painting: <Imgur link>
```

---

## Custom Triggers & Extending

You can add your own triggers or commands to invoke the painting feature in your bot! For example:

### Python (TwitchIO)
- Add another command method to the `PaintingCog` class, or call `self.generate_and_upload_painting(prompt)` from anywhere in your bot code.
- Example:
    ```python
    @commands.command(name="paintme")
    async def paintme_command(self, ctx: commands.Context):
        prompt = f"portrait of {ctx.author.name} as a fantasy hero"
        url = self.generate_and_upload_painting(prompt)
        await ctx.send(f"{ctx.author.name}, here is your painting: {url}")
    ```

### JavaScript (tmi.js)
- Add more message triggers in your `client.on('message', ...)` handler, or call `generateAndUploadPainting(prompt)` from anywhere in your bot logic.
- Example:
    ```js
    if (message.startsWith('!paintme')) {
      const prompt = `portrait of ${username} as a fantasy hero`;
      const imageUrl = await generateAndUploadPainting(prompt);
      client.say(channel, `${username}, here is your painting: ${imageUrl}`);
    }
    ```

### Streamer.bot (C#)
- Add new chat commands in Streamer.bot that call the script's `Run` method with different parameters.
- Example: Create a `!paintme` command that passes the user's name and a custom prompt.

Feel free to create new commands, react to chat events, or integrate with other APIs. The painting generation and upload logic is modular and can be reused anywhere in your bot!

---

## License
See LICENSE file for details. 