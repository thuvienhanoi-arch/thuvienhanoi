import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  analyzeBook, 
  generateCustomAudioOverview, 
  BookAnalysis, 
  AudioOverviewConfig, 
  fixSpelling,
  saveAnalysis,
  getAnalysisHistory,
  deleteAnalysis,
  startChat,
  syncUserProfile,
  BACKGROUND_MUSIC_TRACKS
} from "@/services/aiService";
import { 
  Loader2, 
  Upload, 
  Home, 
  Book, 
  Mic, 
  Share2, 
  Search, 
  Play, 
  Pause, 
  Settings, 
  Eye, 
  X, 
  Download, 
  ExternalLink, 
  Palette, 
  MapPin,
  RefreshCw,
  History,
  Save,
  Trash2,
  LogIn,
  LogOut,
  User,
  MessageSquare,
  Send,
  Sparkles,
  Sun,
  Moon
} from "lucide-react";
import { auth } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

export default function LibraryUIPro() {
  // 🎨 EFFECT CLASSES
  const hoverCard = "transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30";
  const glowButton = "transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40";

  const [activeTab, setActiveTab] = useState("home");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [history, setHistory] = useState<BookAnalysis[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasSyncedRef = useRef(false);

  // Core App State
  const [analysis, setAnalysis] = useState<BookAnalysis | null>(null);
  const [fileData, setFileData] = useState<{ data: string; mimeType: string } | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFBPostLoading, setIsFBPostLoading] = useState(false);
  const [isCoversLoading, setIsCoversLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  const handleConnectApiKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
      toast.success("Đã kết nối Gemini API!");
    }
  };
  const [isPodcastLoading, setIsPodcastLoading] = useState(false);
  const [facebookPost, setFacebookPost] = useState<string | null>(null);
  const [podcastCovers, setPodcastCovers] = useState<string[]>([]);
  const [activeCoverIndex, setActiveCoverIndex] = useState(0);
  const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
  const [viewingCover, setViewingCover] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [podcastConfig, setPodcastConfig] = useState<AudioOverviewConfig>({
    mode: "Quick Summary",
    language: "Tiếng Việt",
    length: "Default",
    voiceType: "Nam",
    hasBackgroundMusic: true,
    backgroundMusicTrack: "soft-piano",
    customInstruction: ""
  });

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isPlaying && podcastConfig.hasBackgroundMusic) {
      setIsMusicPlaying(true);
    } else {
      setIsMusicPlaying(false);
    }
  }, [isPlaying, podcastConfig.hasBackgroundMusic]);

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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && !hasSyncedRef.current) {
        hasSyncedRef.current = true;
        syncUserProfile(u);
        loadHistory();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Lỗi đăng nhập. Vui lòng thử lại.");
    }
  };

  const logout = () => {
    auth.signOut();
    toast.info("Đã đăng xuất.");
  };

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await getAnalysisHistory();
      setHistory(data);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Không thể tải lịch sử.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysis || !user) {
      toast.error("Vui lòng đăng nhập để lưu kết quả!");
      return;
    }
    setIsSaving(true);
    try {
      const analysisToSave = {
        ...analysis,
        podcastCovers: podcastCovers,
        facebookPost: facebookPost || undefined
      };
      toast.promise(saveAnalysis(analysisToSave), {
        loading: 'Đang lưu kết quả...',
        success: () => {
          loadHistory();
          return "Đã lưu kết quả phân tích!";
        },
        error: 'Lỗi khi lưu kết quả.'
      });
    } catch (error) {
      console.error("Error saving analysis:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    setAnalysisToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!analysisToDelete) return;
    try {
      await deleteAnalysis(analysisToDelete);
      setHistory(history.filter((item) => item.id !== analysisToDelete));
      toast.success("Đã xóa bản phân tích!");
    } catch (error) {
      console.error("Error deleting history:", error);
      toast.error("Lỗi khi xóa bản phân tích.");
    } finally {
      setIsDeleteDialogOpen(false);
      setAnalysisToDelete(null);
    }
  };

  const loadFromHistory = (item: BookAnalysis) => {
    setAnalysis(item);
    if (item.imageUrl) setImage(item.imageUrl);
    if (item.podcastCovers) setPodcastCovers(item.podcastCovers);
    if (item.facebookPost) setFacebookPost(item.facebookPost);
    setActiveTab("home");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];
        setFileData({ data: base64Data, mimeType: file.type });
        setImage(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateContent = async () => {
    if (!fileData) return;
    setIsLoading(true);
    try {
      const result = await analyzeBook(fileData);
      setAnalysis({ ...result, imageUrl: image || undefined });
    } catch (error) {
      console.error("Error analyzing book:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFBPost = async () => {
    if (!analysis) return;
    setIsFBPostLoading(true);
    try {
      const { generateFacebookPost } = await import("@/services/aiService");
      const post = await generateFacebookPost(analysis, "Professional");
      setFacebookPost(post);
    } catch (error) {
      console.error("Error generating FB post:", error);
    } finally {
      setIsFBPostLoading(false);
    }
  };

  const generateCovers = async () => {
    if (!analysis) return;
    setIsCoversLoading(true);
    try {
      const { generatePodcastCovers } = await import("@/services/aiService");
      const covers = await generatePodcastCovers(analysis.title);
      setPodcastCovers(covers);
      if (covers.length > 0) setActiveCoverIndex(0);
    } catch (error) {
      console.error("Error generating covers:", error);
    } finally {
      setIsCoversLoading(false);
    }
  };

  const generatePodcast = async () => {
    if (!fileData) return;
    setIsPodcastLoading(true);
    try {
      const result = await generateCustomAudioOverview(fileData, podcastConfig);
      setPodcastUrl(result.audioUrl);
    } catch (error) {
      console.error("Error generating podcast:", error);
    } finally {
      setIsPodcastLoading(false);
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

  const downloadPodcast = () => {
    if (!podcastUrl) return;
    const a = document.createElement('a');
    a.href = podcastUrl;
    a.download = `Podcast_${analysis?.title || 'Overview'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Đang tải xuống podcast...");
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const copyToNotebookLM = () => {
    if (!analysis) return;
    const content = `
      TITLE: ${analysis.title}
      SUMMARY: ${analysis.summary}
      KEY IDEAS: ${analysis.keyIdeas.join("\n")}
      INSIGHTS: ${analysis.insights.join("\n")}
    `.trim();
    
    navigator.clipboard.writeText(content);
    window.open("https://notebooklm.google.com/", "_blank");
  };

  const drawCover = (imageUrl: string, title: string) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    // Only set crossOrigin for remote URLs to avoid issues with local blobs
    if (imageUrl.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.src = imageUrl;

    img.onload = () => {
      // Set to 900x900 for high quality cinematic look
      canvas.width = 900;
      canvas.height = 900;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Background (Cinematic & Moody)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
      
      // Draw the book image with high blur and low opacity as background texture
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.filter = "blur(40px) grayscale(30%)";
      ctx.drawImage(img, -100, -100, w + 200, h + 200);
      ctx.restore();

      // 2. Cinematic Lighting (Radial Gradient)
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8);
      grad.addColorStop(0, "rgba(255, 123, 0, 0.15)");
      grad.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 3. Mic = Hero Object (Center Composition)
      const micX = w / 2;
      const micY = h * 0.42;
      const micW = w * 0.14;
      const micH = h * 0.25;
      
      ctx.shadowColor = "rgba(255, 123, 0, 0.6)";
      ctx.shadowBlur = 50;
      
      // Mic Body (Golden/White Metallic Gradient)
      const micGrad = ctx.createLinearGradient(micX - micW/2, micY, micX + micW/2, micY);
      micGrad.addColorStop(0, "#b45309");
      micGrad.addColorStop(0.5, "#ffffff");
      micGrad.addColorStop(1, "#b45309");
      
      ctx.fillStyle = micGrad;
      ctx.beginPath();
      // @ts-ignore
      if (ctx.roundRect) {
        // @ts-ignore
        ctx.roundRect(micX - micW/2, micY - micH/2, micW, micH, micW/2);
      } else {
        ctx.rect(micX - micW/2, micY - micH/2, micW, micH);
      }
      ctx.fill();
      
      // Mic Stand (Metallic)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = w * 0.018;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(micX, micY + micH/2 - micH*0.1, micW * 0.95, 0, Math.PI, false);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(micX, micY + micH/2 + micH*0.1);
      ctx.lineTo(micX, micY + micH/2 + micH*0.7);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // 4. Typography (Cinematic Cultural)
      // Header (Be Vietnam Pro)
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `600 ${Math.floor(w * 0.022)}px 'Be Vietnam Pro'`;
      ctx.letterSpacing = "6px";
      ctx.fillText("HANOI CULTURAL CENTER", w / 2, h * 0.12);

      // PODCAST Text (Be Vietnam Pro Bold)
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.floor(w * 0.055)}px 'Be Vietnam Pro'`;
      ctx.letterSpacing = "12px";
      ctx.fillText("PODCAST", w / 2, h * 0.68);

      // Main Title (Be Vietnam Pro - Elegant Serif)
      ctx.fillStyle = "#f59e0b";
      ctx.font = `900 ${Math.floor(w * 0.085)}px 'Be Vietnam Pro'`;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 8;
      
      // Handle long titles by wrapping
      const maxWidth = w * 0.85;
      const words = title.split(' ');
      let line = '';
      let y = h * 0.82;
      const lineHeight = w * 0.1;
      
      for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, w / 2, y);
          line = words[n] + ' ';
          y += lineHeight;
        }
        else {
          line = testLine;
        }
      }
      ctx.fillText(line, w / 2, y);

      // 5. Footer (Copyright)
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = `400 ${Math.floor(w * 0.018)}px 'Be Vietnam Pro'`;
      ctx.fillText("Copyright © 2026 Trung tâm Văn hóa và Thư viện Hà Nội", w / 2, h * 0.96);

      // Trigger download
      try {
        const link = document.createElement('a');
        link.download = `cinematic-podcast-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (e) {
        console.error("Canvas toDataURL error:", e);
      }
    };

    img.onerror = () => {
      console.error("Image load error in drawCover");
    };
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      
      <Dialog open={!!viewingCover} onOpenChange={() => setViewingCover(null)}>
        <DialogContent className="max-w-3xl bg-card border-border p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-foreground flex items-center justify-between">
              <span>Xem trước ảnh bìa</span>
              <Button variant="ghost" size="icon" onClick={() => setViewingCover(null)} className="h-8 w-8 rounded-full">
                <X size={18} />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-square w-full bg-muted flex items-center justify-center">
            {viewingCover && (
              <img 
                src={viewingCover} 
                className="w-full h-full object-contain" 
                alt="Zoomed Cover" 
              />
            )}
          </div>
          <div className="p-4 flex justify-end gap-3 bg-muted/30">
            <Button 
              variant="outline" 
              onClick={() => setViewingCover(null)}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              Đóng
            </Button>
            {viewingCover && (
              <Button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingCover;
                  link.download = `podcast-cover-${Date.now()}.png`;
                  link.click();
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                <Download size={18} className="mr-2" /> Tải xuống
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bạn có chắc chắn muốn xóa bản phân tích này khỏi lịch sử? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-transparent text-foreground flex font-sans transition-colors duration-300">
      {/* SIDEBAR */}
      <div className="w-64 bg-card/30 backdrop-blur-2xl p-6 hidden md:flex flex-col gap-8 border-r border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Book className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">LIBRARY AI</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full hover:bg-muted"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
        
        <nav className="flex flex-col gap-2">
          <div onClick={() => setActiveTab("home")}>
            <NavItem icon={<Home size={18} />} label="Trang chủ" active={activeTab === "home"} />
          </div>
          <div onClick={() => setActiveTab("library")}>
            <NavItem icon={<Book size={18} />} label="Thư viện" active={activeTab === "library"} />
          </div>
          <div onClick={() => setActiveTab("podcast")}>
            <NavItem icon={<Mic size={18} />} label="Podcast" active={activeTab === "podcast"} />
          </div>
          <div onClick={() => setActiveTab("post")}>
            <NavItem icon={<Share2 size={18} />} label="Bài đăng" active={activeTab === "post"} />
          </div>
          <div onClick={() => setActiveTab("history")}>
            <NavItem icon={<History size={18} />} label="Lịch sử" active={activeTab === "history"} />
          </div>
          <div onClick={() => setActiveTab("chat-ai")}>
            <NavItem icon={<MessageSquare size={18} />} label="Chat AI" active={activeTab === "chat-ai"} />
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          {user ? (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border">
              <img src={user.photoURL || ""} className="w-8 h-8 rounded-full" alt="User" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user.displayName}</p>
                <button onClick={logout} className="text-[10px] text-muted-foreground hover:text-red-400 flex items-center gap-1">
                  <LogOut size={10} /> Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={login} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold flex gap-2">
                <LogIn size={18} /> Đăng nhập
              </Button>
            </motion.div>
          )}
          
          {!hasApiKey && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={handleConnectApiKey} 
                className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-xl font-bold flex gap-2 shadow-lg shadow-orange-500/20"
              >
                <Sparkles size={18} /> Kết nối Gemini API
              </Button>
            </motion.div>
          )}

          <div className="p-4 bg-muted/30 rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground mb-2">Gói hiện tại</p>
            <p className="text-sm font-semibold">Premium Plan</p>
            <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-orange-500 h-full w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "chat-ai" ? (
          <ChatAIView />
        ) : activeTab === "history" ? (
          <div className="max-w-5xl mx-auto p-8">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-bold">Lịch sử phân tích</h2>
                <p className="text-muted-foreground text-sm">Xem lại các cuốn sách bạn đã khám phá</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                   variant="outline" 
                   onClick={loadHistory}
                   className="rounded-xl border-border hover:bg-muted"
                >
                  <RefreshCw size={16} className="mr-2" /> Làm mới
                </Button>
              </motion.div>
            </header>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <History size={48} className="mb-4 opacity-20" />
                <p>Chưa có lịch sử phân tích nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-all group h-full">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Book size={16} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteHistory(item.id!)}
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <h4 className="font-bold text-lg mb-1 truncate">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </p>
                        
                        {item.podcastCovers && item.podcastCovers.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold mb-2 text-pink-500 flex items-center gap-1">
                              <Palette size={12} /> Podcast Covers
                            </p>
                            <div className="grid grid-cols-4 gap-1">
                              {item.podcastCovers.slice(0, 4).map((cover, idx) => (
                                <div key={idx} className="aspect-square rounded bg-muted overflow-hidden border border-border/30">
                                  <img src={cover} className="w-full h-full object-cover" alt="Cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-muted hover:bg-orange-500 text-foreground rounded-xl transition-colors active:scale-95"
                            onClick={() => loadFromHistory(item)}
                          >
                            Xem chi tiết
                          </Button>
                          {item.podcastCovers && item.podcastCovers.length > 0 && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-xl border-pink-500/30 text-pink-500 hover:bg-pink-500/10"
                              onClick={async () => {
                                try {
                                  const response = await fetch(item.podcastCovers![0]);
                                  const blob = await response.blob();
                                  await navigator.clipboard.write([
                                    new ClipboardItem({ [blob.type]: blob })
                                  ]);
                                  toast.success("Đã copy ảnh bìa! Đang mở Canva...");
                                  setTimeout(() => {
                                    window.open("https://www.canva.com/", "_blank");
                                  }, 1000);
                                } catch (err) {
                                  console.error("Error copying image:", err);
                                  toast.error("Không thể copy ảnh.");
                                }
                              }}
                              title="Copy sang Canva"
                            >
                              <ExternalLink size={16} />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "post" ? (
          <div className="max-w-4xl mx-auto p-8">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-bold">Bài đăng Facebook</h2>
                <p className="text-muted-foreground text-sm">Nội dung gợi ý để chia sẻ lên mạng xã hội</p>
              </div>
            </header>

            {facebookPost ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-blue-900/20 border-blue-500/30">
                  <CardContent className="p-8">
                    <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                      <Share2 size={20} />
                      Bài đăng Facebook gợi ý
                    </h4>
                    <div className="bg-muted/30 p-6 rounded-2xl border border-border whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
                      {facebookPost}
                    </div>
                    <Button 
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 font-bold"
                      onClick={() => {
                        navigator.clipboard.writeText(facebookPost);
                        toast.success("Đã sao chép vào bộ nhớ tạm!");
                      }}
                    >
                      Sao chép nội dung
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Share2 size={48} className="mb-4 opacity-20" />
                <p>Chưa có bài đăng nào được tạo. Hãy quay lại Trang chủ để phân tích sách.</p>
                <Button variant="link" onClick={() => setActiveTab("home")} className="text-orange-500 mt-2">Quay lại Trang chủ</Button>
              </div>
            )}
          </div>
        ) : activeTab === "podcast" ? (
          <div className="max-w-5xl mx-auto p-8">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-bold">Podcast Studio</h2>
                <p className="text-muted-foreground text-sm">Nghe bản tóm tắt âm thanh và quản lý ảnh bìa</p>
              </div>
            </header>

            <div className="space-y-8">
              {isPodcastLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <Card className="bg-card/30 border-purple-500/30 backdrop-blur-md overflow-hidden p-12 flex flex-col items-center justify-center text-center space-y-6">
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
                        className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl"
                      />
                      <div className="relative bg-purple-500/10 p-6 rounded-full border border-purple-500/20">
                        <Mic className="w-12 h-12 text-purple-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">Đang tạo Podcast...</h3>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        AI đang chuyển đổi nội dung sách thành kịch bản và lồng tiếng chuyên nghiệp.
                      </p>
                    </div>
                    <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                      />
                    </div>
                  </Card>
                </motion.div>
              )}

              {podcastUrl ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/30 backdrop-blur-md overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={togglePlay}
                          className="w-16 h-16 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/30 transition-colors"
                        >
                          {isPlaying ? <Pause fill="white" size={28} /> : <Play fill="white" className="ml-1" size={28} />}
                        </motion.button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-lg">Podcast Audio Overview</h4>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-purple-300 hover:text-white hover:bg-purple-500/20"
                              onClick={downloadPodcast}
                              title="Tải xuống podcast"
                            >
                              <Download className="w-5 h-5" />
                            </Button>
                          </div>
                          <p className="text-purple-300 text-sm">AI Generated • 2:45</p>
                          <div className="w-full bg-muted h-1.5 rounded-full mt-4 overflow-hidden">
                            <motion.div 
                              className="bg-purple-500 h-full" 
                              initial={{ width: 0 }}
                              animate={{ width: isPlaying ? "100%" : "30%" }}
                              transition={{ duration: isPlaying ? 165 : 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                      <audio ref={audioRef} src={podcastUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                      {podcastConfig.hasBackgroundMusic && (
                        <audio 
                          ref={musicRef} 
                          src={BACKGROUND_MUSIC_TRACKS.find(t => t.id === podcastConfig.backgroundMusicTrack)?.url} 
                          loop 
                          className="hidden" 
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : null}

              {podcastCovers.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold flex items-center gap-2">
                      <Share2 className="text-pink-500" size={20} />
                      Ảnh bìa Podcast (AI Generated)
                    </h4>
                    {activeCoverIndex !== null && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await fetch(podcastCovers[activeCoverIndex!]);
                              const blob = await response.blob();
                              await navigator.clipboard.write([
                                new ClipboardItem({ [blob.type]: blob })
                              ]);
                              toast.success("Đã copy ảnh bìa! Đang mở Canva...");
                              setTimeout(() => {
                                window.open("https://www.canva.com/", "_blank");
                              }, 1000);
                            } catch (err) {
                              console.error("Error copying image:", err);
                              toast.error("Không thể copy ảnh.");
                            }
                          }}
                          className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                        >
                          <ExternalLink size={14} className="mr-2" /> Copy sang Canva
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadCover(podcastCovers[activeCoverIndex!], activeCoverIndex!)}
                          className="border-pink-500/30 text-pink-500 hover:bg-pink-500/10"
                        >
                          Tải xuống ảnh đã chọn
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {podcastCovers.map((cover, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setActiveCoverIndex(idx)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${activeCoverIndex === idx ? 'border-pink-500 shadow-lg shadow-pink-500/20' : 'border-transparent'}`}
                      >
                        <img 
                          src={cover} 
                          className="w-full h-full object-cover" 
                          alt={`Cover ${idx + 1}`} 
                          onClick={(e) => { e.stopPropagation(); setViewingCover(cover); }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewingCover(cover); }}
                            className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 text-white"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownloadCover(cover, idx); }}
                            className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 text-white"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                        {activeCoverIndex === idx && (
                          <div className="absolute top-2 right-2 bg-pink-500 text-white p-1 rounded-full shadow-lg">
                            <Play size={10} fill="white" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {!podcastUrl && podcastCovers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Mic size={48} className="mb-4 opacity-20" />
                  <p>Chưa có podcast nào được tạo. Hãy quay lại Trang chủ để tạo podcast.</p>
                  <Button variant="link" onClick={() => setActiveTab("home")} className="text-orange-500 mt-2">Quay lại Trang chủ</Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-8">
            {/* HEADER */}
          <header className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-bold">Xin chào 👋</h2>
              <p className="text-gray-400 text-sm">Hôm nay bạn muốn khám phá cuốn sách nào?</p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-72"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder="Tìm kiếm sách..." 
                className="pl-10 bg-card/20 backdrop-blur-xl border-white/10 focus:border-orange-500 transition-all rounded-xl h-11 focus:ring-2 focus:ring-orange-500/20" 
              />
            </motion.div>
          </header>

          {/* HERO */}
          <img
            src="https://i.postimg.cc/L8jWgWQP/góc_nhìn_đa_dạng_về_văn_hóa_lịch_sử_Thủ_đô.png"
            alt="Góc nhìn đa dạng về văn hóa lịch sử Thủ đô"
            className="w-full rounded-3xl shadow-2xl mb-12"
            referrerPolicy="no-referrer"
          />

          {/* UPLOAD SECTION */}
          <section className="flex flex-col gap-8 mb-12">
            <Card className="w-full bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  {!image ? (
                    <motion.div 
                      key="upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center text-center py-12"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-white/10 group-hover:border-orange-500 transition-colors">
                        <Upload className="text-muted-foreground" size={32} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Tải lên tài liệu</h3>
                      <p className="text-muted-foreground text-sm mb-8 max-w-[200px]">Kéo thả hoặc nhấn để chọn ảnh bìa sách hoặc file PDF</p>
                      <motion.label 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer"
                      >
                        <Input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                        <div className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-orange-500/20">
                          Chọn tệp
                        </div>
                      </motion.label>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col md:flex-row items-center md:items-start gap-10"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={image}
                          className="rounded-2xl shadow-2xl max-h-72 w-auto object-cover border-4 border-border transition-transform duration-500 hover:scale-105"
                          alt="Book cover"
                        />
                        <button 
                          onClick={() => { setImage(null); setFileData(null); setAnalysis(null); setPodcastUrl(null); }}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex-1 w-full space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">Tài liệu đã chọn</h3>
                          <p className="text-muted-foreground text-sm">Sẵn sàng để phân tích và tạo nội dung đa phương tiện.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              onClick={generateContent} 
                              disabled={isLoading}
                              className={`w-full bg-orange-500 hover:bg-orange-600 h-14 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/20 ${glowButton}`}
                            >
                              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" size={20} />}
                              {isLoading ? "Đang phân tích..." : "✨ Phân tích ngay"}
                            </Button>
                          </motion.div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={generatePodcast} 
                              disabled={isPodcastLoading}
                              className={`flex-1 bg-purple-600 hover:bg-purple-700 h-14 rounded-2xl font-bold shadow-lg shadow-purple-600/20 ${glowButton}`}
                            >
                              {isPodcastLoading ? <Loader2 className="animate-spin mr-2" /> : <Mic className="mr-2" size={20} />}
                              {isPodcastLoading ? "Đang tạo..." : "🎧 Podcast"}
                            </Button>
                            <Popover>
                              <PopoverTrigger className="h-14 w-14 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40">
                                <Settings size={22} />
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-card/80 backdrop-blur-2xl border-white/10 text-foreground p-6 rounded-2xl shadow-2xl">
                                <div className="space-y-4">
                                  <h4 className="font-bold text-lg border-b border-white/10 pb-2">Tùy chỉnh Podcast</h4>
                                  
                                  <div className="space-y-2">
                                    <Label>Chế độ</Label>
                                    <Select 
                                      value={podcastConfig.mode} 
                                      onValueChange={(v: any) => setPodcastConfig(prev => ({ ...prev, mode: v }))}
                                    >
                                      <SelectTrigger className="bg-muted border-border">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-card border-border text-foreground">
                                        <SelectItem value="Quick Summary">Tóm tắt nhanh</SelectItem>
                                        <SelectItem value="Deep Exploration">Khám phá sâu</SelectItem>
                                        <SelectItem value="Critical Review">Đánh giá phê bình</SelectItem>
                                        <SelectItem value="Debate Mode">Chế độ tranh luận</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Ngôn ngữ</Label>
                                      <Select 
                                        value={podcastConfig.language} 
                                        onValueChange={(v: any) => setPodcastConfig(prev => ({ ...prev, language: v }))}
                                      >
                                        <SelectTrigger className="bg-muted border-border">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground">
                                          <SelectItem value="Tiếng Việt">Tiếng Việt</SelectItem>
                                          <SelectItem value="English">English</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Giọng đọc</Label>
                                      <Select 
                                        value={podcastConfig.voiceType} 
                                        onValueChange={(v: any) => setPodcastConfig(prev => ({ ...prev, voiceType: v }))}
                                      >
                                        <SelectTrigger className="bg-muted border-border">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground">
                                          <SelectItem value="Nam">Nam</SelectItem>
                                          <SelectItem value="Nữ">Nữ</SelectItem>
                                          <SelectItem value="Podcast host">Host chuyên nghiệp</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <Label>Nhạc nền</Label>
                                    <Switch 
                                      checked={podcastConfig.hasBackgroundMusic} 
                                      onCheckedChange={(v) => setPodcastConfig(prev => ({ ...prev, hasBackgroundMusic: v }))}
                                    />
                                  </div>

                                  {podcastConfig.hasBackgroundMusic && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                      <Label className="text-xs">Chọn bản nhạc</Label>
                                      <Select 
                                        value={podcastConfig.backgroundMusicTrack} 
                                        onValueChange={(v: any) => setPodcastConfig(prev => ({ ...prev, backgroundMusicTrack: v }))}
                                      >
                                        <SelectTrigger className="bg-muted border-border h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground">
                                          {BACKGROUND_MUSIC_TRACKS.map(track => (
                                            <SelectItem key={track.id} value={track.id} className="text-xs">
                                              {track.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <Label>Yêu cầu riêng</Label>
                                    <Textarea 
                                      placeholder="Ví dụ: Tập trung vào bài học kinh doanh..." 
                                      className="bg-muted border-border text-sm h-20"
                                      value={podcastConfig.customInstruction}
                                      onChange={(e) => setPodcastConfig(prev => ({ ...prev, customInstruction: e.target.value }))}
                                    />
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {analysis && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button 
                                onClick={generateFBPost} 
                                disabled={isFBPostLoading}
                                className={`w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-bold shadow-lg shadow-blue-600/20 ${glowButton}`}
                              >
                                {isFBPostLoading ? <Loader2 className="animate-spin mr-2" /> : <Share2 className="mr-2" size={20} />}
                                {isFBPostLoading ? "Đang tạo..." : "📣 Tạo Post FB"}
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button 
                                onClick={generateCovers} 
                                disabled={isCoversLoading}
                                className={`w-full bg-pink-600 hover:bg-pink-700 h-14 rounded-2xl font-bold shadow-lg shadow-pink-600/20 ${glowButton}`}
                              >
                                {isCoversLoading ? <Loader2 className="animate-spin mr-2" /> : <Palette className="mr-2" size={20} />}
                                {isCoversLoading ? "Đang tạo..." : "🖼️ Tạo Ảnh Bìa"}
                              </Button>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <div className="w-full space-y-8">
              {/* ANALYSIS RESULT */}
              <AnimatePresence>
                {analysis && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                      <CardContent className="p-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                          <h3 className="text-3xl font-bold text-orange-400">{analysis.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            {user && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleSaveAnalysis}
                                  disabled={isSaving}
                                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2 h-10 px-4 rounded-xl"
                                >
                                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                  Lưu kết quả
                                </Button>
                              </motion.div>
                            )}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={copyToNotebookLM}
                                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 gap-2 h-10 px-4 rounded-xl"
                              >
                                <ExternalLink size={14} />
                                Copy to NotebookLM
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                        <div className="prose prose-invert max-w-none space-y-10">
                          <section>
                            <h4 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                              <span className="w-8 h-8 bg-orange-500/20 text-orange-500 rounded-lg flex items-center justify-center text-sm">1</span>
                              Giới thiệu sách
                            </h4>
                            <p className="text-muted-foreground leading-relaxed mb-4">{analysis.introduction}</p>
                            
                            <motion.div 
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4 hover:bg-white/10 transition-all group cursor-pointer"
                            >
                              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <MapPin size={24} />
                              </div>
                              <div>
                                <h5 className="font-bold text-foreground text-lg mb-1">Địa điểm đọc sách gợi ý</h5>
                                <p className="text-orange-400 font-semibold text-sm mb-1">Trung tâm Văn hóa và Thư viện Hà Nội</p>
                                <p className="text-muted-foreground text-xs leading-relaxed mb-3">47 Bà Triệu, Hàng Bài, Hoàn Kiếm, Hà Nội</p>
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto text-orange-500 hover:text-orange-400 text-xs font-bold gap-1"
                                  onClick={() => window.open("https://www.google.com/maps/search/?api=1&query=Trung+tâm+Văn+hóa+và+Thư+viện+Hà+Nội+47+Bà+Triệu", "_blank")}
                                >
                                  Xem vị trí trên bản đồ <ExternalLink size={12} />
                                </Button>
                              </div>
                            </motion.div>
                          </section>

                          <section>
                            <h4 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                              <span className="w-8 h-8 bg-orange-500/20 text-orange-500 rounded-lg flex items-center justify-center text-sm">2</span>
                              Tóm tắt chi tiết
                            </h4>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{analysis.detailedSummary}</p>
                          </section>

                          <section>
                            <h4 className="text-xl font-bold text-foreground mb-3">Tóm tắt cốt lõi</h4>
                            <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
                          </section>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysis.keyIdeas.slice(0, 4).map((idea, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="w-6 h-6 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                  {i + 1}
                                </div>
                                <p className="text-sm text-muted-foreground">{idea}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {!analysis && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-800 rounded-3xl">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                    <Book className="text-gray-700" size={32} />
                  </div>
                  <h4 className="text-gray-500 font-medium">Kết quả phân tích sẽ xuất hiện ở đây</h4>
                </div>
              )}

              {isLoading && (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-3/4 bg-muted rounded-xl" />
                  <Skeleton className="h-32 w-full bg-muted rounded-xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 bg-muted rounded-xl" />
                    <Skeleton className="h-20 bg-muted rounded-xl" />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  </div>
</>
);
}

const ChatAIView = () => {
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = startChat();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsChatLoading(true);

    try {
      const result = await chatRef.current.sendMessage(userMessage);
      setMessages(prev => [...prev, { role: "model", text: result.text }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Lỗi khi gửi tin nhắn. Vui lòng thử lại.");
      setMessages(prev => [...prev, { role: "model", text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-card/20 backdrop-blur-3xl rounded-xl shadow-sm border border-white/10 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 dark:shadow-indigo-900/20 shadow-lg">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Trợ lý AI Book Summary</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Đang trực tuyến
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMessages([])} title="Xóa hội thoại">
          <Trash2 size={18} className="text-muted-foreground hover:text-destructive transition-colors" />
        </Button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <MessageSquare size={32} />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">Bắt đầu cuộc trò chuyện</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Hỏi tôi bất cứ điều gì về sách, kỹ năng đọc hoặc yêu cầu tóm tắt một chủ đề cụ thể.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-card/40 backdrop-blur-xl border border-white/10 text-foreground rounded-tl-none"
              }`}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {msg.text.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">AI đang suy nghĩ...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-transparent border-t border-white/10">
        <motion.div 
          initial={false}
          animate={{ scale: 1 }}
          whileFocus={{ scale: 1.01 }}
          className="flex gap-2 items-center bg-muted/20 p-2 rounded-xl border border-white/10 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/20 transition-all"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 border-none bg-transparent focus-visible:ring-0 shadow-none text-foreground"
          />
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              onClick={handleSend} 
              disabled={isChatLoading || !input.trim()}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20"
              size="icon"
            >
              <Send size={18} />
            </Button>
          </motion.div>
        </motion.div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          AI có thể đưa ra thông tin không chính xác. Hãy kiểm tra lại các thông tin quan trọng.
        </p>
      </div>

    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all
        ${active ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"}
      `}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </motion.div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse ${className}`} />;
}
