import { GoogleGenAI, Modality, Type } from "@google/genai";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  deleteDoc,
  doc,
  setDoc
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";

// Lazy initialization helper
export function getAI() {
  // Use user-selected API key if available, otherwise fallback to system key
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

// Update to latest models
const MODEL_PRO = "gemini-3.1-pro-preview";
const MODEL_FLASH = "gemini-3.1-flash-lite-preview";
const MODEL_IMAGE = "gemini-2.5-flash-image";

export type AnalysisMode = "Beginner" | "Deep Analysis" | "Business Thinking";
export type DeepAnalysisMode = "Deep Exploration" | "Quick Summary" | "Critical Review" | "Debate Mode";
export type AnalysisStyle = "Concise" | "Deep";
export type AudioOverviewLength = "Short" | "Default" | "Long";
export type AudioOverviewLanguage = "Tiếng Việt" | "English";
export type VoiceType = "Nam" | "Nữ" | "Podcast host";
export type FacebookPostStyle = "Storytelling" | "Professional" | "Hook-based" | "Short & Sweet";

export interface AudioOverviewConfig {
  mode: DeepAnalysisMode;
  language: AudioOverviewLanguage;
  length: AudioOverviewLength;
  voiceType: VoiceType;
  hasBackgroundMusic: boolean;
  backgroundMusicTrack?: string;
  customInstruction: string;
}

export const BACKGROUND_MUSIC_TRACKS = [
  { id: "soft-piano", name: "Piano nhẹ nhàng", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "ambient-lofi", name: "Ambient Lofi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "cinematic-strings", name: "Cinematic Strings", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "uplifting-acoustic", name: "Uplifting Acoustic", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
];

export interface BookAnalysis {
  id?: string;
  userId?: string;
  createdAt?: any;
  imageUrl?: string;
  title: string;
  introduction: string;
  summary: string;
  detailedSummary: string;
  keyIdeas: string[];
  podcastScript: string;
  podcastCovers?: string[];
  facebookPost?: string;
  insights: string[];
  contentIdeas: {
    tiktok: string[];
    youtube: string[];
    blog: string[];
  };
}

export interface DeepAnalysisResult {
  content: string;
  mode: DeepAnalysisMode;
}

// Helper for retries with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error.status === 429) {
      console.warn(`Rate limit hit, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const startChat = (systemInstruction?: string) => {
  const ai = getAI();
  return ai.chats.create({
    model: MODEL_FLASH,
    config: {
      systemInstruction: systemInstruction || "Bạn là trợ lý AI thông minh, hỗ trợ người dùng tóm tắt sách, phân tích nội dung và trả lời các câu hỏi liên quan đến kiến thức.",
    },
  });
};

export async function analyzeBook(
  input: string | { data: string; mimeType: string },
  mode: AnalysisMode = "Deep Analysis"
): Promise<BookAnalysis> {
  const model = MODEL_FLASH;
  
  const modeInstructions = {
    "Beginner": "Sử dụng ngôn ngữ đơn giản, giải thích các khái niệm cơ bản, phù hợp cho người mới bắt đầu tìm hiểu.",
    "Deep Analysis": "Phân tích chuyên sâu, kết nối các ý tưởng phức tạp, đưa ra các góc nhìn đa chiều và phản biện.",
    "Business Thinking": "Tập trung vào giá trị chiến lược, mô hình kinh doanh, khả năng thực thi, ROI và các bài học cho lãnh đạo."
  };

  const prompt = `Bạn là trợ lý AI cao cấp của "AI Book Summary Pro". 
  Nhiệm vụ của bạn là phân tích cuốn sách hoặc chủ đề được cung cấp theo phong cách: ${modeInstructions[mode]}.
  
  Yêu cầu nội dung trả về bằng TIẾNG VIỆT, văn phong chuyên nghiệp, truyền cảm hứng:
  1. Introduction: Giới thiệu ngắn gọn về cuốn sách, tác giả và bối cảnh.
  2. Summary: Tóm tắt cốt lõi (3-5 đoạn văn).
  3. Detailed Summary: Tóm tắt chi tiết từng chương hoặc các phần quan trọng nhất của cuốn sách.
  4. Key Ideas: 5-10 gạch đầu dòng về những khái niệm quan trọng nhất.
  5. Podcast Script: Kịch bản ngắn gọn (Mở đầu hấp dẫn + Nội dung chính + Kết thúc) lôi cuốn.
  6. Insights & Lessons: Các bài học thực tiễn có thể áp dụng ngay.
  7. Content Ideas: Ý tưởng sáng tạo nội dung cho TikTok, YouTube và Blog.

  Trả về định dạng JSON:
  {
    "title": "Tiêu đề",
    "introduction": "Giới thiệu sách...",
    "summary": "Nội dung tóm tắt...",
    "detailedSummary": "Tóm tắt chi tiết...",
    "keyIdeas": ["Ý tưởng 1", "Ý tưởng 2", "..."],
    "podcastScript": "Kịch bản podcast...",
    "insights": ["Bài học 1", "Bài học 2", "..."],
    "contentIdeas": {
      "tiktok": ["Ý tưởng TikTok 1", "..."],
      "youtube": ["Ý tưởng YouTube 1", "..."],
      "blog": ["Ý tưởng Blog 1", "..."]
    }
  }`;

  const ai = getAI();
  const response = await retryWithBackoff(() => ai.models.generateContent({
    model,
    contents: typeof input === "string" ? [{ parts: [{ text: `${prompt}\n\nĐầu vào: ${input}` }] }] : { parts: [{ inlineData: input }, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          introduction: { type: Type.STRING },
          summary: { type: Type.STRING },
          detailedSummary: { type: Type.STRING },
          keyIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
          podcastScript: { type: Type.STRING },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          contentIdeas: {
            type: Type.OBJECT,
            properties: {
              tiktok: { type: Type.ARRAY, items: { type: Type.STRING } },
              youtube: { type: Type.ARRAY, items: { type: Type.STRING } },
              blog: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["tiktok", "youtube", "blog"]
          }
        },
        required: ["title", "introduction", "summary", "detailedSummary", "keyIdeas", "podcastScript", "insights", "contentIdeas"]
      }
    }
  }));

  const text = response.text || "{}";
  try {
    return JSON.parse(text) as BookAnalysis;
  } catch (e) {
    console.error("Initial JSON parse failed, attempting repair...", e);
    // Basic repair for truncated JSON
    let repaired = text.trim();
    if (!repaired.endsWith("}")) {
      // Try to close open strings and objects
      if (repaired.includes('"') && repaired.lastIndexOf('"') > repaired.lastIndexOf(':')) {
        repaired += '"';
      }
      // Very crude repair: just try adding closing braces
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += "}";
      }
      
      try {
        return JSON.parse(repaired) as BookAnalysis;
      } catch (e2) {
        console.error("Repair failed:", e2);
        throw new Error(`Failed to parse AI response: ${repaired.substring(0, 100)}...`);
      }
    }
    throw e;
  }
}

export async function performDeepAnalysis(
  input: string | { data: string; mimeType: string },
  mode: DeepAnalysisMode,
  style: AnalysisStyle = "Deep"
): Promise<string> {
  const model = MODEL_FLASH;
  
  let modePrompt = "";
  switch (mode) {
    case "Deep Exploration":
      modePrompt = `Tạo một cuộc hội thoại podcast năng động giữa HAI người dẫn chương trình AI về nội dung này.
      Yêu cầu:
      - Định dạng như một cuộc đối thoại podcast.
      - Hai nhân vật:
        + Host A: Phân tích, logic, điềm đạm.
        + Host B: Tò mò, hay đặt câu hỏi, năng động.
      Nội dung:
      - Khám phá sâu các ý tưởng, kết nối các chủ đề.
      - Đưa ra các ví dụ thực tế đời thường.
      - Đặt và trả lời các câu hỏi hóc búa.
      Văn phong: Tự nhiên, lôi cuốn, trí tuệ.
      Định dạng:
      Host A: ...
      Host B: ...`;
      break;
    case "Quick Summary":
      modePrompt = `Tạo một bản tóm tắt ngắn gọn và rõ ràng.
      Yêu cầu:
      - 3–5 đoạn văn súc tích.
      - Dễ hiểu, tập trung vào các ý tưởng cốt lõi nhất.`;
      break;
    case "Critical Review":
      modePrompt = `Đóng vai một chuyên gia phê bình sách/nội dung.
      Bao gồm:
      - Điểm mạnh của nội dung.
      - Điểm yếu hoặc các hạn chế.
      - Các góc nhìn còn thiếu hoặc chưa được khai thác.
      - Đề xuất cải thiện mang tính xây dựng.
      Văn phong: Chuyên nghiệp, sâu sắc, khách quan.`;
      break;
    case "Debate Mode":
      modePrompt = `Tạo một cuộc tranh luận giữa hai quan điểm đối lập về nội dung này.
      - Side A: Ủng hộ và bảo vệ các ý tưởng.
      - Side B: Thách thức, phản biện và chỉ ra các lỗ hổng.
      Yêu cầu:
      - Lập luận logic, sắc bén.
      - Trao đổi qua lại kịch tính.
      - Lý lẽ thực tế, thuyết phục.
      Định dạng:
      Side A: ...
      Side B: ...`;
      break;
  }

  const prompt = `Bạn là một chuyên gia phân tích AI cao cấp. 
  Hãy thực hiện phân tích nội dung sau theo chế độ: ${mode} và phong cách: ${style === "Concise" ? "Ngắn gọn" : "Chuyên sâu"}.
  Yêu cầu trả về bằng TIẾNG VIỆT.
  Tự động IN ĐẬM (bold) các thông tin quan trọng (key insights).

  ${modePrompt}`;

  const contents = typeof input === "string" 
    ? [{ parts: [{ text: `${prompt}\n\nNội dung: ${input}` }] }]
    : { parts: [{ inlineData: input }, { text: prompt }] };

  const ai = getAI();
  const response = await ai.models.generateContent({
    model,
    contents: typeof input === "string" ? contents : [contents as any],
  });

  return response.text || "";
}

export async function generateCustomAudioOverview(
  input: string | { data: string; mimeType: string },
  config: AudioOverviewConfig
): Promise<{ content: string; audioUrl: string }> {
  const model = MODEL_FLASH;
  
  let modePrompt = "";
  switch (config.mode) {
    case "Deep Exploration":
      modePrompt = `Tạo một cuộc hội thoại podcast năng động giữa HAI người dẫn chương trình AI về nội dung này.
      Nhân vật:
      - Host A: Phân tích, logic, điềm đạm.
      - Host B: Tò mò, hay đặt câu hỏi, năng động.
      Nội dung: Khám phá sâu các ý tưởng, kết nối các chủ đề, đưa ra ví dụ thực tế, hỏi và đáp.
      Định dạng:
      Host A: ...
      Host B: ...`;
      break;
    case "Quick Summary":
      modePrompt = `Tạo một bản tóm tắt ngắn gọn và rõ ràng.
      Yêu cầu: Dễ hiểu, tập trung vào các ý tưởng chính.`;
      break;
    case "Critical Review":
      modePrompt = `Đóng vai một chuyên gia phê bình sách/nội dung.
      Bao gồm: Điểm mạnh, điểm yếu hoặc hạn chế, các góc nhìn còn thiếu, đề xuất cải thiện.
      Văn phong: Xây dựng, chuyên nghiệp, sâu sắc.`;
      break;
    case "Debate Mode":
      modePrompt = `Tạo một cuộc tranh luận giữa hai quan điểm về nội dung này.
      - Side A: Ủng hộ các ý tưởng.
      - Side B: Thách thức / Phê bình các ý tưởng.
      Yêu cầu: Lập luận logic, trao đổi qua lại, lý lẽ thực tế.
      Định dạng:
      Side A: ...
      Side B: ...`;
      break;
  }

  const lengthPrompt = config.length === "Short" ? "Ngắn gọn, súc tích." : config.length === "Long" ? "Chi tiết, đầy đủ các khía cạnh." : "Độ dài vừa phải, cân đối.";
  const languagePrompt = `Yêu cầu trả về bằng ${config.language}.`;
  const instructionPrompt = config.customInstruction ? `Yêu cầu bổ sung: ${config.customInstruction}` : "";

  const prompt = `Bạn là một chuyên gia phân tích AI cao cấp. 
  Hãy thực hiện phân tích nội dung sau theo chế độ: ${config.mode}.
  ${languagePrompt}
  ${lengthPrompt}
  ${instructionPrompt}
  Tự động IN ĐẬM (bold) các thông tin quan trọng (key insights).

  ${modePrompt}`;

  const contents = typeof input === "string" 
    ? [{ parts: [{ text: `${prompt}\n\nNội dung: ${input}` }] }]
    : { parts: [{ inlineData: input }, { text: prompt }] };

  const ai = getAI();
  const response = await ai.models.generateContent({
    model,
    contents: typeof input === "string" ? contents : [contents as any],
  });

  const content = response.text || "";
  let audioUrl = "";

  if (config.mode === "Deep Exploration" || config.mode === "Debate Mode") {
    audioUrl = await generateMultiSpeakerSpeech(content, config.voiceType, config.mode);
  } else {
    const voiceName = config.voiceType === "Nam" ? "Fenrir" : config.voiceType === "Nữ" ? "Zephyr" : "Kore";
    audioUrl = await generateSpeech(content, voiceName);
  }

  return { content, audioUrl };
}

export async function generateMultiSpeakerSpeech(text: string, voiceType: VoiceType = "Podcast host", mode?: DeepAnalysisMode): Promise<string> {
  try {
    // Parse script into parts
    const lines = text.split('\n');
    const script: { speaker: 'A' | 'B'; text: string }[] = [];
    
    let currentSpeaker: 'A' | 'B' | null = null;
    let currentText = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isHostA = trimmed.startsWith('Host A:') || trimmed.startsWith('Side A:');
      const isHostB = trimmed.startsWith('Host B:') || trimmed.startsWith('Side B:');

      if (isHostA || isHostB) {
        if (currentSpeaker && currentText) {
          script.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        currentSpeaker = isHostA ? 'A' : 'B';
        currentText = trimmed.split(':')[1] || "";
      } else if (currentSpeaker) {
        currentText += " " + trimmed;
      }
    }
    
    if (currentSpeaker && currentText) {
      script.push({ speaker: currentSpeaker, text: currentText.trim() });
    }

    if (script.length === 0) {
      // Fallback if no speakers found
      return await generateSpeech(text);
    }

    const audioBlobs: Blob[] = [];

    for (const part of script) {
      const voice = part.speaker === "A" ? "vi-VN-Wavenet-D" : "vi-VN-Wavenet-A";
      const chunks = splitText(part.text, 2000); // Smaller chunks for SSML safety

      for (const chunk of chunks) {
        // Add SSML with break
        const ssml = `<speak>${chunk.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[m] as string))} <break time='600ms'/></speak>`;
        
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ssml, voice }),
        });

        if (response.ok) {
          audioBlobs.push(await response.blob());
        }
      }
    }

    if (audioBlobs.length === 0) throw new Error("No audio generated");

    const finalBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
    return URL.createObjectURL(finalBlob);

  } catch (error) {
    console.warn("Advanced multi-speaker TTS failed, falling back to Gemini...", error);
    const hostAVoice = voiceType === "Nam" ? "Fenrir" : voiceType === "Nữ" ? "Zephyr" : "Kore";
    return await generateGeminiSpeech(text, hostAVoice);
  }
}

export interface PodcastPart {
  speaker: 'A' | 'B';
  text: string;
}

export async function generateFullPodcastStudio(sections: { deep: string; summary: string; critique: string; debate: string }): Promise<{ audioUrl: string; script: PodcastPart[] }> {
  const script: PodcastPart[] = [
    { speaker: "A", text: `Chào mừng bạn đến với podcast phân tích chuyên sâu của AI Book Summary Pro.` },
    { speaker: "A", text: `Đầu tiên, chúng ta hãy cùng tìm hiểu sâu về nội dung này.` },
    { speaker: "A", text: sections.deep },
    { speaker: "B", text: `Cảm ơn Host A. Để tiếp nối, tôi xin được tóm tắt lại những điểm cốt lõi nhất.` },
    { speaker: "B", text: sections.summary },
    { speaker: "A", text: `Một bản tóm tắt rất súc tích. Tuy nhiên, dưới góc nhìn phê bình, chúng ta cũng cần xem xét các khía cạnh khác.` },
    { speaker: "A", text: sections.critique },
    { speaker: "B", text: `Đúng vậy, và để làm rõ hơn, chúng ta hãy cùng bước vào phần tranh luận đa chiều.` },
    { speaker: "B", text: sections.debate },
    { speaker: "A", text: `Cuộc thảo luận hôm nay thật sự rất thú vị. Hy vọng những thông tin này sẽ hữu ích cho các bạn.` },
    { speaker: "A", text: `Cảm ơn bạn đã lắng nghe. Hẹn gặp lại trong các tập podcast tiếp theo.` }
  ];

  try {
    const response = await fetch("/api/tts-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate full podcast studio audio.");
    }

    const blob = await response.blob();
    return { 
      audioUrl: URL.createObjectURL(blob),
      script 
    };
  } catch (error) {
    console.error("Error in generateFullPodcastStudio:", error);
    throw error;
  }
}

export async function generatePodcastCovers(title: string): Promise<string[]> {
  const styles = [
    {
      name: "Minimal Clean",
      prompt: `A minimal clean podcast cover for "${title}". White and soft gradient background, elegant typography, Apple-style design, professional, high quality, 4k. Include text "Podcast AI Summary".`
    },
    {
      name: "Dark Cinematic",
      prompt: `A dark cinematic podcast cover for "${title}". Deep blue and black background, glowing neon light accents, dramatic lighting, Netflix-style aesthetic, high quality, 4k. Include text "Podcast AI Summary".`
    },
    {
      name: "Bold Modern",
      prompt: `A bold modern podcast cover for "${title}". Bright vibrant colors, big bold typography, startup tech vibe, eye-catching, high quality, 4k. Include text "Podcast AI Summary".`
    },
    {
      name: "Artistic Abstract",
      prompt: `An artistic abstract podcast cover for "${title}". Creative illustrations, abstract shapes, surreal visuals, unique and modern, high quality, 4k. Include text "Podcast AI Summary".`
    }
  ];

  try {
    const ai = getAI();
    const imagePromises = styles.map(async (style) => {
      try {
        const response = await ai.models.generateContent({
          model: MODEL_IMAGE,
          contents: [{
            parts: [{ text: style.prompt }],
          }],
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return imagePart?.inlineData?.data ? `data:image/png;base64,${imagePart.inlineData.data}` : null;
      } catch (err) {
        console.error(`Error generating image for style ${style.name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);
    return results.filter((img): img is string => img !== null);
  } catch (error) {
    console.error("Error in generatePodcastCovers:", error);
    return [];
  }
}

