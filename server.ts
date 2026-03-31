import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.0.1", timestamp: new Date().toISOString() });
  });

  // Google Cloud TTS API Endpoint
  app.post("/api/tts", async (req, res) => {
    const { text, ssml, voice = "vi-VN-Wavenet-A" } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: "GOOGLE_API_KEY_NOT_FOUND", 
        message: "Google API Key is missing." 
      });
    }

    try {
      const input = ssml ? { ssml } : { text };
      console.log(`Generating Google TTS using voice: ${voice}`);
      
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input,
          voice: { 
            languageCode: "vi-VN",
            name: voice 
          },
          audioConfig: { audioEncoding: "MP3" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Google TTS API Error:", response.status, errorData);
        return res.status(response.status).json({ 
          error: errorData.error?.message || "Google TTS API returned an error.",
          details: errorData
        });
      }

      const data = await response.json();
      const audioBuffer = Buffer.from(data.audioContent, 'base64');
      
      res.set("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS Error:", error);
      res.status(500).json({ error: "Failed to generate speech." });
    }
  });

  function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }

  function splitTextForServer(text: string, max = 3000) {
    const parts: string[] = [];
    let current = "";

    text.split(".").forEach(s => {
      if ((current + s).length > max) {
        parts.push(current);
        current = s;
      } else {
        current += s + ".";
      }
    });

    if (current) parts.push(current);
    return parts;
  }

  async function ttsSSMLOnServer(text: string, voice: string, apiKey: string) {
    // Replace newlines with breaks for better pacing
    const ssml = `<speak>${text.replace(/\n/g, '<break time="300ms"/>').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[m] as string))}</speak>`;

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { ssml },
          voice: { languageCode: "vi-VN", name: voice },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.92,
            pitch: -1
          }
        })
      }
    );

    const data = await res.json();
    if (!data.audioContent) throw new Error(JSON.stringify(data));

    return Buffer.from(data.audioContent, "base64");
  }

  app.post("/api/tts-conversation", async (req, res) => {
    try {
      const { script } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Google API Key is missing." });
      }

      let buffers: Buffer[] = [];

      for (const part of script) {
        const voice = part.speaker === "A"
          ? "vi-VN-Wavenet-D"
          : "vi-VN-Wavenet-A";

        const chunks = splitTextForServer(part.text, 2500);

        for (const chunk of chunks) {
          const audio = await ttsSSMLOnServer(chunk, voice, apiKey);
          buffers.push(audio);
          await sleep(200);
        }
      }

      const finalAudio = Buffer.concat(buffers);

      res.setHeader("Content-Type", "audio/mpeg");
      res.send(finalAudio);

    } catch (err: any) {
      console.error("ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Google API Key is ${process.env.GEMINI_API_KEY ? "PRESENT" : "MISSING"}`);
  });
}

startServer();
