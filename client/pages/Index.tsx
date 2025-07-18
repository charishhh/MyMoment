import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Image as ImageIcon, X } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anonymousId] = useState(() => getAnonymousId());

  useEffect(() => {
    setMoments(getMoments());
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

    setText("");
    removeImage();
  };

  const deleteMoment = (momentId: string) => {
    const updatedMoments = moments.filter((m) => m.id !== momentId);
    setMoments(updatedMoments);
    saveMoments(updatedMoments);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Moments
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Share your moments anonymously with the world
          </p>
        </div>

        {/* Post Form */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {anonymousId.slice(0, 2).toUpperCase()}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Anonymous User
                </Badge>
              </div>

              <Textarea
                placeholder="What's on your mind? Share your moment..."
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 280))}
                className="min-h-[100px] border-0 bg-gray-50 dark:bg-gray-700 resize-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{text.length}/280</span>
              </div>

              {image && (
                <div className="relative">
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    onClick={removeImage}
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-purple-200 hover:border-purple-300"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Photo
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
                  disabled={!text.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Share Moment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moments Feed */}
        <div className="space-y-4">
          {moments.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-800/60">
              <CardContent className="p-8 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No moments yet</h3>
                  <p>Be the first to share a moment!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            moments.map((moment) => (
              <Card
                key={moment.id}
                className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {moment.anonymousId.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Anonymous User
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimestamp(moment.timestamp)}
                        </div>
                      </div>
                    </div>

                    {moment.anonymousId === anonymousId && (
                      <Button
                        onClick={() => deleteMoment(moment.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                    {moment.text}
                  </p>

                  {moment.image && (
                    <img
                      src={moment.image}
                      alt="Moment"
                      className="w-full h-64 object-cover rounded-lg"
                    />
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