/**
 * Splits long text into smaller chunks to avoid TTS API limits.
 */
function splitText(text: string, maxLength: number = 4000): string[] {
  const chunks: string[] = [];
  let current = "";

  text.split(".").forEach(sentence => {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) return;
    
    if ((current + trimmedSentence).length > maxLength) {
      if (current) chunks.push(current.trim());
      current = trimmedSentence + ". ";
    } else {
      current += trimmedSentence + ". ";
    }
  });

  if (current) chunks.push(current.trim());
  return chunks;
}

export async function generateSpeech(text: string, voiceName: string = 'vi-VN-Standard-A'): Promise<string> {
  try {
    // Split text into chunks if it's too long
    const chunks = splitText(text, 4000);
    
    if (chunks.length > 1) {
      console.log(`Text too long (${text.length} chars), splitting into ${chunks.length} chunks...`);
      const audioUrls = await Promise.all(chunks.map(chunk => generateSpeechChunk(chunk, voiceName)));
      return audioUrls[0]; 
    }

    return await generateSpeechChunk(text, voiceName);
  } catch (error: any) {
    console.error("Error in generateSpeech:", error);
    try {
      return await generateGeminiSpeech(text, voiceName);
    } catch (fallbackError) {
      throw error;
    }
  }
}

async function generateSpeechChunk(text: string, voiceName: string): Promise<string> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice: voiceName === 'Nam' ? 'vi-VN-Standard-B' : voiceName === 'Nữ' ? 'vi-VN-Standard-A' : voiceName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.warn(`Backend TTS chunk issue (${errorData.error}), falling back to Gemini TTS...`);
    return await generateGeminiSpeech(text, voiceName);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error("Received empty audio blob from server.");
  }
  return URL.createObjectURL(blob);
}

