import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Upload, 
  Mic, 
  Loader2, 
  Play, 
  Pause, 
  Download,
  Sparkles,
  Search,
  Lightbulb,
  FileText,
  Copy,
  RefreshCw,
  FileDown,
  Video,
  Check,
  Image as ImageIcon,
  Maximize2,
  X,
  Zap,
  Shield,
  MessageSquare,
  Volume2,
  ChevronRight,
  Settings2,
  Share2,
  FileJson,
  Facebook
} from 'lucide-react';
import { RunnerScene } from './RunnerScene';
import { 
  analyzeBook, 
  generateSpeech, 
  generatePodcastCovers, 
  performDeepAnalysis,
  generateMultiSpeakerSpeech,
  generateFacebookPost,
  BookAnalysis, 
  AnalysisMode,
  DeepAnalysisMode,
  AnalysisStyle,
  AudioOverviewConfig,
  AudioOverviewLanguage,
  AudioOverviewLength,
  VoiceType,
  FacebookPostStyle,
  generateCustomAudioOverview,
  generateFullPodcastStudio,
  PodcastPart,
  chatWithAI,
  BACKGROUND_MUSIC_TRACKS
} from '../services/aiService';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TypewriterText = ({ text, speed = 5, theme = 'dark' }: { text: string; speed?: number; theme?: PlayerTheme }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className={cn(
      "prose max-w-none prose-p:leading-relaxed",
      theme === 'light' ? "prose-p:text-black/70" : "prose-invert prose-p:text-white/70"
    )}>
      <Markdown>{displayedText}</Markdown>
    </div>
  );
};

const StarBackground = () => {
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; duration: string }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="stars-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            '--duration': star.duration
          } as any}
        />
      ))}
    </div>
  );
};

