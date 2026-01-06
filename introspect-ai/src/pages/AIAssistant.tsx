import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Bot, Send, Paperclip, Loader2, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    image?: string; // Preview URL
}

export default function AIAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I am the AegisML Expert Assistant. Ask me anything about this platform, drift detection, or upload a dashboard screenshot for analysis."
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !imageFile) || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            image: imagePreview || undefined
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setImageFile(null);
        setImagePreview(null);
        setIsLoading(true);

        try {
            const res = await api.chatWithAssistant(userMsg.content, imageFile || undefined);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: res.response
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (e: any) {
            console.error(e);
            let detail = "Connection error. Please check backend.";
            if (e.response && e.response.data) {
                detail = e.response.data.detail || e.response.data.response || JSON.stringify(e.response.data);
            } else if (e.message) {
                detail = e.message;
            }
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Error: ${detail}`
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] space-y-4">
            <PageHeader
                title="AI Assistant"
                description="Expert guidance on the AegisML Platform."
                icon={Bot}
            />

            <Card className="flex-1 flex flex-col overflow-hidden bg-muted/10 p-4">
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4 pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <Avatar className="h-8 w-8">
                                    {msg.role === "assistant" ? (
                                        <div className="bg-primary h-full w-full flex items-center justify-center text-primary-foreground">
                                            <Bot size={16} />
                                        </div>
                                    ) : (
                                        <div className="bg-secondary h-full w-full flex items-center justify-center">
                                            <User size={16} />
                                        </div>
                                    )}
                                </Avatar>

                                <div className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div
                                        className={`rounded-lg p-3 text-sm ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted border border-border"
                                            }`}
                                    >
                                        {msg.image && (
                                            <img
                                                src={msg.image}
                                                alt="User upload"
                                                className="max-w-[200px] mb-2 rounded-md border border-white/20"
                                            />
                                        )}
                                        {msg.role === "assistant" ? (
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p>{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="bg-primary h-8 w-8 rounded-full flex items-center justify-center text-primary-foreground">
                                    <Bot size={16} />
                                </div>
                                <div className="bg-muted border border-border rounded-lg p-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="mt-4 pt-4 border-t flex gap-2 items-end">
                    <div className="flex-1 flex flex-col gap-2">
                        {imagePreview && (
                            <div className="relative inline-block w-fit">
                                <img src={imagePreview} className="h-20 rounded-md border" alt="Preview" />
                                <button
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 h-5 w-5 flex items-center justify-center text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload Screenshot"
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                            <Input
                                placeholder="Details about specific metrics..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                disabled={isLoading}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <Button onClick={handleSend} disabled={isLoading || (!input && !imageFile)}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