async function generateGeminiSpeech(text: string, voiceName: string): Promise<string> {
  const geminiVoice = voiceName === 'Nam' ? 'Fenrir' : voiceName === 'Nữ' ? 'Zephyr' : 'Kore';
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: geminiVoice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate speech from Gemini TTS fallback.");
  }
  return pcmToWav(base64Audio);
}

function pcmToWav(pcmBase64: string, sampleRate: number = 24000): string {
  try {
    const binaryString = atob(pcmBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const buffer = new ArrayBuffer(44 + bytes.length);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bytes.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bytes.length, true);

    for (let i = 0; i < bytes.length; i++) {
      view.setUint8(44 + i, bytes[i]);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error converting PCM to WAV:", e);
    return `data:audio/wav;base64,${pcmBase64}`;
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export async function chatWithAI(
  message: string,
  history: { role: string; parts: { text: string }[] }[] = [],
  context?: string
): Promise<string> {
  const model = MODEL_FLASH;
  
  const systemInstruction = `Bạn là trợ lý AI cao cấp của "AI Book Summary Pro". 
  Bạn đang hỗ trợ người dùng thảo luận về nội dung sách hoặc tài liệu.
  Hãy trả lời một cách thông minh, sâu sắc và truyền cảm hứng.
  ${context ? `Ngữ cảnh hiện tại: ${context}` : ""}`;

  const ai = getAI();
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
    history: history.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: h.parts
    }))
  });

  const response = await chat.sendMessage({ message });
  return response.text || "";
}