const SkeletonLoader = ({ theme = 'dark' }: { theme?: PlayerTheme }) => (
  <div className="space-y-8">
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="w-1/2 h-full bg-accent-primary shadow-[0_0_15px_rgba(245,158,11,0.5)]"
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn(
          "p-8 space-y-6 flex flex-col min-h-[400px] rounded-3xl border backdrop-blur-md",
          theme === 'light' ? "bg-black/30 border-black/10" : "glass-ui"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl skeleton", theme === 'light' ? "bg-black/30" : "bg-white/30")} />
              <div className={cn("h-6 w-32 rounded-lg skeleton", theme === 'light' ? "bg-black/30" : "bg-white/30")} />
            </div>
            <div className={cn("w-4 h-4 rounded-full skeleton", theme === 'light' ? "bg-black/10" : "bg-white/10")} />
          </div>
          <div className="space-y-4 flex-1">
            <div className={cn("h-4 w-full rounded-lg skeleton", theme === 'light' ? "bg-black/10" : "bg-white/10")} />
            <div className={cn("h-4 w-5/6 rounded-lg skeleton", theme === 'light' ? "bg-black/10" : "bg-white/10")} />
            <div className={cn("h-4 w-4/6 rounded-lg skeleton", theme === 'light' ? "bg-black/10" : "bg-white/10")} />
            <div className={cn("h-4 w-full rounded-lg skeleton", theme === 'light' ? "bg-black/10" : "bg-white/10")} />
            <div className={cn("h-4 w-3/4 rounded-lg skeleton", theme === 'light' ? "bg-black/10" : "bg-white/10")} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

type PlayerTheme = 'dark' | 'light' | 'accent-focused';

export default function BookAssistant() {
  const [input, setInput] = useState('Phố phường Hà Nội xưa');
  const [note, setNote] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('AI đang phân tích...');
  const [playerTheme, setPlayerTheme] = useState<PlayerTheme>('dark');
  const [analysis, setAnalysis] = useState<BookAnalysis | null>({
    title: "Phố phường Hà Nội xưa",
    introduction: "Tác phẩm là một tập bút ký đặc sắc của Thạch Lam, khắc họa vẻ đẹp văn hóa, đời sống và đặc biệt là nghệ thuật ẩm thực của Hà Nội những năm đầu thế kỷ 20.",
    summary: "Tác phẩm là một tập bút ký đặc sắc của Thạch Lam, khắc họa vẻ đẹp văn hóa, đời sống và đặc biệt là nghệ thuật ẩm thực của Hà Nội những năm đầu thế kỷ 20. Qua ngòi bút tinh tế, nhạy cảm, tác giả đưa người đọc len lỏi vào từng con phố nhỏ, cảm nhận cái hồn cốt của kinh kỳ qua những món quà quê, những phong tục tập quán và lối sống thanh lịch của người Tràng An. Đây không chỉ là một cuốn sách về địa lý hay lịch sử, mà là một bức tranh tâm hồn về một Hà Nội xưa cũ, đầy hoài niệm và trân trọng.",
    detailedSummary: "Cuốn sách bao gồm nhiều bài viết ngắn về các khía cạnh khác nhau của Hà Nội. Tác giả đi sâu vào miêu tả các phố nghề, các món ăn đặc sản như phở, bún chả, cốm Vòng, và những nét sinh hoạt đời thường của người dân. Mỗi chương là một lát cắt tinh tế về tâm hồn Hà Nội.",
    keyIdeas: [
      "Hà Nội 36 phố phường: Mỗi con phố mang một nét riêng, một cái tên gắn liền với một nghề thủ công truyền thống.",
      "Văn hóa ẩm thực tinh tế: Thạch Lam dành nhiều tâm huyết viết về các món quà Hà Nội như bún chả, phở, cốm Vòng... coi đó là nghệ thuật và di sản.",
      "Lối sống thanh lịch: Khắc họa cốt cách, tâm hồn người Hà Nội qua những chi tiết đời thường nhưng đầy chất thơ.",
      "Sự biến đổi của thời đại: Những trăn trở về việc bảo tồn nét đẹp truyền thống trước sự xâm nhập của văn hóa mới.",
      "Nghệ thuật bút ký: Ngôn ngữ nhẹ nhàng, giàu hình ảnh và cảm xúc, đặc trưng cho phong cách lãng mạn của Tự Lực Văn Đoàn."
    ],
    podcastScript: "Chào mừng các bạn đến với Podcast AI Book Summary. Hôm nay, chúng ta sẽ cùng ngược dòng thời gian về với 'Phố phường Hà Nội xưa' của nhà văn Thạch Lam.\n\nBạn có bao giờ tự hỏi, Hà Nội của gần một thế kỷ trước trông như thế nào không? Qua giọng văn nhẹ như sương khói của Thạch Lam, Hà Nội hiện lên không phải bằng những con số khô khan, mà bằng hương vị của bát phở nóng hổi bên vỉa hè, bằng tiếng rao đêm xao xác, và bằng cái thanh lịch rất riêng của người dân phố cổ.\n\nThạch Lam không chỉ tả phố, ông tả 'hồn' phố. Ông trân trọng từng món quà quê, coi đó là những 'tinh hoa' của đất trời. Cuốn sách nhắc nhở chúng ta rằng, giữa nhịp sống hối hả hôm nay, vẫn có một Hà Nội thâm trầm, tinh tế cần được nâng niu trong ký ức mỗi người.\n\nHãy cùng lắng nghe và cảm nhận một Hà Nội thật khác, thật xưa qua bản tóm tắt chi tiết này nhé.",
    insights: [
      "Văn hóa không chỉ là những gì to tát, mà nằm trong từng món ăn, từng tiếng rao.",
      "Sự thanh lịch của người Hà Nội là một di sản tinh thần quý giá.",
      "Hoài niệm là cách để chúng ta giữ gìn bản sắc trong thế giới hiện đại."
    ],
    contentIdeas: {
      tiktok: ["Review các món ăn Thạch Lam nhắc tới", "So sánh phố cổ xưa và nay"],
      youtube: ["Hành trình đi tìm hồn cốt Hà Nội qua trang sách", "Phim tài liệu ngắn về 36 phố phường"],
      blog: ["Tại sao Thạch Lam là nhà văn của Hà Nội?", "Nghệ thuật thưởng thức quà Hà Nội"]
    }
  });
  const [covers, setCovers] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const parallaxRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Parallax for hero title
      if (parallaxRef.current) {
        const { innerWidth, innerHeight } = window;
        const x = (e.clientX / innerWidth - 0.5) * 2;
        const y = (e.clientY / innerHeight - 0.5) * 2;
        const moveX = x * 20;
        const moveY = y * 20;
        parallaxRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }

      // 3D Rotation for badge
      const x = (e.clientX / window.innerWidth - 0.5);
      const y = (e.clientY / window.innerHeight - 0.5);
      targetX = x * 40;
      targetY = y * 25;

      // Shine effect for badge
      if (badgeRef.current) {
        const rect = badgeRef.current.getBoundingClientRect();
        const shineX = ((e.clientX - rect.left) / rect.width) * 100;
        const shineY = ((e.clientY - rect.top) / rect.height) * 100;
        badgeRef.current.style.setProperty("--x", `${shineX}%`);
        badgeRef.current.style.setProperty("--y", `${shineY}%`);
      }
    };

    const animateBadge = () => {
      if (badgeRef.current) {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        badgeRef.current.style.transform = `
          translateX(-50%)
          rotateX(${-currentY}deg)
          rotateY(${currentX}deg)
        `;
      }
      animationFrameId = requestAnimationFrame(animateBadge);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animateBadge();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [mode, setMode] = useState<AnalysisMode>("Deep Analysis");
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);

  // Deep Analysis States
  const [activeDeepMode, setActiveDeepMode] = useState<DeepAnalysisMode>("Deep Exploration");
  const [analysisStyle, setAnalysisStyle] = useState<AnalysisStyle>("Deep");
  const [deepAnalysisResults, setDeepAnalysisResults] = useState<Partial<Record<DeepAnalysisMode, string>>>({});
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepAudioUrls, setDeepAudioUrls] = useState<Partial<Record<DeepAnalysisMode, string>>>({});
  const [deepAudioDurations, setDeepAudioDurations] = useState<Partial<Record<DeepAnalysisMode, number>>>({});
  
  // Custom Audio Overview States
  const [isAudioConfigOpen, setIsAudioConfigOpen] = useState(false);
  const [audioConfig, setAudioConfig] = useState<AudioOverviewConfig>({
    mode: "Deep Exploration",
    language: "Tiếng Việt",
    length: "Default",
    voiceType: "Podcast host",
    hasBackgroundMusic: true,
    backgroundMusicTrack: "soft-piano",
    customInstruction: ""
  });
  const [customAudioLoading, setCustomAudioLoading] = useState(false);
  const [isGeneratingCovers, setIsGeneratingCovers] = useState(false);
  const [activeCoverIndex, setActiveCoverIndex] = useState<number | null>(null);

  // Facebook Post States
  const [facebookPost, setFacebookPost] = useState<string | null>(null);
  const [facebookPostStyle, setFacebookPostStyle] = useState<FacebookPostStyle>("Professional");
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Full Podcast Studio States
  const [isFullStudioOpen, setIsFullStudioOpen] = useState(false);
  const [fullPodcastSections, setFullPodcastSections] = useState({
    deep: "",
    summary: "",
    critique: "",
    debate: ""
  });
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);
  const [isGeneratingFullPodcast, setIsGeneratingFullPodcast] = useState(false);
  const [isPodcastLoading, setIsPodcastLoading] = useState(false);
  const [podcastScript, setPodcastScript] = useState<PodcastPart[]>([]);
  const [activeScriptIndex, setActiveScriptIndex] = useState(-1);
  
  // Chat States
  const [chatHistory, setChatHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatAudioUrl, setChatAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backgroundMusicUrl = BACKGROUND_MUSIC_TRACKS.find(t => t.id === audioConfig.backgroundMusicTrack)?.url || BACKGROUND_MUSIC_TRACKS[0].url;

  useEffect(() => {
    if (isPlaying && audioConfig.hasBackgroundMusic) {
      setIsMusicPlaying(true);
    } else {
      setIsMusicPlaying(false);
    }
  }, [isPlaying, audioConfig.hasBackgroundMusic]);

  useEffect(() => {
    if (musicRef.current) {
      if (isMusicPlaying) {
        musicRef.current.volume = 0.1;
        musicRef.current.play().catch(() => {});
      } else {
        musicRef.current.pause();
      }
    }
  }, [isMusicPlaying]);

  useEffect(() => {
    if (loading) {
      const texts = ['AI đang phân tích...', 'Đang trích xuất ý tưởng...', 'Đang tạo kịch bản podcast...', 'Đang thiết kế ảnh bìa...'];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingText(texts[i % texts.length]);
        i++;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setImage({ data: base64Data, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setImage({
          data: base64.split(',')[1],
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!input && !image) return;
    setLoading(true);
    setAnalysis(null);
    setCovers([]);
    setAudioUrl(null);
    setDeepAnalysisResults({});
    setDeepAudioUrls({});
    
    try {
      setIsPodcastLoading(true);
      const result = await analyzeBook(image || input, mode);
      setAnalysis(result);
      
      try {
        const audio = await generateSpeech(result.podcastScript);
        setAudioUrl(audio);
      } catch (audioErr: any) {
        console.error("Audio generation error:", audioErr);
        setError(audioErr.message || "Failed to generate podcast audio.");
      }
      
      handleDeepAnalysis("Deep Exploration", analysisStyle);
    } catch (error: any) {
      console.error("Error processing book:", error);
      setError(error.message || "An error occurred while analyzing the book.");
    } finally {
      setIsPodcastLoading(false);
      setLoading(false);
    }
  };

  const handleGenerateCovers = async () => {
    if (!analysis) return;
    setIsGeneratingCovers(true);
    setActiveCoverIndex(null);
    try {
      const coverImages = await generatePodcastCovers(analysis.title);
      setCovers(coverImages);
    } catch (error) {
      console.error("Error generating covers:", error);
    } finally {
      setIsGeneratingCovers(false);
    }
  };

  const handleDownloadCover = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `podcast-cover-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateModeAudio = async (mode: DeepAnalysisMode) => {
    if (!deepAnalysisResults[mode]) return;
    setLoading(true);
    setLoadingText(`Đang tạo bản podcast cho ${mode}...`);
    try {
      const config: AudioOverviewConfig = {
        ...audioConfig,
        mode,
        length: analysisStyle === "Concise" ? "Short" : "Default" as any // Map style to length
      };
      const { audioUrl } = await generateCustomAudioOverview(image || input, config);
      setDeepAudioUrls(prev => ({ ...prev, [mode]: audioUrl }));
      
      // Get duration
      const tempAudio = new Audio(audioUrl);
      tempAudio.onloadedmetadata = () => {
        setDeepAudioDurations(prev => ({ ...prev, [mode]: tempAudio.duration }));
      };
    } catch (error: any) {
      console.error("Error generating mode audio:", error);
      setError(error.message || `Failed to generate audio for ${mode}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepAnalysis = async (m: DeepAnalysisMode, s: AnalysisStyle) => {
    if (!input && !image) return;
    setDeepLoading(true);
    try {
      const content = await performDeepAnalysis(image || input, m, s);
      setDeepAnalysisResults(prev => ({ ...prev, [m]: content }));
      
      if (m === "Deep Exploration" || m === "Debate Mode") {
        try {
          const audio = await generateMultiSpeakerSpeech(content, audioConfig.voiceType, m);
          setDeepAudioUrls(prev => ({ ...prev, [m]: audio }));
        } catch (audioErr: any) {
          console.error("Multi-speaker audio error:", audioErr);
          setError(audioErr.message || "Failed to generate multi-speaker audio.");
        }
      }
    } catch (error: any) {
      console.error("Error in deep analysis:", error);
      setError(error.message || "Deep analysis failed.");
    } finally {
      setDeepLoading(false);
    }
  };

  const onTabChange = (m: DeepAnalysisMode) => {
    setActiveDeepMode(m);
    if (!deepAnalysisResults[m]) {
      handleDeepAnalysis(m, analysisStyle);
    }
  };

  const handleGenerateFacebookPost = async () => {
    if (!analysis) return;
    setFacebookLoading(true);
    try {
      const post = await generateFacebookPost(analysis, facebookPostStyle);
      setFacebookPost(post);
    } catch (error) {
      console.error("Error generating Facebook post:", error);
    } finally {
      setFacebookLoading(false);
    }
  };

  const onStyleChange = (s: AnalysisStyle) => {
    setAnalysisStyle(s);
    handleDeepAnalysis(activeDeepMode, s);
  };

  const toggleAudio = (url: string | null, mode?: DeepAnalysisMode) => {
    if (audioRef.current && url) {
      const isSameUrl = audioRef.current.src.includes(url);
      
      if (isPlaying && isSameUrl) {
        audioRef.current.pause();
        if (musicRef.current) musicRef.current.pause();
        setIsPlaying(false);
      } else {
        if (!isSameUrl) {
          audioRef.current.src = url;
          setCurrentTime(0);
        }
        audioRef.current.play();
        setIsPlaying(true);
        
        // Handle background music
        if (audioConfig.hasBackgroundMusic && musicRef.current) {
          musicRef.current.volume = 0.15;
          musicRef.current.play();
        }
        
        // Update duration if not set
        audioRef.current.onloadedmetadata = () => {
          if (mode) {
            setDeepAudioDurations(prev => ({ ...prev, [mode]: audioRef.current?.duration }));
          } else {
            setAudioDuration(audioRef.current?.duration || null);
          }
        };
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    
    const newHistory = [...chatHistory, { role: "user", parts: [{ text: userMessage }] }];
    setChatHistory(newHistory);
    setIsChatLoading(true);
    
    try {
      const context = analysis ? `Người dùng đang thảo luận về cuốn sách: ${analysis.title}. Tóm tắt: ${analysis.summary}` : "";
      const reply = await chatWithAI(userMessage, chatHistory, context);
      
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: reply }] }]);
      
      // Auto generate podcast (audio) from the reply as requested
      const audio = await generateSpeech(reply);
      setChatAudioUrl(audio);
      
      // Auto play the reply audio
      if (audioRef.current) {
        audioRef.current.src = audio;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Không thể gửi tin nhắn.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const downloadAudio = (url: string | null, filename: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getVoiceName = (type: VoiceType) => {
    if (type === "Nam") return "echo";
    if (type === "Nữ") return "nova";
    return "alloy";
  };

  const openFullStudio = () => {
    setFullPodcastSections({
      deep: deepAnalysisResults["Deep Exploration"] || "",
      summary: analysis?.summary || "",
      critique: deepAnalysisResults["Critical Review"] || "",
      debate: deepAnalysisResults["Debate Mode"] || ""
    });
    setFullAudioUrl(null);
    setIsFullStudioOpen(true);
  };

  const handleGenerateFullPodcast = async () => {
    const { deep, summary, critique, debate } = fullPodcastSections;
    
    if (!deep && !summary && !critique && !debate) {
      setError("Vui lòng điền ít nhất một phần nội dung.");
      return;
    }

    setIsGeneratingFullPodcast(true);
    setIsPodcastLoading(true);
    setError(null);
    setPodcastScript([]);
    setActiveScriptIndex(-1);
    try {
      const { audioUrl, script } = await generateFullPodcastStudio(fullPodcastSections);
      setFullAudioUrl(audioUrl);
      setPodcastScript(script);
      
      // Auto play
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }

      // Start highlighting (approximate timing)
      let currentIndex = 0;
      const interval = setInterval(() => {
        setActiveScriptIndex(currentIndex);
        currentIndex++;
        if (currentIndex >= script.length) clearInterval(interval);
      }, 5000); // 5 seconds per part as a rough estimate

    } catch (err: any) {
      console.error("Full podcast generation error:", err);
      setError(err.message || "Không thể tạo podcast đầy đủ.");
    } finally {
      setIsGeneratingFullPodcast(false);
      setIsPodcastLoading(false);
    }
  };

  const handleCreateCustomAudio = async () => {
    if (!input && !image) return;
    setCustomAudioLoading(true);
    setIsPodcastLoading(true);
    setIsAudioConfigOpen(false);
    setLoading(true);
    setLoadingText("AI đang tạo podcast...");
    
    try {
      const { content, audioUrl } = await generateCustomAudioOverview(image || input, audioConfig);
      setDeepAnalysisResults(prev => ({ ...prev, [audioConfig.mode]: content }));
      setDeepAudioUrls(prev => ({ ...prev, [audioConfig.mode]: audioUrl }));
      
      // Get duration
      const tempAudio = new Audio(audioUrl);
      tempAudio.onloadedmetadata = () => {
        setDeepAudioDurations(prev => ({ ...prev, [audioConfig.mode]: tempAudio.duration }));
      };
      
      setActiveDeepMode(audioConfig.mode);
      
      if (!analysis) {
        setAnalysis({
          title: "Custom Audio Overview",
          introduction: "Bản tóm tắt âm thanh tùy chỉnh được tạo bởi AI.",
          summary: content,
          detailedSummary: content,
          keyIdeas: [],
          podcastScript: content,
          insights: [],
          contentIdeas: { tiktok: [], youtube: [], blog: [] }
        });
      }
    } catch (error: any) {
      console.error("Error creating custom audio:", error);
      setError(error.message || "Failed to create custom audio overview.");
    } finally {
      setCustomAudioLoading(false);
      setIsPodcastLoading(false);
      setLoading(false);
    }
  };

  const deepModes: { id: DeepAnalysisMode; label: string; icon: any; description: string }[] = [
    { id: "Deep Exploration", label: "Tìm hiểu sâu", icon: Search, description: "Một cuộc trò chuyện sôi nổi giữa 2 máy chủ AI, phân tích và kết nối các chủ đề" },
    { id: "Quick Summary", label: "Tóm tắt", icon: FileText, description: "Thông tin tổng quan ngắn gọn giúp bạn nắm bắt nhanh ý chính" },
    { id: "Critical Review", label: "Phê bình", icon: Shield, description: "Một bài đánh giá chuyên gia với phản hồi mang tính xây dựng" },
    { id: "Debate Mode", label: "Tranh luận", icon: MessageSquare, description: "Một cuộc tranh luận giữa 2 góc nhìn khác nhau" },
  ];

  const smartModes: { id: AnalysisMode; label: string; description: string }[] = [
    { id: "Beginner", label: "Beginner", description: "Ngôn ngữ đơn giản, dễ hiểu" },
    { id: "Deep Analysis", label: "Advanced", description: "Phân tích sâu, đa chiều" },
    { id: "Business Thinking", label: "Business Mindset", description: "Chiến lược, ROI, thực thi" }
  ];

  const hanoiLibraryImg = "https://storage.googleapis.com/test-media-bucket-v1/cl_images/0195a67c-f179-7988-918d-63953686866a/1.png";

  return (
    <div className={cn(
      "relative min-h-screen overflow-x-hidden pb-20 transition-colors duration-700",
      playerTheme === 'light' ? "bg-[#f8f9fa]" : "bg-[#020617]"
    )}>
      {playerTheme !== 'light' && <StarBackground />}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md"
          >
            <div className={cn(
              "p-4 border flex items-center justify-between gap-4 shadow-2xl transition-all rounded-2xl",
              playerTheme === 'light' ? "bg-white border-black/10 shadow-black/10" : "glass-ui border-red-500/30 bg-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <p className={cn(
                  "text-sm font-bold transition-colors",
                  playerTheme === 'light' ? "text-black" : "text-white/90"
                )}>{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  playerTheme === 'light' ? "hover:bg-black/30 text-black/40" : "hover:bg-white/30 text-white/40"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden Spotlights for cleaner Dark Luxury look */}

      <div className="container main-content relative z-10">
        <div className="center-card" style={{ backgroundImage: `url(${hanoiLibraryImg})` }}>
          <div className="overlay-text">
            TRUNG TÂM VĂN HÓA<br />
            VÀ THƯ VIỆN HÀ NỘI
            {analysis && <div className="mt-4 font-bold text-lg">{analysis.title}</div>}
            {note && <div className="mt-2 text-sm font-light">{note}</div>}
          </div>
        </div>

        <header className="max-w-5xl mx-auto pt-16 pb-12 px-6 text-center relative z-10">
          <RunnerScene />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="hero"
          >
            <div className={cn(
              "top-badge transition-colors duration-500",
              playerTheme === 'light' ? "border-black/10 bg-black/30" : "border-white/10 bg-white/30"
            )} id="badge3d" ref={badgeRef}>
              <span className={cn("badge-top", playerTheme === 'light' ? "text-black/40" : "text-white/40")}>HANOI CULTURAL AND LIBRARY CENTER</span>
              <span className={cn("badge-sub", playerTheme === 'light' ? "text-black" : "text-white")}>AI BOOK SUMMARY PRO</span>
            </div>
            <h1 className={cn("hero-title transition-colors duration-500", playerTheme === 'light' ? "text-black" : "text-white")} ref={parallaxRef}>
                <span className="line1">
                  <span className="word">Đọc</span>
                  <span className="word">ít</span>
                  <span className="word">hơn,</span>
                </span><br />

                <span className="line2">
                  <span className="word">Hiểu</span>
                  <span className="word">nhiều</span>
                  <span className="word">hơn</span>
                </span>
            </h1>
            <p className={cn("hero-sub transition-colors duration-500", playerTheme === 'light' ? "text-black/60" : "text-white/60")}>
              Không cần đọc hết, nhưng phải hiểu hết.<br />
              <span className={cn("sub-highlight", playerTheme === 'light' ? "text-black" : "text-white")}>Làm ít thôi. AI lo phần còn lại.</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
            {smartModes.map((m) => (
              <motion.button
                key={m.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(m.id)}
                className={cn(
                  "mode-btn",
                  mode === m.id && "active",
                  playerTheme === 'light' && (mode === m.id ? "bg-black text-white" : "bg-black/5 text-black border-black/10")
                )}
              >
                {m.label}
              </motion.button>
            ))}
          </div>

          <div className="max-w-3xl mx-auto relative group">
            <div className="flex items-center gap-2 mb-3 px-2">
              <Zap className="w-4 h-4 text-accent-primary animate-pulse" />
              <span className={cn("text-xs font-bold uppercase tracking-[0.2em]", playerTheme === 'light' ? "text-black/40" : "text-accent-primary/80")}>Thanh Tóm Tắt Thông Minh</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
              <div className={cn(
                "flex-1 w-full search-box transition-all duration-500",
                playerTheme === 'light' ? "bg-black/30 border-black/10 shadow-xl shadow-black/5" : "bg-white/30 border-white/10"
              )}>
                <div className="flex-1 flex items-center w-full">
                  <Search className={cn("w-6 h-6 ml-4", playerTheme === 'light' ? "text-black/20" : "text-white/20")} />
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tên sách hoặc nội dung..."
                    className={cn(
                      "flex-1 bg-transparent px-4 py-4 text-lg focus:outline-none font-light",
                      playerTheme === 'light' ? "text-black placeholder:text-black/20" : "text-white placeholder:text-white/20"
                    )}
                  />
                  <input 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú..."
                    className={cn(
                      "flex-1 bg-transparent px-4 py-4 text-lg focus:outline-none font-light border-l border-white/10",
                      playerTheme === 'light' ? "text-black placeholder:text-black/20" : "text-white placeholder:text-white/20"
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "p-3 rounded-xl transition-colors",
                      imagePreview 
                        ? (playerTheme === 'light' ? "text-black bg-black/10" : "text-accent-primary bg-accent-primary/10") 
                        : (playerTheme === 'light' ? "text-black/40 hover:bg-black/5 hover:text-black" : "text-white/40 hover:bg-white/5 hover:text-accent-primary")
                    )}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsAudioConfigOpen(true)}
                    className={cn(
                      "p-3 rounded-xl transition-colors",
                      playerTheme === 'light' ? "text-black/40 hover:bg-black/5 hover:text-black" : "text-white/40 hover:bg-white/5 hover:text-accent-primary"
                    )}
                  >
                    <Volume2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProcess}
                    disabled={loading || (!input && !image)}
                    className={cn(
                      "btn-luxury whitespace-nowrap",
                      playerTheme === 'light' && "bg-black text-white shadow-xl shadow-black/20"
                    )}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Tóm tắt
                  </motion.button>
                </div>
              </div>

              {imagePreview && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 glass shadow-2xl group/preview flex-shrink-0"
                >
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover/preview:opacity-100 transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Loading Bar */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-8 space-y-4"
                >
                  <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="w-1/2 h-full bg-accent-primary shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
                    <p className={cn(
                      "text-xs font-bold tracking-[0.3em] uppercase animate-pulse",
                      playerTheme === 'light' ? "text-black/60" : "text-accent-primary/80"
                    )}>
                      {loadingText}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-6 space-y-16 relative z-10">
        {/* Results Section */}
        <AnimatePresence mode="wait">
          {loading && !analysis && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SkeletonLoader theme={playerTheme} />
            </motion.div>
          )}

          {analysis && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-16"
            >
              {/* HERO SECTION: Title & Introduction */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative p-12 md:p-20 rounded-[48px] border overflow-hidden group",
                  playerTheme === 'light' ? "bg-white border-black/10 text-black shadow-2xl shadow-black/5" : "bg-black border-white/10 text-white shadow-2xl shadow-white/5"
                )}
              >
                {/* Decorative background */}
                <div className={cn(
                  "absolute top-0 right-0 w-[600px] h-[600px] blur-[120px] rounded-full -mr-40 -mt-40 transition-opacity duration-1000",
                  playerTheme === 'light' ? "bg-black/5 opacity-50" : "bg-accent-primary/10 opacity-30"
                )} />
                
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border",
                      playerTheme === 'light' ? "bg-black text-white border-black" : "bg-accent-primary text-black border-accent-primary"
                    )}>
                      AI Analysis
                    </div>
                    <div className={cn(
                      "h-px flex-1",
                      playerTheme === 'light' ? "bg-black/10" : "bg-white/10"
                    )} />
                  </div>

                  <div className="space-y-6">
                    <h2 className={cn(
                      "text-5xl md:text-8xl font-display font-black tracking-tighter leading-[0.85] uppercase",
                      playerTheme === 'light' ? "text-black" : "text-white"
                    )}>
                      {analysis.title}
                    </h2>
                    <p className={cn(
                      "text-xl md:text-3xl font-serif italic leading-tight max-w-4xl",
                      playerTheme === 'light' ? "text-black/60" : "text-white/60"
                    )}>
                      {analysis.introduction}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4">
                    {analysis.insights.slice(0, 3).map((insight, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "px-6 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest flex items-center gap-3",
                          playerTheme === 'light' ? "bg-black/5 border-black/10 text-black/60" : "bg-white/5 border-white/10 text-white/60"
                        )}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* BENTO GRID: Summary, Key Ideas, Podcast */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Card 1: Summary (8 cols) */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    "md:col-span-8 p-10 space-y-8 rounded-[40px] border relative group/card overflow-hidden",
                    playerTheme === 'light' ? "bg-white border-black/10 text-black" : "bg-zinc-900 border-white/10 text-white"
                  )}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl",
                        playerTheme === 'light' ? "bg-black text-white" : "bg-accent-primary text-black"
                      )}>
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-bold uppercase tracking-widest">Tóm tắt</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-1">Nội dung cốt lõi</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "text-lg md:text-xl leading-relaxed font-medium max-h-[500px] overflow-y-auto custom-scrollbar pr-6 relative z-10",
                    playerTheme === 'light' ? "text-black/70" : "text-white/70"
                  )}>
                    <TypewriterText text={analysis.summary} theme={playerTheme} />
                  </div>
                </motion.div>

                {/* Card 2: Key Ideas (4 cols) */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "md:col-span-4 p-10 space-y-8 rounded-[40px] border relative group/card overflow-hidden",
                    playerTheme === 'light' ? "bg-black/5 border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                  )}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl",
                        playerTheme === 'light' ? "bg-black/10" : "bg-white/10"
                      )}>
                        <Search className={cn("w-7 h-7", playerTheme === 'light' ? "text-black" : "text-accent-primary")} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-bold uppercase tracking-widest">Ý chính</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-1">Key Insights</p>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-4 relative z-10">
                    {analysis.keyIdeas.map((idea, i) => (
                      <motion.li 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="group/item"
                      >
                        <div className="flex gap-4 items-start">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mt-2.5 shrink-0",
                            playerTheme === 'light' ? "bg-black" : "bg-accent-primary"
                          )} />
                          <span className={cn(
                            "text-sm font-bold leading-snug transition-colors",
                            playerTheme === 'light' ? "text-black/60 group-hover/item:text-black" : "text-white/50 group-hover/item:text-white"
                          )}>{idea}</span>
                        </div>
                        <div className={cn(
                          "h-px w-0 group-hover/item:w-full transition-all duration-500 mt-4",
                          playerTheme === 'light' ? "bg-black/10" : "bg-white/10"
                        )} />
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Card 3: Podcast Script (12 cols) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    "md:col-span-12 p-12 rounded-[48px] border relative group/card overflow-hidden",
                    playerTheme === 'light' ? "bg-white border-black/10 text-black" : "bg-black border-white/10 text-white"
                  )}
                >
                  <div className={cn(
                    "absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none",
                    playerTheme === 'light' ? "bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.1),transparent)]" : "bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.1),transparent)]"
                  )} />
                  
                  <div className="flex flex-col md:flex-row gap-12 relative z-10">
                    <div className="md:w-1/3 space-y-8">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl",
                          playerTheme === 'light' ? "bg-black text-white" : "bg-accent-primary text-black"
                        )}>
                          <Mic className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-display font-black uppercase tracking-tighter">Podcast Script</h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-1">Kịch bản lồng tiếng</p>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "p-6 rounded-3xl border space-y-4",
                        playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                      )}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Gợi ý giọng đọc</p>
                        <p className="text-sm font-serif italic leading-relaxed opacity-70">
                          "Hãy đọc với tông giọng trầm ấm, truyền cảm hứng. Nhấn mạnh vào những đoạn trích dẫn và các bài học thực tế."
                        </p>
                      </div>
                    </div>

                    <div className={cn(
                      "md:w-2/3 text-xl md:text-2xl font-serif italic leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar pr-10",
                      playerTheme === 'light' ? "text-black/70" : "text-white/60"
                    )}>
                      <div className="prose prose-invert max-w-none">
                        <Markdown>{analysis.podcastScript}</Markdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Podcast Loading State */}
              <AnimatePresence>
                {isPodcastLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl mx-auto mb-8"
                  >
                    <div className={cn(
                      "p-8 rounded-3xl border backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6",
                      playerTheme === 'light' ? "bg-black/30 border-black/10" : "bg-white/30 border-white/10"
                    )}>
                      <div className="relative">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className={cn(
                            "absolute inset-0 rounded-full blur-2xl",
                            playerTheme === 'light' ? "bg-black/20" : "bg-accent-primary/20"
                          )}
                        />
                        <div className={cn(
                          "relative p-6 rounded-full border",
                          playerTheme === 'light' ? "bg-black/10 border-black/20" : "bg-accent-primary/10 border-accent-primary/20"
                        )}>
                          <Mic className={cn(
                            "w-12 h-12 animate-pulse",
                            playerTheme === 'light' ? "text-black" : "text-accent-primary"
                          )} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className={cn(
                          "text-xl font-bold",
                          playerTheme === 'light' ? "text-black" : "text-white"
                        )}>Đang tạo Podcast...</h3>
                        <p className={cn(
                          "text-sm max-w-xs mx-auto",
                          playerTheme === 'light' ? "text-black/60" : "text-white/60"
                        )}>
                          AI đang chuyển đổi nội dung sách thành kịch bản và lồng tiếng chuyên nghiệp.
                        </p>
                      </div>
                      <div className={cn(
                        "w-64 h-1.5 rounded-full overflow-hidden",
                        playerTheme === 'light' ? "bg-black/10" : "bg-white/10"
                      )}>
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className={cn(
                            "w-1/2 h-full bg-gradient-to-r from-transparent to-transparent",
                            playerTheme === 'light' ? "via-black" : "via-accent-primary"
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex flex-col items-center gap-8">
                <div className="flex flex-wrap justify-center gap-6 items-center">
                  <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(audioDuration || 0)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max={audioDuration || 0} 
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        className={cn(
                          "w-full h-1.5 rounded-full appearance-none cursor-pointer transition-all",
                          playerTheme === 'dark' && "bg-white/10 accent-accent-primary",
                          playerTheme === 'light' && "bg-black/10 accent-black",
                          playerTheme === 'accent-focused' && "bg-accent-primary/20 accent-accent-primary"
                        )}
                      />
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 items-center w-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4">
                          <motion.button 
                            whileHover={playerTheme === 'dark' ? { scale: 1.05, boxShadow: "0 0 40px rgba(245,158,11,0.4)" } : 
                                        playerTheme === 'light' ? { scale: 1.05, boxShadow: "0 0 40px rgba(0,0,0,0.1)" } :
                                        { scale: 1.05, boxShadow: "0 0 60px rgba(56,189,248,0.6)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleAudio(audioUrl)}
                            className={cn(
                              "px-14 py-6 rounded-2xl flex items-center gap-4 font-black text-xl transition-all shadow-2xl",
                              playerTheme === 'dark' && "bg-accent-primary text-black shadow-accent-primary/20",
                              playerTheme === 'light' && "bg-black text-white shadow-black/20",
                              playerTheme === 'accent-focused' && "bg-neon-blue text-black shadow-[0_0_30px_rgba(56,189,248,0.5)] border-none"
                            )}
                          >
                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                            Nghe Podcast
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => downloadAudio(audioUrl, analysis?.title || 'Podcast')}
                            className={cn(
                              "p-6 rounded-2xl transition-all shadow-xl",
                              playerTheme === 'dark' && "bg-white/5 border border-white/10 text-accent-primary hover:bg-white/10",
                              playerTheme === 'light' && "bg-black/5 border border-black/10 text-black hover:bg-black/10",
                              playerTheme === 'accent-focused' && "bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20"
                            )}
                            title="Tải xuống podcast"
                          >
                            <Download className="w-7 h-7" />
                          </motion.button>
                        </div>
                        
                        {/* Theme Selector */}
                        <div className={cn(
                          "flex items-center gap-2 p-1 border rounded-xl transition-colors",
                          playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                        )}>
                          {(['dark', 'light', 'accent-focused'] as PlayerTheme[]).map((t) => (
                            <button
                              key={t}
                              onClick={() => setPlayerTheme(t)}
                              className={cn(
                                "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                playerTheme === t 
                                  ? (playerTheme === 'light' ? "bg-black text-white" : "bg-accent-primary text-black") 
                                  : (playerTheme === 'light' ? "text-black/30 hover:text-black/60" : "text-white/30 hover:text-white/60")
                              )}
                            >
                              {t.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Volume Control */}
                      <div className="flex flex-col items-center gap-3">
                        <div className={cn(
                          "p-4 rounded-2xl border flex items-center gap-4 transition-all",
                          playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                        )}>
                          <Volume2 className={cn("w-5 h-5", playerTheme === 'light' ? "text-black/40" : "text-white/40")} />
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className={cn(
                              "w-32 h-1 rounded-full appearance-none cursor-pointer",
                              playerTheme === 'dark' && "bg-white/10 accent-accent-primary",
                              playerTheme === 'light' && "bg-black/10 accent-black",
                              playerTheme === 'accent-focused' && "bg-neon-blue/20 accent-neon-blue"
                            )}
                          />
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", playerTheme === 'light' ? "text-black/20" : "text-white/20")}>Âm lượng</span>
                      </div>
                    </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    {[
                      { icon: Volume2, label: "Tùy chỉnh", onClick: () => setIsAudioConfigOpen(true) },
                      { icon: Mic, label: "Full Studio", onClick: openFullStudio },
                      { icon: FileDown, label: "Xuất PDF" },
                      { icon: Video, label: "TikTok" },
                      { icon: Share2, label: "Chia sẻ" }
                    ].map((btn, i) => (
                      <motion.button 
                        key={i}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={btn.onClick}
                        className="px-6 py-4 glass-ui flex items-center gap-3 font-bold text-sm border-white/5"
                      >
                        <btn.icon className="w-4 h-4 text-accent-primary" /> {btn.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

              {/* AI Deep Analysis Modes Section */}
              <section className="space-y-12 pt-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                      playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                    )}>
                      <Zap className={cn("w-6 h-6", playerTheme === 'light' ? "text-black" : "text-accent-primary")} />
                    </div>
                    <div>
                      <h2 className={cn(
                        "text-2xl font-display font-bold uppercase tracking-[0.3em]",
                        playerTheme === 'light' ? "text-black" : "text-white/80"
                      )}>
                        AI DEEP ANALYSIS MODES
                      </h2>
                      <p className={cn(
                        "text-xs font-bold uppercase tracking-widest mt-1",
                        playerTheme === 'light' ? "text-black/40" : "text-white/30"
                      )}>Phân tích chuyên sâu đa chiều</p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex p-1 border rounded-xl self-start transition-colors",
                    playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                  )}>
                    {(["Concise", "Deep"] as AnalysisStyle[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => onStyleChange(s)}
                        className={cn(
                          "px-6 py-2 text-xs font-bold rounded-lg transition-all",
                          analysisStyle === s 
                            ? (playerTheme === 'light' ? "bg-black text-white shadow-lg" : "bg-accent-primary text-black shadow-lg")
                            : (playerTheme === 'light' ? "text-black/30 hover:text-black/50" : "text-white/30 hover:text-white/50")
                        )}
                      >
                        {s === "Concise" ? "Ngắn gọn" : "Chuyên sâu"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {deepModes.map((m) => (
                    <motion.button
                      key={m.id}
                      whileHover={{ scale: 1.02, y: -4, backgroundColor: "rgba(255,255,255,0.08)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onTabChange(m.id)}
                      className={cn(
                        "p-6 rounded-3xl border text-left transition-all duration-500 group relative overflow-hidden",
                        activeDeepMode === m.id 
                          ? (playerTheme === 'light' 
                              ? "bg-black/5 border-black shadow-[0_0_40px_rgba(0,0,0,0.05)]" 
                              : "bg-accent-primary/10 border-accent-primary shadow-[0_0_40px_rgba(245,158,11,0.15)]")
                          : (playerTheme === 'light' ? "bg-black/30 border-black/5 hover:border-black/20" : "bg-white/30 border-white/5 hover:border-white/20")
                      )}
                    >
                      {activeDeepMode === m.id && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 to-transparent pointer-events-none"
                        />
                      )}
                      <div className="flex items-center gap-4 mb-3 relative z-10">
                        <m.icon className={cn(
                          "w-7 h-7 transition-colors duration-500", 
                          activeDeepMode === m.id 
                            ? (playerTheme === 'light' ? "text-black" : "text-accent-primary") 
                            : (playerTheme === 'light' ? "text-black/20 group-hover:text-black/40" : "text-white/20 group-hover:text-white/40")
                        )} />
                        <span className={cn(
                          "font-black text-sm uppercase tracking-wider", 
                          activeDeepMode === m.id 
                            ? (playerTheme === 'light' ? "text-black" : "text-white") 
                            : (playerTheme === 'light' ? "text-black/40" : "text-white/40")
                        )}>{m.label}</span>
                      </div>
                      <p className={cn(
                        "text-[11px] leading-relaxed relative z-10 font-medium",
                        playerTheme === 'light' ? "text-black/30" : "text-white/30"
                      )}>{m.description}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="glass-ui p-8 md:p-12 min-h-[400px] relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    {deepLoading ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#0f172a]/40 backdrop-blur-sm z-20"
                      >
                        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="w-1/2 h-full bg-accent-primary shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                          />
                        </div>
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
                          <Sparkles className="w-6 h-6 text-accent-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <p className="text-accent-primary font-display font-bold uppercase tracking-[0.3em] text-xs animate-pulse">
                          AI đang suy luận...
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={activeDeepMode}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className={cn(
                          "flex items-center justify-between border-b pb-6 transition-colors",
                          playerTheme === 'light' ? "border-black/5" : "border-white/5"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              playerTheme === 'light' ? "bg-black/5" : "bg-accent-primary/20"
                            )}>
                              {deepModes.find(m => m.id === activeDeepMode)?.icon && React.createElement(deepModes.find(m => m.id === activeDeepMode)!.icon, { 
                                className: cn("w-5 h-5", playerTheme === 'light' ? "text-black" : "text-accent-primary") 
                              })}
                            </div>
                            <h3 className={cn(
                              "text-xl font-display font-bold transition-colors",
                              playerTheme === 'light' ? "text-black" : "text-white"
                            )}>{deepModes.find(m => m.id === activeDeepMode)?.label}</h3>
                          </div>
                          <div className="flex items-center gap-4">
                            {deepAudioUrls[activeDeepMode] ? (
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "text-[10px] font-mono px-2 py-1 rounded-md transition-colors",
                                  playerTheme === 'light' ? "text-black/40 bg-black/5" : "text-white/40 bg-white/5"
                                )}>
                                  ⏱️ {formatDuration(deepAudioDurations[activeDeepMode])}
                                </span>
                                <button 
                                  onClick={() => toggleAudio(deepAudioUrls[activeDeepMode]!, activeDeepMode)}
                                  className={cn(
                                    "px-6 py-2 rounded-xl flex items-center gap-3 font-bold text-xs transition-all",
                                    playerTheme === 'dark' && "bg-accent-primary/20 border border-accent-primary/30 text-accent-primary hover:bg-accent-primary/30",
                                    playerTheme === 'light' && "bg-black text-white border border-black/10 hover:bg-black/5",
                                    playerTheme === 'accent-focused' && "bg-neon-blue/20 border-2 border-neon-blue text-neon-blue hover:bg-neon-blue/30"
                                  )}
                                >
                                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                  Nghe Podcast
                                </button>
                                <button 
                                  onClick={() => downloadAudio(deepAudioUrls[activeDeepMode]!, `Podcast_${activeDeepMode}`)}
                                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-accent-primary"
                                  title="Tải về"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleGenerateModeAudio(activeDeepMode)}
                                className="px-6 py-2 bg-white/30 border border-white/10 text-white/60 rounded-xl flex items-center gap-3 font-bold text-xs hover:bg-white/10 hover:text-white transition-all"
                              >
                                <Volume2 className="w-4 h-4" />
                                Tạo bản podcast
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeepAnalysis(activeDeepMode, analysisStyle)}
                              className="p-3 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-accent-primary"
                              title="Làm mới"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => copyToClipboard(deepAnalysisResults[activeDeepMode] || "", "deep")}
                              className="p-3 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-accent-primary"
                            >
                              {copied === "deep" ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className={cn(
                          "prose max-w-none prose-p:leading-relaxed prose-strong:text-accent-primary",
                          playerTheme === 'light' ? "prose-p:text-black/70" : "prose-invert prose-p:text-white/70"
                        )}>
                          {deepAnalysisResults[activeDeepMode] ? (
                            <TypewriterText text={deepAnalysisResults[activeDeepMode]!} theme={playerTheme} />
                          ) : (
                            <p className={cn(
                              "italic",
                              playerTheme === 'light' ? "text-black/20" : "text-white/20"
                            )}>Vui lòng chọn một chế độ để bắt đầu phân tích...</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Facebook Post Generator Section */}
              <section className="space-y-12 pt-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-colors",
                      playerTheme === 'light' ? "bg-blue-600/10 border-blue-600/20 shadow-blue-600/5" : "bg-blue-600/20 border-blue-600/30 shadow-blue-600/10"
                    )}>
                      <Facebook className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h2 className={cn(
                        "text-2xl font-display font-bold uppercase tracking-[0.3em]",
                        playerTheme === 'light' ? "text-black" : "text-white/80"
                      )}>
                        FACEBOOK POST GENERATOR
                      </h2>
                      <p className={cn(
                        "text-xs font-bold uppercase tracking-widest mt-1",
                        playerTheme === 'light' ? "text-black/40" : "text-white/30"
                      )}>Viết bài chuẩn Quản trị viên</p>
                    </div>
                  </div>

                  {/* Style Selector */}
                  <div className={cn(
                    "flex p-1 border rounded-xl self-start transition-colors",
                    playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                  )}>
                    {(["Storytelling", "Professional", "Hook-based", "Short & Sweet"] as FacebookPostStyle[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFacebookPostStyle(s)}
                        className={cn(
                          "px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider",
                          facebookPostStyle === s 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                            : (playerTheme === 'light' ? "text-black/30 hover:text-black/50" : "text-white/30 hover:text-white/50")
                        )}
                      >
                        {s === "Short & Sweet" ? "Ngắn gọn" : s === "Hook-based" ? "Hook" : s === "Storytelling" ? "Kể chuyện" : "Chuyên nghiệp"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={cn(
                  "p-8 md:p-12 min-h-[300px] relative overflow-hidden border rounded-[2.5rem] transition-all",
                  playerTheme === 'light' ? "bg-black/5 border-black/10 text-black" : "glass-ui border-blue-600/10 text-white"
                )}>
                  <AnimatePresence mode="wait">
                    {facebookLoading ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "absolute inset-0 flex flex-col items-center justify-center gap-6 backdrop-blur-sm z-20",
                          playerTheme === 'light' ? "bg-white/40" : "bg-blue-900/10"
                        )}
                      >
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          <Facebook className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <p className="text-blue-400 font-display font-bold uppercase tracking-[0.3em] text-xs animate-pulse">
                          Admin đang soạn thảo...
                        </p>
                      </motion.div>
                    ) : facebookPost ? (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        <div className={cn(
                          "flex items-center justify-between border-b pb-6",
                          playerTheme === 'light' ? "border-black/5" : "border-white/5"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                              AD
                            </div>
                            <div>
                              <h3 className={cn("text-sm font-black", playerTheme === 'light' ? "text-black" : "text-white")}>Admin Page</h3>
                              <p className={cn("text-[10px] uppercase tracking-widest", playerTheme === 'light' ? "text-black/30" : "text-white/30")}>Vừa xong • Công khai</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={handleGenerateFacebookPost}
                              className={cn(
                                "p-3 rounded-xl transition-colors",
                                playerTheme === 'light' ? "hover:bg-black/5 text-black/40 hover:text-blue-600" : "hover:bg-white/5 text-white/40 hover:text-blue-400"
                              )}
                              title="Viết lại"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => copyToClipboard(facebookPost, "fb")}
                              className={cn(
                                "px-6 py-2 border rounded-xl flex items-center gap-3 font-bold text-xs transition-all",
                                playerTheme === 'light' ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700" : "bg-blue-600/20 border-blue-600/30 text-blue-400 hover:bg-blue-600/30"
                              )}
                            >
                              {copied === "fb" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              Sao chép bài viết
                            </button>
                          </div>
                        </div>

                        <div className={cn(
                          "whitespace-pre-wrap leading-relaxed font-medium text-sm md:text-base selection:bg-blue-500/30",
                          playerTheme === 'light' ? "text-black/80" : "text-white/80"
                        )}>
                          {facebookPost}
                        </div>
                        
                        <div className={cn(
                          "pt-6 border-t flex items-center gap-6",
                          playerTheme === 'light' ? "border-black/5 text-black/20" : "border-white/5 text-white/20"
                        )}>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" />
                            </div>
                            Chuẩn SEO Facebook
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            Tối ưu tương tác
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                        <div className={cn(
                          "w-20 h-20 rounded-3xl flex items-center justify-center border transition-colors",
                          playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-blue-600/10 border-blue-600/20"
                        )}>
                          <Facebook className={cn("w-10 h-10", playerTheme === 'light' ? "text-black/10" : "text-blue-500/40")} />
                        </div>
                        <div>
                          <p className={cn("text-lg font-display font-medium mb-2", playerTheme === 'light' ? "text-black/40" : "text-white/40")}>Sẵn sàng viết bài đăng Facebook</p>
                          <p className={cn("text-sm max-w-md mx-auto", playerTheme === 'light' ? "text-black/20" : "text-white/20")}>Chọn phong cách và nhấn nút bên dưới để AI tạo bài giới thiệu sách chuyên nghiệp chuẩn Admin Fanpage.</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: playerTheme === 'light' ? "0 0 30px rgba(0,0,0,0.1)" : "0 0 30px rgba(37,99,235,0.2)" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGenerateFacebookPost}
                          className={cn(
                            "px-10 py-4 rounded-2xl flex items-center gap-3 font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all",
                            playerTheme === 'light' ? "bg-black text-white shadow-black/20" : "bg-blue-600 text-white shadow-blue-600/20"
                          )}
                        >
                          <Sparkles className="w-5 h-5" />
                          Tạo bài đăng Facebook
                        </motion.button>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Podcast Cover Generation Section */}
              <section className="space-y-12 pt-12">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                    playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                  )}>
                    <ImageIcon className={cn("w-6 h-6", playerTheme === 'light' ? "text-black" : "text-accent-primary")} />
                  </div>
                  <h2 className={cn(
                    "text-2xl font-display font-bold uppercase tracking-[0.3em]",
                    playerTheme === 'light' ? "text-black" : "text-white/80"
                  )}>
                    PODCAST COVER GENERATION
                  </h2>
                  <div className={cn("flex-1 h-px", playerTheme === 'light' ? "bg-gradient-to-r from-black/10 to-transparent" : "bg-gradient-to-r from-white/10 to-transparent")} />
                  {analysis && covers.length === 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: playerTheme === 'light' ? "0 0 30px rgba(0,0,0,0.1)" : "0 0 30px rgba(245,158,11,0.2)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerateCovers}
                      disabled={isGeneratingCovers}
                      className={cn(
                        "px-8 py-3 border rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] disabled:opacity-50 transition-all",
                        playerTheme === 'light' ? "bg-black/30 border-black/10 hover:bg-black/10 text-black" : "bg-white/30 border-white/10 hover:bg-white/10 text-white"
                      )}
                    >
                      {isGeneratingCovers ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles className={cn("w-4 h-4", playerTheme === 'light' ? "text-black" : "text-accent-primary")} /> Tạo bìa Podcast
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {covers.length > 0 ? covers.map((url, i) => (
                    <div key={i} className="space-y-4">
                      <motion.div 
                        whileHover={{ scale: 1.05, y: -10, rotate: i % 2 === 0 ? 2 : -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl border group transition-all duration-300",
                          activeCoverIndex === i 
                            ? (playerTheme === 'light' ? "ring-4 ring-black border-black" : "ring-4 ring-accent-primary border-accent-primary")
                            : (playerTheme === 'light' ? "border-black/10" : "border-white/10")
                        )}
                        onClick={() => setActiveCoverIndex(i)}
                      >
                        <img src={url} alt={`Cover ${i}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                        
                        {/* Selected Indicator */}
                        {activeCoverIndex === i && (
                          <div className={cn(
                            "absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-10",
                            playerTheme === 'light' ? "bg-black text-white" : "bg-accent-primary text-black"
                          )}>
                            <Check className="w-5 h-5" />
                          </div>
                        )}

                        <div className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm",
                          playerTheme === 'light' ? "bg-white/60" : "bg-black/60"
                        )}>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCover(url);
                              }}
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                                playerTheme === 'light' ? "bg-black/10 border-black/20 hover:bg-black/20" : "bg-white/10 border-white/20 hover:bg-white/20"
                              )}
                            >
                              <Maximize2 className={cn("w-5 h-5", playerTheme === 'light' ? "text-black" : "text-white")} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadCover(url, i);
                              }}
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                                playerTheme === 'light' ? "bg-black/10 border-black/20 hover:bg-black/20" : "bg-white/10 border-white/20 hover:bg-white/20"
                              )}
                            >
                              <Download className={cn("w-5 h-5", playerTheme === 'light' ? "text-black" : "text-white")} />
                            </motion.button>
                          </div>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            playerTheme === 'light' ? "text-black" : "text-white"
                          )}>
                            {activeCoverIndex === i ? "Đã chọn" : "Chọn bìa này"}
                          </span>
                        </div>
                      </motion.div>
                      <div className="flex flex-col items-center gap-2">
                        <p className={cn(
                          "text-[10px] uppercase tracking-[0.3em] text-center font-black",
                          playerTheme === 'light' ? "text-black/30" : "text-white/30"
                        )}>
                          {i + 1}. {i === 0 ? "Minimal Clean" : i === 1 ? "Dark Cinematic" : i === 2 ? "Bold Modern" : "Artistic Abstract"}
                        </p>
                        {activeCoverIndex === i && (
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleDownloadCover(url, i)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                              playerTheme === 'light' ? "bg-black text-white" : "bg-accent-primary text-black"
                            )}
                          >
                            <Download className="w-3.5 h-3.5" /> Tải xuống
                          </motion.button>
                        )}
                      </div>
                    </div>
                  )) : isGeneratingCovers ? (
                    <>
                      <div className="col-span-full w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                        <motion.div 
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="w-1/2 h-full bg-accent-primary shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                        />
                      </div>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={cn(
                          "aspect-square rounded-[2rem] animate-pulse border flex items-center justify-center",
                          playerTheme === 'light' ? "bg-black/30 border-black/5" : "bg-white/30 border-white/5"
                        )}>
                          <Loader2 className={cn("w-8 h-8 animate-spin", playerTheme === 'light' ? "text-black/10" : "text-white/10")} />
                        </div>
                      ))}
                    </>
                  ) : (
                    <motion.div 
                      whileHover={{ 
                        borderColor: playerTheme === 'light' ? "rgba(0,0,0,0.2)" : "rgba(245,158,11,0.2)", 
                        backgroundColor: playerTheme === 'light' ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" 
                      }}
                      className={cn(
                        "col-span-full py-20 flex flex-col items-center justify-center rounded-[2.5rem] border-dashed border-2 transition-all",
                        playerTheme === 'light' ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5"
                      )}
                    >
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mb-6 border",
                        playerTheme === 'light' ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5"
                      )}>
                        <ImageIcon className={cn("w-10 h-10", playerTheme === 'light' ? "text-black/10" : "text-white/10")} />
                      </div>
                      <p className={cn("text-lg font-display font-medium mb-2", playerTheme === 'light' ? "text-black/40" : "text-white/40")}>Chưa có ảnh bìa Podcast</p>
                      <p className={cn("text-sm max-w-md text-center", playerTheme === 'light' ? "text-black/20" : "text-white/20")}>Nhấn nút "Tạo bìa Podcast" để AI thiết kế 4 phong cách nghệ thuật độc bản cho chương trình của bạn.</p>
                    </motion.div>
                  )}
                </div>
              </section>

              {/* AI Discussion Chat Section */}
              <section className="space-y-12 pt-24">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                    playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                  )}>
                    <MessageSquare className={cn("w-6 h-6", playerTheme === 'light' ? "text-black" : "text-accent-primary")} />
                  </div>
                  <div>
                    <h2 className={cn(
                      "text-2xl font-display font-bold uppercase tracking-[0.3em] transition-colors",
                      playerTheme === 'light' ? "text-black" : "text-white/80"
                    )}>
                      THẢO LUẬN AI (SMART CHAT)
                    </h2>
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-widest mt-1 transition-colors",
                      playerTheme === 'light' ? "text-black/40" : "text-white/30"
                    )}>Hỏi đáp và đào sâu kiến thức cùng AI</p>
                  </div>
                </div>

                <div className={cn(
                  "p-8 md:p-12 min-h-[500px] flex flex-col gap-8 rounded-[2.5rem] border transition-all",
                  playerTheme === 'light' ? "bg-black/30 border-black/10 text-black" : "glass-ui border-white/10 text-white"
                )}>
                  <div className="flex-1 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                    {chatHistory.length === 0 ? (
                      <div className={cn(
                        "h-full flex flex-col items-center justify-center text-center space-y-4",
                        playerTheme === 'light' ? "opacity-20" : "opacity-30"
                      )}>
                        <MessageSquare className="w-16 h-16" />
                        <p className="text-sm font-medium">Bắt đầu cuộc trò chuyện về cuốn sách này...</p>
                      </div>
                    ) : (
                      chatHistory.map((msg, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "chat-msg",
                            msg.role === "user" ? "user" : "bot",
                            playerTheme === 'light' && (msg.role === "user" ? "bg-black text-white" : "bg-black/5 text-black border-black/10")
                          )}
                        >
                          <Markdown>{msg.parts[0].text}</Markdown>
                        </motion.div>
                      ))
                    )}
                    {isChatLoading && (
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          playerTheme === 'light' ? "bg-black/10" : "bg-white/10"
                        )}>
                          <Loader2 className={cn("w-5 h-5 animate-spin", playerTheme === 'light' ? "text-black/40" : "text-white/40")} />
                        </div>
                        <div className={cn(
                          "p-6 rounded-2xl border",
                          playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/[0.03] border-white/5"
                        )}>
                          <div className="flex gap-2">
                            <div className={cn("w-2 h-2 rounded-full animate-bounce", playerTheme === 'light' ? "bg-black/20" : "bg-white/20")} />
                            <div className={cn("w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s]", playerTheme === 'light' ? "bg-black/20" : "bg-white/20")} />
                            <div className={cn("w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s]", playerTheme === 'light' ? "bg-black/20" : "bg-white/20")} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Đặt câu hỏi về nội dung sách..."
                      className={cn(
                        "w-full rounded-2xl px-8 py-6 text-sm focus:ring-2 transition-all pr-24",
                        playerTheme === 'light' 
                          ? "bg-black/5 border border-black/10 text-black focus:ring-black/30 focus:border-black/30" 
                          : "bg-white/[0.03] border border-white/10 text-white focus:ring-accent-primary/30 focus:border-accent-primary/30"
                      )}
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={isChatLoading || !chatInput.trim()}
                      className={cn(
                        "absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50",
                        playerTheme === 'light' ? "bg-black text-white" : "bg-accent-primary text-black"
                      )}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <p className={cn(
                    "text-[10px] text-center uppercase tracking-widest font-black",
                    playerTheme === 'light' ? "text-black/20" : "text-white/20"
                  )}>
                    AI sẽ tự động tạo bản tin âm thanh cho mỗi câu trả lời
                  </p>
                </div>
              </section>

              <audio 
                ref={audioRef} 
                onEnded={() => {
                  setIsPlaying(false);
                  if (musicRef.current) musicRef.current.pause();
                }} 
                className="hidden" 
              />
              <audio 
                ref={musicRef} 
                src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808d304b3.mp3" 
                loop 
                className="hidden" 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedCover && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
            onClick={() => setSelectedCover(null)}
          >
            <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
              <X className="w-10 h-10" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selectedCover} 
              className="max-w-full max-h-full rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10" 
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Overview Config Modal */}
      <AnimatePresence>
        {isAudioConfigOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsAudioConfigOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-2xl p-8 md:p-12 space-y-10 overflow-y-auto max-h-[90vh] custom-scrollbar border shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-3xl transition-colors duration-500",
                playerTheme === 'light' ? "bg-white border-black/10 text-black" : "glass-ui border-white/20 text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-xl transition-colors",
                    playerTheme === 'light' ? "bg-black/5 shadow-black/5" : "bg-accent-primary/20 shadow-accent-primary/10"
                  )}>
                    <Volume2 className={cn("w-7 h-7", playerTheme === 'light' ? "text-black" : "text-accent-primary")} />
                  </div>
                  <div>
                    <h2 className={cn("text-3xl font-display font-black tracking-tight", playerTheme === 'light' ? "text-black" : "text-white")}>Tùy chỉnh Podcast</h2>
                    <p className={cn("text-sm font-medium", playerTheme === 'light' ? "text-black/40" : "text-white/40")}>Cấu hình cách AI tạo nội dung âm thanh</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsAudioConfigOpen(false)}
                  className={cn(
                    "p-3 rounded-2xl transition-colors",
                    playerTheme === 'light' ? "hover:bg-black/5 text-black/20 hover:text-black" : "hover:bg-white/5 text-white/40"
                  )}
                >
                  <X className="w-7 h-7" />
                </motion.button>
              </div>

              {/* SECTION 1: MODE SELECTION */}
              <div className="space-y-6">
                <h3 className={cn(
                  "text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4",
                  playerTheme === 'light' ? "text-black/40" : "text-accent-primary"
                )}>
                  <span className={cn("w-10 h-px", playerTheme === 'light' ? "bg-black/10" : "bg-accent-primary/20")} />
                  CHẾ ĐỘ PHÂN TÍCH
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {deepModes.map((m) => (
                    <motion.button
                      key={m.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAudioConfig(prev => ({ ...prev, mode: m.id }))}
                      className={cn(
                        "p-6 rounded-3xl border text-left transition-all duration-500 group relative overflow-hidden",
                        audioConfig.mode === m.id 
                          ? (playerTheme === 'light' ? "bg-black/5 border-black shadow-[0_0_40px_rgba(0,0,0,0.05)]" : "bg-accent-primary/10 border-accent-primary/30 shadow-[0_0_40px_rgba(245,158,11,0.2)]") 
                          : (playerTheme === 'light' ? "bg-black/5 border-black/5 hover:border-black/20 hover:bg-black/10" : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10")
                      )}
                    >
                      <div className="flex items-start gap-5 relative z-10">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                          audioConfig.mode === m.id 
                            ? (playerTheme === 'light' ? "bg-black text-white scale-110 shadow-black/20" : "bg-accent-primary text-black scale-110 shadow-accent-primary/20") 
                            : (playerTheme === 'light' ? "bg-black/5 text-black/20 group-hover:text-black/40" : "bg-white/5 text-white/40 group-hover:text-white/60")
                        )}>
                          <m.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-black text-lg mb-1 transition-colors uppercase tracking-tight",
                            audioConfig.mode === m.id 
                              ? (playerTheme === 'light' ? "text-black" : "text-white") 
                              : (playerTheme === 'light' ? "text-black/40 group-hover:text-black/60" : "text-white/60 group-hover:text-white/80")
                          )}>{m.label}</h4>
                          <p className={cn(
                            "text-[11px] leading-relaxed transition-colors font-medium",
                            playerTheme === 'light' ? "text-black/30 group-hover:text-black/50" : "text-white/30 group-hover:text-white/50"
                          )}>
                            {m.description}
                          </p>
                        </div>
                      </div>
                      {audioConfig.mode === m.id && (
                        <motion.div 
                          layoutId="active-glow-modal"
                          className={cn(
                            "absolute inset-0 pointer-events-none",
                            playerTheme === 'light' ? "bg-gradient-to-br from-black/5 to-transparent" : "bg-gradient-to-br from-accent-primary/10 to-transparent"
                          )}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* SECTION 2: LANGUAGE */}
                <div className="space-y-4">
                  <h3 className={cn(
                    "text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3",
                    playerTheme === 'light' ? "text-black/20" : "text-white/20"
                  )}>
                    <span className={cn("w-8 h-px", playerTheme === 'light' ? "bg-black/5" : "bg-white/5")} />
                    NGÔN NGỮ
                  </h3>
                  <div className="relative group">
                    <select 
                      value={audioConfig.language}
                      onChange={(e) => setAudioConfig(prev => ({ ...prev, language: e.target.value as AudioOverviewLanguage }))}
                      className={cn(
                        "w-full border rounded-2xl px-6 py-5 focus:ring-2 appearance-none transition-all cursor-pointer font-bold text-sm",
                        playerTheme === 'light' 
                          ? "bg-black/5 border-black/10 text-black focus:ring-black/30 focus:border-black/30 hover:bg-black/10" 
                          : "bg-white/[0.03] border-white/10 text-white focus:ring-accent-primary/30 focus:border-accent-primary/30 hover:bg-white/[0.05] hover:border-white/20"
                      )}
                    >
                      <option value="Tiếng Việt" className={playerTheme === 'light' ? "bg-white" : "bg-zinc-900"}>Tiếng Việt (Mặc định)</option>
                      <option value="English" className={playerTheme === 'light' ? "bg-white" : "bg-zinc-900"}>English (Quốc tế)</option>
                    </select>
                    <div className={cn(
                      "absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
                      playerTheme === 'light' ? "text-black/20 group-hover:text-black/40" : "text-white/20 group-hover:text-white/40"
                    )}>
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: LENGTH */}
                <div className="space-y-4">
                  <h3 className={cn(
                    "text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3",
                    playerTheme === 'light' ? "text-black/20" : "text-white/20"
                  )}>
                    <span className={cn("w-8 h-px", playerTheme === 'light' ? "bg-black/5" : "bg-white/5")} />
                    ĐỘ DÀI BẢN TIN
                  </h3>
                  <div className={cn(
                    "flex p-1.5 border rounded-2xl",
                    playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/[0.03] border-white/10"
                  )}>
                    {(["Short", "Default", "Long"] as AudioOverviewLength[]).map((l) => (
                      <motion.button
                        key={l}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAudioConfig(prev => ({ ...prev, length: l }))}
                        className={cn(
                          "flex-1 py-4 text-[11px] font-black rounded-xl transition-all duration-500 uppercase tracking-wider",
                          audioConfig.length === l 
                            ? (playerTheme === 'light' ? "bg-black text-white shadow-lg shadow-black/20" : "bg-accent-primary text-black shadow-lg shadow-accent-primary/20") 
                            : (playerTheme === 'light' ? "text-black/30 hover:text-black/60 hover:bg-black/5" : "text-white/30 hover:text-white/60 hover:bg-white/5")
                        )}
                      >
                        {l === "Short" ? "NGẮN" : l === "Long" ? "DÀI" : "MẶC ĐỊNH"}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* NEW SECTION: VOICE SELECTION */}
                <div className="space-y-4">
                  <h3 className={cn(
                    "text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3",
                    playerTheme === 'light' ? "text-black/20" : "text-white/20"
                  )}>
                    <span className={cn("w-8 h-px", playerTheme === 'light' ? "bg-black/5" : "bg-white/5")} />
                    CHỌN GIỌNG
                  </h3>
                  <div className={cn(
                    "flex p-1.5 border rounded-2xl",
                    playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/[0.03] border-white/10"
                  )}>
                    {(["Nam", "Nữ", "Podcast host"] as VoiceType[]).map((v) => (
                      <motion.button
                        key={v}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAudioConfig(prev => ({ ...prev, voiceType: v }))}
                        className={cn(
                          "flex-1 py-4 text-[11px] font-black rounded-xl transition-all duration-500 uppercase tracking-wider",
                          audioConfig.voiceType === v 
                            ? (playerTheme === 'light' ? "bg-black text-white shadow-lg shadow-black/20" : "bg-accent-primary text-black shadow-lg shadow-accent-primary/20") 
                            : (playerTheme === 'light' ? "text-black/30 hover:text-black/60 hover:bg-black/5" : "text-white/30 hover:text-white/60 hover:bg-white/5")
                        )}
                      >
                        {v === "Podcast host" ? "HOST" : v.toUpperCase()}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* NEW SECTION: BACKGROUND MUSIC */}
                <div className="space-y-4">
                  <h3 className={cn(
                    "text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3",
                    playerTheme === 'light' ? "text-black/20" : "text-white/20"
                  )}>
                    <span className={cn("w-8 h-px", playerTheme === 'light' ? "bg-black/5" : "bg-white/5")} />
                    NHẠC NỀN
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setAudioConfig(prev => ({ ...prev, hasBackgroundMusic: !prev.hasBackgroundMusic }))}
                    className={cn(
                      "w-full p-5 rounded-2xl border transition-all duration-500 flex items-center justify-between group overflow-hidden relative",
                      audioConfig.hasBackgroundMusic 
                        ? (playerTheme === 'light' ? "bg-black/5 border-black/30 text-black" : "bg-accent-primary/10 border-accent-primary/30 text-white") 
                        : (playerTheme === 'light' ? "bg-black/5 border-black/10 text-black/30 hover:border-black/20" : "bg-white/[0.03] border-white/10 text-white/30 hover:border-white/20")
                    )}
                  >
                    <span className="text-sm font-black uppercase tracking-tight">Bật nhạc nền nhẹ</span>
                    <div className={cn(
                      "w-12 h-6 rounded-full relative transition-colors duration-500",
                      audioConfig.hasBackgroundMusic 
                        ? (playerTheme === 'light' ? "bg-black" : "bg-accent-primary") 
                        : (playerTheme === 'light' ? "bg-black/10" : "bg-white/10")
                    )}>
                      <motion.div 
                        animate={{ x: audioConfig.hasBackgroundMusic ? 26 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </div>
                    {audioConfig.hasBackgroundMusic && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          "absolute inset-0 pointer-events-none",
                          playerTheme === 'light' ? "bg-gradient-to-r from-black/5 to-transparent" : "bg-gradient-to-r from-accent-primary/5 to-transparent"
                        )}
                      />
                    )}
                  </motion.button>

                  {audioConfig.hasBackgroundMusic && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-2"
                    >
                      <h3 className={cn(
                        "text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3",
                        playerTheme === 'light' ? "text-black/20" : "text-white/20"
                      )}>
                        <span className={cn("w-8 h-px", playerTheme === 'light' ? "bg-black/5" : "bg-white/5")} />
                        CHỌN BẢN NHẠC
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {BACKGROUND_MUSIC_TRACKS.map((track) => (
                          <motion.button
                            key={track.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setAudioConfig(prev => ({ ...prev, backgroundMusicTrack: track.id }))}
                            className={cn(
                              "px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                              audioConfig.backgroundMusicTrack === track.id
                                ? (playerTheme === 'light' ? "bg-black text-white border-black" : "bg-accent-primary text-black border-accent-primary")
                                : (playerTheme === 'light' ? "bg-black/5 border-black/10 text-black/40 hover:bg-black/10" : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.05]")
                            )}
                          >
                            {track.name}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* SECTION 4: CUSTOM INSTRUCTION */}
              <div className="space-y-4">
                <h3 className={cn(
                  "text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3",
                  playerTheme === 'light' ? "text-black/20" : "text-white/20"
                )}>
                  <span className={cn("w-8 h-px", playerTheme === 'light' ? "bg-black/5" : "bg-white/5")} />
                  YÊU CẦU BỔ SUNG
                </h3>
                <div className="relative group">
                  <textarea 
                    value={audioConfig.customInstruction}
                    onChange={(e) => setAudioConfig(prev => ({ ...prev, customInstruction: e.target.value }))}
                    placeholder="Ví dụ: 'Hãy kể theo trình tự thời gian' hoặc 'Phân tích theo góc nhìn kinh doanh'..."
                    className={cn(
                      "w-full border rounded-2xl p-6 text-sm focus:ring-2 transition-all min-h-[140px] resize-none font-medium leading-relaxed",
                      playerTheme === 'light' 
                        ? "bg-black/5 border-black/10 text-black focus:ring-black/30 focus:border-black/30 placeholder:text-black/10" 
                        : "bg-white/[0.03] border-white/10 text-white/80 focus:ring-accent-primary/30 focus:border-accent-primary/30 placeholder:text-white/10"
                    )}
                  />
                  <div className={cn(
                    "absolute bottom-4 right-4 text-[10px] font-black uppercase tracking-widest pointer-events-none transition-colors",
                    playerTheme === 'light' ? "text-black/10 group-focus-within:text-black/30" : "text-white/10 group-focus-within:text-accent-primary/30"
                  )}>
                    Optional
                  </div>
                </div>
              </div>

              {/* SECTION 5: ACTION */}
              <div className="pt-6">
                <motion.button 
                  whileHover={{ scale: 1.02, translateY: -4 }}
                  whileTap={{ scale: 0.98, translateY: 0 }}
                  onClick={handleCreateCustomAudio}
                  disabled={loading || (!input && !image)}
                  className={cn(
                    "w-full h-20 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl transition-all duration-500 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none group relative overflow-hidden",
                    playerTheme === 'light' ? "bg-black text-white shadow-black/20 hover:shadow-black/40" : "bg-accent-primary text-black shadow-accent-primary/20 hover:shadow-accent-primary/40"
                  )}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer"
                  />
                  <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform duration-500" />
                  <span className="text-lg">Tạo bản tin âm thanh</span>
                </motion.button>
                <p className={cn(
                  "text-center text-[10px] mt-6 uppercase tracking-[0.3em] font-black",
                  playerTheme === 'light' ? "text-black/20" : "text-white/20"
                )}>
                  AI sẽ mất khoảng 30-60 giây để xử lý kịch bản và giọng nói
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className={cn(
        "max-w-5xl mx-auto py-12 px-6 border-t text-center text-xs font-display uppercase tracking-[0.3em] transition-colors",
        playerTheme === 'light' ? "border-black/5 text-black/20" : "border-white/5 text-white/20"
      )}>
        <p>© 2026 Hanoi Cultural and Library Center • AI Book Summary Pro</p>
      </footer>

      {/* Full Podcast Studio Modal */}
      <AnimatePresence>
        {isFullStudioOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setIsFullStudioOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className={cn(
                "relative w-full max-w-4xl p-8 md:p-12 space-y-8 overflow-y-auto max-h-[90vh] custom-scrollbar border shadow-[0_0_150px_rgba(0,0,0,0.9)] rounded-3xl transition-colors duration-500",
                playerTheme === 'light' ? "bg-white border-black/10 text-black" : "glass-ui border-white/20 text-white"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-colors",
                    playerTheme === 'light' ? "bg-black/5 shadow-black/5" : "bg-accent-primary/20 shadow-accent-primary/10"
                  )}>
                    <Mic className={cn("w-7 h-7", playerTheme === 'light' ? "text-black" : "text-accent-primary")} />
                  </div>
                  <div>
                    <h2 className={cn("text-3xl font-display font-black tracking-tight", playerTheme === 'light' ? "text-black" : "text-white")}>Full Podcast Studio</h2>
                    <p className={cn("text-sm font-medium", playerTheme === 'light' ? "text-black/40" : "text-white/40")}>Biên tập và tạo bản Podcast hoàn chỉnh từ các mục phân tích</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFullStudioOpen(false)}
                  className={cn(
                    "p-3 rounded-2xl transition-colors",
                    playerTheme === 'light' ? "hover:bg-black/5 text-black/20 hover:text-black" : "hover:bg-white/5 text-white/20 hover:text-white"
                  )}
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-accent-primary flex items-center gap-2">
                    <Search className="w-3 h-3" /> Tìm hiểu sâu
                  </label>
                  <textarea 
                    value={fullPodcastSections.deep}
                    onChange={(e) => setFullPodcastSections(prev => ({ ...prev, deep: e.target.value }))}
                    className={cn(
                      "w-full rounded-2xl p-6 text-sm focus:ring-2 transition-all min-h-[150px] resize-none font-medium leading-relaxed",
                      playerTheme === 'light' 
                        ? "bg-orange-50/30 border border-orange-200 text-black focus:ring-orange-500/30" 
                        : "bg-gradient-to-br from-accent-primary/5 to-white/[0.02] border border-accent-primary/20 text-white/70 focus:ring-accent-primary/30 shadow-[inset_0_0_40px_rgba(245,158,11,0.02)]"
                    )}
                    placeholder="Nội dung phần tìm hiểu sâu..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neon-blue flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Tóm tắt nội dung
                  </label>
                  <textarea 
                    value={fullPodcastSections.summary}
                    onChange={(e) => setFullPodcastSections(prev => ({ ...prev, summary: e.target.value }))}
                    className={cn(
                      "w-full rounded-2xl p-6 text-sm focus:ring-2 transition-all min-h-[150px] resize-none font-medium leading-relaxed",
                      playerTheme === 'light' 
                        ? "bg-blue-50/30 border border-blue-200 text-black focus:ring-blue-500/30" 
                        : "bg-gradient-to-br from-neon-blue/5 to-white/[0.02] border border-neon-blue/20 text-white/70 focus:ring-neon-blue/30 shadow-[inset_0_0_40px_rgba(56,189,248,0.02)]"
                    )}
                    placeholder="Nội dung phần tóm tắt..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neon-purple flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Góc nhìn phê bình
                  </label>
                  <textarea 
                    value={fullPodcastSections.critique}
                    onChange={(e) => setFullPodcastSections(prev => ({ ...prev, critique: e.target.value }))}
                    className={cn(
                      "w-full rounded-2xl p-6 text-sm focus:ring-2 transition-all min-h-[150px] resize-none font-medium leading-relaxed",
                      playerTheme === 'light' 
                        ? "bg-purple-50/30 border border-purple-200 text-black focus:ring-purple-500/30" 
                        : "bg-gradient-to-br from-neon-purple/5 to-white/[0.02] border border-neon-purple/20 text-white/70 focus:ring-neon-purple/30 shadow-[inset_0_0_40px_rgba(129,140,248,0.02)]"
                    )}
                    placeholder="Nội dung phần phê bình..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Tranh luận đa chiều
                  </label>
                  <textarea 
                    value={fullPodcastSections.debate}
                    onChange={(e) => setFullPodcastSections(prev => ({ ...prev, debate: e.target.value }))}
                    className={cn(
                      "w-full rounded-2xl p-6 text-sm focus:ring-2 transition-all min-h-[150px] resize-none font-medium leading-relaxed",
                      playerTheme === 'light' 
                        ? "bg-red-50/30 border border-red-200 text-black focus:ring-red-500/30" 
                        : "bg-gradient-to-br from-red-400/5 to-white/[0.02] border border-red-400/20 text-white/70 focus:ring-red-400/30 shadow-[inset_0_0_40px_rgba(248,113,113,0.02)]"
                    )}
                    placeholder="Nội dung phần tranh luận..."
                  />
                </div>
              </div>

              {/* Script View (NotebookLM Style) */}
              <AnimatePresence>
                {podcastScript.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h3 className={cn(
                      "text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-colors",
                      playerTheme === 'light' ? "text-black/20" : "text-white/20"
                    )}>
                      <span className={cn("w-8 h-px", playerTheme === 'light' ? "bg-black/5" : "bg-white/5")} />
                      KỊCH BẢN PODCAST (LIVE SCRIPT)
                    </h3>
                    <div className={cn(
                      "p-8 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar transition-all",
                      playerTheme === 'light' ? "bg-black/5 border border-black/10 rounded-2xl" : "glass-ui bg-white/[0.02]"
                    )}>
                      {podcastScript.map((part, index) => (
                        <motion.div 
                          key={index}
                          animate={{ 
                            opacity: activeScriptIndex === index ? 1 : 0.3,
                            scale: activeScriptIndex === index ? 1.02 : 1,
                            backgroundColor: activeScriptIndex === index 
                              ? (playerTheme === 'light' ? "rgba(0,0,0,0.05)" : (playerTheme === 'accent-focused' ? "rgba(56,189,248,0.1)" : "rgba(245,158,11,0.05)"))
                              : "transparent"
                          }}
                          className={cn(
                            "p-4 rounded-xl transition-all duration-500 border border-transparent",
                            activeScriptIndex === index && (
                              playerTheme === 'light' 
                                ? "border-black/20 shadow-[0_0_30px_rgba(0,0,0,0.05)]" 
                                : (playerTheme === 'accent-focused' ? "border-neon-blue/40 shadow-[0_0_30px_rgba(56,189,248,0.1)]" : "border-accent-primary/20 shadow-[0_0_30px_rgba(245,158,11,0.05)]")
                            )
                          )}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                              part.speaker === "A" ? "bg-accent-primary text-black" : "bg-neon-blue text-black"
                            )}>
                              {part.speaker}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                              {part.speaker === "A" ? "Host A (Wavenet-D)" : "Host B (Wavenet-A)"}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed font-medium">
                            {part.text}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex p-1 border rounded-xl transition-colors",
                    playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                  )}>
                    {(["Nam", "Nữ"] as VoiceType[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setAudioConfig(prev => ({ ...prev, voiceType: v }))}
                        className={cn(
                          "px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider",
                          audioConfig.voiceType === v 
                            ? (playerTheme === 'light' ? "bg-black text-white shadow-lg" : "bg-accent-primary text-black shadow-lg")
                            : (playerTheme === 'light' ? "text-black/30 hover:text-black/50" : "text-white/30 hover:text-white/50")
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      playerTheme === 'light' ? "text-black/20" : "text-white/20"
                    )}>Giọng đọc</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex p-1 border rounded-xl transition-colors",
                      playerTheme === 'light' ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
                    )}>
                      {(['dark', 'light', 'accent-focused'] as PlayerTheme[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setPlayerTheme(t)}
                          className={cn(
                            "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                            playerTheme === t 
                              ? (playerTheme === 'light' ? "bg-black text-white" : "bg-accent-primary text-black") 
                              : (playerTheme === 'light' ? "text-black/30 hover:text-black/60" : "text-white/30 hover:text-white/60")
                          )}
                        >
                          {t.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", playerTheme === 'light' ? "text-black/20" : "text-white/20")}>Theme Player</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  {fullAudioUrl && (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => downloadAudio(fullAudioUrl, "Full_Podcast")}
                      className="p-5 glass-ui rounded-2xl text-accent-primary hover:bg-white/5 transition-all"
                      title="Tải về MP3"
                    >
                      <Download className="w-6 h-6" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateFullPodcast}
                    disabled={isGeneratingFullPodcast}
                    className={cn(
                      "flex-1 md:flex-none px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-4 shadow-2xl disabled:opacity-50 transition-all",
                      playerTheme === 'dark' && "bg-accent-primary text-black shadow-accent-primary/20",
                      playerTheme === 'light' && "bg-black text-white shadow-black/20",
                      playerTheme === 'accent-focused' && "bg-neon-blue text-black shadow-[0_0_30px_rgba(56,189,248,0.5)]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {isGeneratingFullPodcast ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                      <span>{isGeneratingFullPodcast ? "Đang xử lý..." : "Tạo Podcast Full"}</span>
                    </div>
                    {isGeneratingFullPodcast && (
                      <div className="w-48 h-1 bg-black/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className={cn(
                            "w-1/2 h-full",
                            playerTheme === 'light' ? "bg-white" : "bg-black"
                          )}
                        />
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${playerTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}; 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: ${playerTheme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}; 
        }
      `}</style>
    </div>
  );
}
