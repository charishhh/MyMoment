import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Image as ImageIcon, X, Heart, Sparkles } from "lucide-react";
import FloatingParticles from "@/components/ui/floating-particles";

interface Moment {
  id: string;
  text: string;
  image?: string;
  anonymousId: string;
  timestamp: number;
}

function getAnonymousId(): string {
  let id = localStorage.getItem("moments_anonymous_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("moments_anonymous_id", id);
  }
  return id;
}

function getMoments(): Moment[] {
  const moments = localStorage.getItem("moments");
  return moments ? JSON.parse(moments) : [];
}

function saveMoments(moments: Moment[]): void {
  localStorage.setItem("moments", JSON.stringify(moments));
}

export default function Index() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anonymousId] = useState(() => getAnonymousId());
  const [visibleMoments, setVisibleMoments] = useState<string[]>([]);

  useEffect(() => {
    const loadedMoments = getMoments();
    setMoments(loadedMoments);

    // Animate moments in one by one
    setTimeout(() => {
      loadedMoments.forEach((moment, index) => {
        setTimeout(() => {
          setVisibleMoments((prev) => [...prev, moment.id]);
        }, index * 200);
      });
    }, 500);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const postMoment = () => {
    if (!text.trim()) return;

    setIsPosting(true);

    setTimeout(() => {
      const newMoment: Moment = {
        id: crypto.randomUUID(),
        text: text.trim(),
        image,
        anonymousId,
        timestamp: Date.now(),
      };

      const updatedMoments = [newMoment, ...moments];
      setMoments(updatedMoments);
      saveMoments(updatedMoments);
      setVisibleMoments((prev) => [newMoment.id, ...prev]);

      setText("");
      removeImage();
      setIsPosting(false);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 2000);
    }, 1000);
  };

  const deleteMoment = (momentId: string) => {
    setVisibleMoments((prev) => prev.filter((id) => id !== momentId));

    setTimeout(() => {
      const updatedMoments = moments.filter((m) => m.id !== momentId);
      setMoments(updatedMoments);
      saveMoments(updatedMoments);
    }, 300);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingParticles />

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-600 opacity-10 animate-gradient-shift"
          style={{ backgroundSize: "400% 400%" }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 opacity-5 animate-gradient-shift"
          style={{ backgroundSize: "400% 400%", animationDelay: "-1s" }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {/* Animated Header */}
        <div className="text-center mb-12 animate-bounce-in">
          <div className="relative inline-block">
            <h1
              className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-gradient-shift"
              style={{ backgroundSize: "200% 200%" }}
            >
              Moments
            </h1>
            <div className="absolute -top-2 -right-2 animate-float">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg animate-slide-up">
            ✨ Share your magical moments with the universe ✨
          </p>
        </div>

        {/* Success Animation */}
        {showSuccess && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in">
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-pulse-glow">
              <Heart className="w-5 h-5 animate-heart-beat" />
              Moment shared! ✨
            </div>
          </div>
        )}

        {/* Spectacular Post Form */}
        <Card className="mb-12 border-0 shadow-2xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl animate-scale-in hover:scale-105 transition-all duration-500 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-gradient-shift"
            style={{ backgroundSize: "200% 200%" }}
          />

          <CardContent className="p-8 relative z-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 animate-slide-right">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-2xl animate-pulse-glow">
                  {anonymousId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <Badge
                    variant="secondary"
                    className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 animate-float"
                  >
                    ✨ Anonymous Creator
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Express yourself freely
                  </p>
                </div>
              </div>

              <div className="relative animate-slide-up">
                <Textarea
                  placeholder="✨ What magical moment would you like to share with the world? ✨"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 280))}
                  className="min-h-[120px] border-0 bg-white/50 dark:bg-gray-700/50 resize-none focus:ring-4 focus:ring-purple-500/50 rounded-2xl text-lg backdrop-blur-sm transition-all duration-300"
                />
                <div className="absolute bottom-4 right-4">
                  <div
                    className={`text-sm font-medium ${text.length > 250 ? "text-red-500 animate-wiggle" : "text-gray-500"}`}
                  >
                    {text.length}/280
                  </div>
                </div>
              </div>

              {image && (
                <div className="relative animate-scale-in">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-64 object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <Button
                    onClick={removeImage}
                    size="sm"
                    variant="destructive"
                    className="absolute top-4 right-4 rounded-full w-10 h-10 shadow-2xl hover:scale-110 transition-all duration-300 animate-bounce-in"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}

              <div className="flex justify-between items-center animate-slide-up">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-purple-300 hover:border-purple-500 bg-white/50 hover:bg-purple-50 transition-all duration-300 rounded-full px-6 hover:scale-105 animate-float"
                    style={{ animationDelay: "0.5s" }}
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Add Magic ✨
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <Button
                  onClick={postMoment}
                  disabled={!text.trim() || isPosting}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold px-8 py-3 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-110 disabled:opacity-50 disabled:scale-100 animate-pulse-glow"
                >
                  {isPosting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sharing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Share Moment
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Magical Moments Feed */}
        <div className="space-y-8">
          {moments.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl animate-bounce-in">
              <CardContent className="p-12 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-float shadow-2xl">
                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    No moments yet ✨
                  </h3>
                  <p className="text-lg">
                    Be the first to share your magical moment!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            moments.map((moment, index) => (
              <Card
                key={moment.id}
                className={`border-0 shadow-2xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl hover:shadow-purple-500/20 transition-all duration-700 hover:scale-105 relative overflow-hidden ${
                  visibleMoments.includes(moment.id)
                    ? "animate-slide-up opacity-100"
                    : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 animate-gradient-shift"
                  style={{ backgroundSize: "200% 200%" }}
                />

                <CardContent className="p-8 relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4 animate-slide-right">
                      <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-2xl animate-pulse-glow">
                        {moment.anonymousId.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                          ✨ Anonymous Creator
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span>{formatTimestamp(moment.timestamp)}</span>
                          <span className="animate-pulse">•</span>
                          <Heart className="w-4 h-4 text-red-400 animate-heart-beat" />
                        </div>
                      </div>
                    </div>

                    {moment.anonymousId === anonymousId && (
                      <Button
                        onClick={() => deleteMoment(moment.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-10 h-10 transition-all duration-300 hover:scale-110 animate-float"
                        style={{ animationDelay: "1s" }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  <p className="text-gray-800 dark:text-gray-200 mb-6 leading-relaxed text-lg animate-slide-up">
                    {moment.text}
                  </p>

                  {moment.image && (
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl animate-scale-in group">
                      <img
                        src={moment.image}
                        alt="Moment"
                        className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