export async function generateFacebookPost(
  analysis: BookAnalysis,
  style: FacebookPostStyle = "Professional"
): Promise<string> {
  const model = MODEL_FLASH;
  
  const prompt = `Bạn là một chuyên gia Content Creator chuyên về review sách trên Facebook.
  Hãy viết một bài đăng Facebook cho cuốn sách "${analysis.title}" TUÂN THỦ NGHIÊM NGẶT cấu trúc sau đây:
  
  📚 [${analysis.title.toUpperCase()}] – CUỐN SÁCH BẠN NÊN ĐỌC ÍT NHẤT 1 LẦN TRONG ĐỜI!
  
  Bạn đã bao giờ tự hỏi… điều gì có thể thay đổi tư duy của bạn chỉ sau vài chương sách?
  
  ✨ *${analysis.title}* không chỉ là một cuốn sách, mà là:
  👉 Một hành trình khai mở tư duy
  👉 Một tấm gương phản chiếu chính bạn
  👉 Một nguồn cảm hứng cực mạnh
  
  📖 **TÓM TẮT NHANH:**
  – Nội dung chính: [Dựa trên tóm tắt: ${analysis.summary}]
  – Nhân vật/ý tưởng nổi bật: [Dựa trên các ý chính: ${analysis.keyIdeas.join(", ")}]
  – Cao trào: [Dựa trên các insight: ${analysis.insights.join(", ")}]
  
  🔥 **VÌ SAO NÊN ĐỌC?**
  ✔ Giúp bạn hiểu rõ bản thân
  ✔ Thay đổi cách nhìn cuộc sống
  ✔ Cực kỳ dễ đọc – cuốn hút từ trang đầu
  
  🎧 Đặc biệt: Đã có bản PODCAST – nghe mọi lúc mọi nơi!
  
  👉 Comment “SÁCH” để nhận ngay bản tóm tắt + podcast miễn phí!
  
  🖼️ **CHI TIẾT BÌA SÁCH:**
  - Thiết kế: [Mô tả phong cách thiết kế bìa sách dựa trên tiêu đề và nội dung: ${analysis.title}]
  - Màu sắc chủ đạo: [Gợi ý màu sắc phù hợp với tinh thần cuốn sách]
  - Cảm giác mang lại: [Cảm xúc mà bìa sách nên truyền tải]
  
  #reviewsach #docsach #phattrienbanthan #podcast
  
  Lưu ý: 
  - Giữ nguyên các emoji và định dạng (in đậm, in nghiêng).
  - Phần nội dung trong ngoặc vuông [] hãy viết lại sao cho hấp dẫn, súc tích và phù hợp với ngữ cảnh của cuốn sách.
  - Không thêm bất kỳ nội dung nào khác ngoài cấu trúc trên.`;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text || "";
}

export async function fixSpelling(text: string): Promise<string> {
  const model = MODEL_FLASH;
  const prompt = `Sửa lỗi chính tả tiếng Việt, giữ nguyên ý nghĩa: "${text}"`;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text || text;
}

export async function syncUserProfile(user: any) {
  if (!user) return;
  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName || "Anonymous",
      email: user.email,
      photoURL: user.photoURL,
      role: "user",
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveAnalysis(analysis: BookAnalysis): Promise<string> {
  if (!auth.currentUser) throw new Error("User must be logged in to save analysis");
  
  const path = "analyses";
  try {
    const docRef = await addDoc(collection(db, path), {
      ...analysis,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return "";
  }
}

export async function getAnalysisHistory(): Promise<BookAnalysis[]> {
  if (!auth.currentUser) return [];
  
  const path = "analyses";
  try {
    const q = query(
      collection(db, path),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate()
    } as BookAnalysis));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteAnalysis(id: string): Promise<void> {
  const path = `analyses/${id}`;
  try {
    await deleteDoc(doc(db, "analyses", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
