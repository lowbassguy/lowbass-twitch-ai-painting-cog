# Lowbass AI Painting Cog

A standalone AI-powered "painting" feature for Twitch bots, available in both Python (TwitchIO) and JavaScript (tmi.js) versions.

---

## Features
- **Admin-only `!paint` command** — Only the broadcaster can generate AI paintings on demand.
- **OpenAI DALL·E image generation** — Uses OpenAI's API to create unique images from prompts.
- **Imgur upload** — Automatically uploads generated images to Imgur and shares the link in chat.
- **Easy integration** — Add to any existing Twitch bot in Python or JavaScript.

---

## Environment Variables
Set these in your environment or a `.env` file (for JavaScript):

| Variable           | Required | Description                                      |
|--------------------|----------|--------------------------------------------------|
| `OPENAI_API_KEY`   | Yes      | OpenAI Images API key                            |
| `IMGUR_CLIENT_ID`  | Yes      | Imgur API client ID                              |
| `IMGUR_ALBUM_ID`   | No       | Imgur album to contain generated paintings       |
| `BOT_BROADCASTER`  | Yes      | Twitch username of the broadcaster (permissions) |

---

## Python Version (`Python/lowbass_ai_painting_cog.py`)

### Dependencies
- `twitchio`
- `openai`
- `pyimgur`
- `requests`

Install dependencies:
```bash
pip install twitchio openai pyimgur requests
```

### Usage
1. Add `PaintingCog` to your TwitchIO bot:
    ```python
    from lowbass_ai_painting_cog import PaintingCog
    bot.add_cog(PaintingCog(bot))
    ```
2. Ensure all required environment variables are set.
3. Use `!paint <user> <prompt>` in chat (broadcaster only).

---

## JavaScript Version (`JavaScript/lowbass_ai_painting_cog.js`)

### Dependencies
- `tmi.js`
- `axios`
- `dotenv`

Install dependencies:
```bash
npm install tmi.js axios dotenv
```

### Usage
1. Add the painting feature to your tmi.js client:
    ```js
    const tmi = require('tmi.js');
    const initializePaintingFeature = require('./JavaScript/lowbass_ai_painting_cog');
    const client = new tmi.Client({ /* ... */ });
    initializePaintingFeature(client);
    client.connect();
    ```
2. Ensure all required environment variables are set (in a `.env` file or your environment).
3. Use `!paint <user> <prompt>` in chat (broadcaster only).

---

## Example
```
!paint Alice a futuristic cityscape at sunset
```
The bot will reply:
```
🎨 Generating painting for Alice: 'a futuristic cityscape at sunset'…
Alice, here is your painting: <Imgur link>
```

---

## Custom Triggers & Extending Functionality

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

Feel free to create new commands, react to chat events, or integrate with other APIs. The painting generation and upload logic is modular and can be reused anywhere in your bot!

---

## License
MIT License 