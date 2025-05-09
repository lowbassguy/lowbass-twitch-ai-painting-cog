/*
 Lowbass AI Painting Cog for Streamer.bot
----------------------------------------
Port of the original Python **lowbass_ai_painting_cog** to a Streamer.bot C# plugin.

Features
~~~~~~~~
* **!paint <user> <prompt>** — broadcaster‑only command to generate an AI painting and upload it to Imgur.
* Uses OpenAI Images API (DALL·E) for generation and Imgur for hosting.
* Minimal external dependencies (pure HttpClient + System.Text.Json).

Environment variables (set via Windows → Environment Variables or Streamer.bot → Settings → C# Variables):
-----------------------------------------------------------------------
OPENAI_API_KEY   – required – OpenAI API key with image generation enabled
IMGUR_CLIENT_ID  – required – Imgur application Client‑ID
IMGUR_ALBUM_ID   – optional – Imgur album to collect generated paintings

How to use in Streamer.bot
--------------------------
1. Open **Actions → C# Scripts** and add a new script.
2. Paste this entire file and click **Compile**.
3. Create a new **Twitch Chat Command** called **!paint**.
   * Parameters: `[TargetUser] [PromptArgs]` (PromptArgs = *everything after the first two words*).
   * In the command, call this script’s **Run** method, passing the parameters.
4. Ensure the command is restricted to *Broadcaster* (and Mods if desired).

Notes
-----
* Streamer.bot exposes helper classes via the static `SB` facade (available in v0.2.0‑plus). If your build predates these helpers, replace them with the older service‑lookup syntax.
*/

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

public class LowbassAiPaintingCog
{
    private static readonly HttpClient http = new HttpClient();

    public async Task Run(string targetUser, string prompt)
    {
        SB.Debug.Log($"[AI‑Paint] Run invoked with targetUser={targetUser}, prompt length={prompt?.Length}");
        try
        {
            SB.Debug.Log($"[AI‑Paint] Generating painting for {targetUser}: '{prompt}' …");
            SB.Chats.Send($"🎨 Generating painting for {targetUser}: '{prompt}'…");

            string url = await GenerateAndUploadAsync(prompt);

            SB.Chats.Send($"{targetUser}, here is your painting: {url}");
            SB.Debug.Log($"[AI‑Paint] Completed → {url}");
        }
        catch (Exception ex)
        {
            SB.Debug.Log($"[AI‑Paint] Error: {ex}");
            SB.Chats.Send($"Sorry, an error occurred: {ex.Message}");
        }
    }

    private static async Task<string> GenerateAndUploadAsync(string prompt)
    {
        SB.Debug.Log("[AI‑Paint] Reading environment variables");
        string openAiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(openAiKey))
            throw new InvalidOperationException("OPENAI_API_KEY environment variable is missing.");

        string imgurClientId = Environment.GetEnvironmentVariable("IMGUR_CLIENT_ID");
        if (string.IsNullOrWhiteSpace(imgurClientId))
            throw new InvalidOperationException("IMGUR_CLIENT_ID environment variable is missing.");

        string imgurAlbumId = Environment.GetEnvironmentVariable("IMGUR_ALBUM_ID");

        var openAiRequest = new { prompt, n = 1, size = "1024x1024" };

        SB.Debug.Log("[AI‑Paint] Sending request to OpenAI Images API");
        using var openAiMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/images/generations")
        {
            Content = JsonContent.Create(openAiRequest)
        };
        openAiMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", openAiKey);

        using var openAiResponse = await http.SendAsync(openAiMessage);
        SB.Debug.Log($"[AI‑Paint] OpenAI response status: {openAiResponse.StatusCode}");
        openAiResponse.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await openAiResponse.Content.ReadAsStringAsync());
        string generatedUrl = doc.RootElement.GetProperty("data")[0].GetProperty("url").GetString();
        SB.Debug.Log($"[AI‑Paint] Generated image URL: {generatedUrl}");

        SB.Debug.Log("[AI‑Paint] Downloading generated image");
        byte[] imageBytes = await http.GetByteArrayAsync(generatedUrl);
        SB.Debug.Log($"[AI‑Paint] Image size bytes: {imageBytes.Length}");

        var form = new List<KeyValuePair<string, string>>
        {
            new KeyValuePair<string, string>("image", Convert.ToBase64String(imageBytes)),
            new KeyValuePair<string, string>("type", "base64"),
            new KeyValuePair<string, string>("title", "AI Painting")
        };
        if (!string.IsNullOrWhiteSpace(imgurAlbumId))
            form.Add(new KeyValuePair<string, string>("album", imgurAlbumId));

        SB.Debug.Log("[AI‑Paint] Uploading image to Imgur");
        using var imgurMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.imgur.com/3/image")
        {
            Content = new FormUrlEncodedContent(form)
        };
        imgurMessage.Headers.Authorization = new AuthenticationHeaderValue("Client-ID", imgurClientId);

        using var imgurResponse = await http.SendAsync(imgurMessage);
        SB.Debug.Log($"[AI‑Paint] Imgur response status: {imgurResponse.StatusCode}");
        imgurResponse.EnsureSuccessStatusCode();

        using var imgurDoc = JsonDocument.Parse(await imgurResponse.Content.ReadAsStringAsync());
        string imgurLink = imgurDoc.RootElement.GetProperty("data").GetProperty("link").GetString();
        SB.Debug.Log($"[AI‑Paint] Imgur link: {imgurLink}");

        return imgurLink;
    }
}