import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Image as ImageIcon,
  X,
  Edit3,
  Check,
  Heart,
  RefreshCw,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Users,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";
import FloatingParticles from "@/components/ui/floating-particles";
import {
  Moment,
  Reply,
  CreateMomentRequest,
  CreateReplyRequest,
  DeleteMomentRequest,
  DeleteReplyRequest,
} from "@shared/api";

function getAnonymousId(): string {
  let id = localStorage.getItem("moments_anonymous_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("moments_anonymous_id", id);
  }
  return id;
}

function getDisplayName(): string {
  let name = localStorage.getItem("moments_display_name");
  if (!name) {
    name = "Anonymous User";
    localStorage.setItem("moments_display_name", name);
  }
  return name;
}

function saveDisplayName(name: string): void {
  localStorage.setItem("moments_display_name", name);
}

export default function Index() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(() => getDisplayName());
  const [tempDisplayName, setTempDisplayName] = useState(displayName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anonymousId] = useState(() => getAnonymousId());
  const [visibleMoments, setVisibleMoments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reply-related state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [showReplySuccess, setShowReplySuccess] = useState(false);

  // Connection and real-time state
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds

  // Fetch moments from API
  const fetchMoments = async (silent = false) => {
    try {
      if (!silent) setError(null);
      const response = await fetch("/api/moments");
      if (!response.ok) {
        throw new Error("Failed to fetch moments");
      }
      const data = await response.json();

      // Track unique users for connection display
      const uniqueUsers = new Set<string>();
      data.forEach((moment: Moment) => {
        uniqueUsers.add(moment.anonymousId);
        moment.replies.forEach((reply: Reply) => {
          uniqueUsers.add(reply.anonymousId);
        });
      });
      setActiveUsers(uniqueUsers);

      // Check if we have new moments
      const hadNewMoments = data.length !== moments.length;
      setMoments(data);
      setLastUpdated(new Date());
      setIsConnected(true);

      // Animate moments in (only for new ones or first load)
      if (!silent || hadNewMoments) {
        setVisibleMoments([]);
        setTimeout(() => {
          data.forEach((moment: Moment, index: number) => {
            setTimeout(() => {
              setVisibleMoments((prev) => [...prev, moment.id]);
            }, index * 30);
          });
        }, 100);
      }
    } catch (err) {
      setIsConnected(false);
      if (!silent) {
        setError("Failed to connect to other users. Trying to reconnect...");
      }
      console.error("Error fetching moments:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoments();

    // More frequent auto-refresh for better connectivity
    const interval = setInterval(() => {
      if (autoRefreshEnabled) {
        fetchMoments(true); // Silent refresh
      }
    }, refreshInterval * 1000);

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      fetch("/api/ping")
        .then(() => setIsConnected(true))
        .catch(() => setIsConnected(false));
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(connectionCheck);
    };
  }, [autoRefreshEnabled, refreshInterval]);

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

  const handleSaveDisplayName = () => {
    const newName = tempDisplayName.trim() || "Anonymous User";
    setDisplayName(newName);
    saveDisplayName(newName);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setTempDisplayName(displayName);
    setIsEditingName(false);
  };

  const postMoment = async () => {
    if (!text.trim()) return;

    setIsPosting(true);
    setError(null);

    try {
      const momentData: CreateMomentRequest = {
        text: text.trim(),
        image: image || undefined,
        anonymousId,
        displayName,
      };

      const response = await fetch("/api/moments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(momentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post moment");
      }

      const newMoment = await response.json();

      // Add the new moment to the top of the list
      setMoments((prev) => [newMoment, ...prev]);
      setVisibleMoments((prev) => [newMoment.id, ...prev]);

      setText("");
      removeImage();
      setShowSuccess(true);
      setIsConnected(true);

      setTimeout(() => setShowSuccess(false), 2000);

      // Refresh to get latest from all users
      setTimeout(() => fetchMoments(true), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post moment");
      setIsConnected(false);
    } finally {
      setIsPosting(false);
    }
  };

  const deleteMoment = async (momentId: string) => {
    try {
      setError(null);
      const deleteData: DeleteMomentRequest = {
        anonymousId,
      };

      const response = await fetch(`/api/moments/${momentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete moment");
      }

      // Remove from visible moments first (animation)
      setVisibleMoments((prev) => prev.filter((id) => id !== momentId));

      // Remove from moments list after animation
      setTimeout(() => {
        setMoments((prev) => prev.filter((m) => m.id !== momentId));
      }, 300);

      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete moment");
      setIsConnected(false);
    }
  };

  const postReply = async (momentId: string) => {
    if (!replyText.trim()) return;

    setIsPostingReply(true);
    setError(null);

    try {
      const replyData: CreateReplyRequest = {
        text: replyText.trim(),
        anonymousId,
        displayName,
        momentId,
      };

      const response = await fetch("/api/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(replyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post reply");
      }

      const newReply = await response.json();

      // Update the moment with the new reply
      setMoments((prev) =>
        prev.map((moment) =>
          moment.id === momentId
            ? {
                ...moment,
                replies: [...moment.replies, newReply],
                replyCount: moment.replyCount + 1,
              }
            : moment,
        ),
      );

      // Auto-expand replies to show the new reply
      setExpandedReplies((prev) => new Set([...prev, momentId]));

      setReplyText("");
      setReplyingTo(null);
      setShowReplySuccess(true);
      setIsConnected(true);

      setTimeout(() => setShowReplySuccess(false), 2000);

      // Refresh to get latest replies from all users
      setTimeout(() => fetchMoments(true), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
      setIsConnected(false);
    } finally {
      setIsPostingReply(false);
    }
  };

  const deleteReply = async (replyId: string, momentId: string) => {
    try {
      setError(null);
      const deleteData: DeleteReplyRequest = {
        anonymousId,
      };

      const response = await fetch(`/api/replies/${replyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete reply");
      }

      // Remove the reply from the moment
      setMoments((prev) =>
        prev.map((moment) =>
          moment.id === momentId
            ? {
                ...moment,
                replies: moment.replies.filter((reply) => reply.id !== replyId),
                replyCount: Math.max(0, moment.replyCount - 1),
              }
            : moment,
        ),
      );

      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete reply");
      setIsConnected(false);
    }
  };

  const toggleReplies = (momentId: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(momentId)) {
        newSet.delete(momentId);
      } else {
        newSet.add(momentId);
      }
      return newSet;
    });
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

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 5) return "Just updated";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingParticles />

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-600 opacity-10" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {/* Header with Connection Status */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Moments
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Share your moments and connect with others
          </p>

          {/* Connection Status & Stats */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-xs ${isConnected ? "text-green-600" : "text-red-600"}`}
              >
                {isConnected ? "Connected" : "Reconnecting..."}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600">
                {activeUsers.size} {activeUsers.size === 1 ? "user" : "users"}{" "}
                active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-600">
                {moments.length} moments shared
              </span>
            </div>
          </div>

          {/* Refresh Controls */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchMoments()}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh Now
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`text-xs ${autoRefreshEnabled ? "text-green-600" : "text-gray-500"}`}
            >
              <Clock className="w-4 h-4 mr-1" />
              Auto: {autoRefreshEnabled ? "ON" : "OFF"}
            </Button>

            <span className="text-xs text-gray-500">
              • Updated {formatLastUpdated()}
            </span>
          </div>

          {/* Auto-refresh interval control */}
          {autoRefreshEnabled && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Refresh every:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-xs bg-transparent border border-gray-300 rounded px-2 py-1"
              >
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
              </select>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-slide-down">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchMoments()}
              className="mt-2 text-xs"
            >
              Try Reconnecting
            </Button>
          </div>
        )}

        {/* Success Messages */}
        {showSuccess && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Moment shared with everyone!
            </div>
          </div>
        )}

        {showReplySuccess && (
          <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
            <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Reply shared!
            </div>
          </div>
        )}

        {/* Post Form */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-slide-up">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {anonymousId.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={tempDisplayName}
                        onChange={(e) => setTempDisplayName(e.target.value)}
                        className="text-sm"
                        placeholder="Enter display name"
                        maxLength={20}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveDisplayName}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {displayName}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingName(true);
                          setTempDisplayName(displayName);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      {isConnected && (
                        <Badge
                          variant="outline"
                          className="text-xs text-green-600"
                        >
                          Connected
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Textarea
                placeholder="What's on your mind? Share your moment with everyone..."
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 280))}
                className="min-h-[100px] border-0 bg-gray-50 dark:bg-gray-700 resize-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{text.length}/280</span>
                {activeUsers.size > 1 && (
                  <span className="text-xs">
                    Will be shared with {activeUsers.size - 1} other
                    {activeUsers.size === 2 ? "" : "s"}
                  </span>
                )}
              </div>

              {image && (
                <div className="relative animate-scale-in">
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
                  disabled={!text.trim() || isPosting || !isConnected}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isPosting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sharing...
                    </div>
                  ) : !isConnected ? (
                    "Connecting..."
                  ) : (
                    "Share with Everyone"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Connecting to other users...</p>
          </div>
        )}

        {/* Moments Feed */}
        {!isLoading && (
          <div className="space-y-6">
            {moments.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-800/60 animate-fade-in">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isConnected ? "No moments shared yet" : "Connecting..."}
                    </h3>
                    <p>
                      {isConnected
                        ? "Be the first to share a moment with everyone!"
                        : "Trying to connect to other users..."}
                    </p>
                    {!isConnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchMoments()}
                        className="mt-4"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Connection
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              moments.map((moment, index) => (
                <Card
                  key={moment.id}
                  className={`border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${
                    visibleMoments.includes(moment.id)
                      ? "animate-slide-up opacity-100"
                      : "opacity-0"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-6">
                    {/* Moment Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {moment.anonymousId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {moment.displayName || "Anonymous User"}
                            {moment.anonymousId === anonymousId ? (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs"
                              >
                                Connected User
                              </Badge>
                            )}
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

                    {/* Moment Content */}
                    <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                      {moment.text}
                    </p>

                    {moment.image && (
                      <img
                        src={moment.image}
                        alt="Moment"
                        className="w-full h-64 object-cover rounded-lg mb-4"
                      />
                    )}

                    {/* Moment Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(moment.id)}
                        className="text-gray-600 hover:text-purple-600"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Reply
                      </Button>

                      {moment.replyCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReplies(moment.id)}
                          className="text-gray-600 hover:text-blue-600"
                        >
                          {expandedReplies.has(moment.id) ? (
                            <ChevronUp className="w-4 h-4 mr-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 mr-2" />
                          )}
                          {moment.replyCount}{" "}
                          {moment.replyCount === 1 ? "reply" : "replies"}
                        </Button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === moment.id && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-slide-down">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {anonymousId.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <Textarea
                              placeholder={`Reply to ${moment.displayName}...`}
                              value={replyText}
                              onChange={(e) =>
                                setReplyText(e.target.value.slice(0, 280))
                              }
                              className="min-h-[80px] border-0 bg-white dark:bg-gray-600 resize-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">
                                {replyText.length}/280
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => postReply(moment.id)}
                                  disabled={
                                    !replyText.trim() ||
                                    isPostingReply ||
                                    !isConnected
                                  }
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {isPostingReply ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {expandedReplies.has(moment.id) &&
                      moment.replies.length > 0 && (
                        <div className="mt-4 space-y-3 animate-slide-down">
                          {moment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-blue-500/30"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {reply.anonymousId
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      {reply.displayName}
                                      {reply.anonymousId === anonymousId ? (
                                        <Badge
                                          variant="outline"
                                          className="ml-2 text-xs"
                                        >
                                          You
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2 text-xs"
                                        >
                                          Connected
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimestamp(reply.timestamp)}
                                    </div>
                                  </div>
                                </div>

                                {reply.anonymousId === anonymousId && (
                                  <Button
                                    onClick={() =>
                                      deleteReply(reply.id, moment.id)
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                                {reply.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
