"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Prisma } from "@/generated";
import { cn } from "@/lib/utils";
import { FileIcon, Loader2, MessageSquare, PaperclipIcon, SendIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sendMessage, uploadFile } from "../../actions/channel-actions";

export type DetailedChannel = Prisma.ChannelGetPayload<{
    include: {
        files: true;
        guest: true;
        owner: true;
        messages: true;
    };
}>;

// Types pour les mises à jour optimistes
type OptimisticMessage = {
    id: string;
    encryptedContent: string;
    senderId: string;
    channelId: string | number;
    createdAt: Date;
    isOptimistic: true; // Marqueur pour identifier les messages optimistes
    pending: boolean;
    error?: boolean;
};

type OptimisticFile = {
    id: string;
    filename: string;
    size: number;
    mimeType: string;
    uploaderId: string;
    channelId: string | number;
    createdAt: Date;
    isOptimistic: true; // Marqueur pour identifier les fichiers optimistes
    pending: boolean;
    error?: boolean;
};

// Types unifiés pour la manipulation dans l'UI
type MessageWithOptimisticState = (DetailedChannel["messages"][0] & { isOptimistic?: undefined }) | OptimisticMessage;

type FileWithOptimisticState = (DetailedChannel["files"][0] & { isOptimistic?: undefined }) | OptimisticFile;

interface DisplayChatsProps {
    chats: DetailedChannel[];
    isOwner: boolean;
    currentUserId: string;
}

export function DisplayChats({ chats, isOwner, currentUserId }: DisplayChatsProps) {
    const [selectedChat, setSelectedChat] = useState<DetailedChannel | null>(chats.length > 0 ? chats[0] : null);
    const [newMessage, setNewMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // État pour les mises à jour optimistes
    const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
    const [optimisticFiles, setOptimisticFiles] = useState<OptimisticFile[]>([]);

    // Effet pour scroller vers le bas après l'ajout de nouveaux messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [optimisticMessages.length, selectedChat?.messages?.length]);

    // Effet pour nettoyer les optimistic updates quand on change de chat
    useEffect(() => {
        if (selectedChat) {
            // Ne conserver que les mises à jour optimistes du chat sélectionné
            setOptimisticMessages((prev) => prev.filter((m) => m.channelId === selectedChat.id));
            setOptimisticFiles((prev) => prev.filter((f) => f.channelId === selectedChat.id));
        }
    }, [selectedChat?.id]);

    // Sort messages by date and combine server messages with optimistic ones
    const getSortedMessages = (): MessageWithOptimisticState[] => {
        if (!selectedChat) return [];

        const serverMessages = selectedChat.messages || [];
        const optimisticForThisChannel = optimisticMessages.filter(
            (m) => m.channelId.toString() === selectedChat.id.toString()
        );

        const allMessages = [...serverMessages, ...optimisticForThisChannel];

        return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    // Sort files by date and combine server files with optimistic ones
    const getSortedFiles = (): FileWithOptimisticState[] => {
        if (!selectedChat) return [];

        const serverFiles = selectedChat.files || [];
        const optimisticForThisChannel = optimisticFiles.filter(
            (f) => f.channelId.toString() === selectedChat.id.toString()
        );

        const allFiles = [...serverFiles, ...optimisticForThisChannel];

        return allFiles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    // Utilitaire pour vérifier si un message est optimiste
    const isOptimisticMessage = (message: MessageWithOptimisticState): message is OptimisticMessage => {
        return "isOptimistic" in message && message.isOptimistic === true;
    };

    // Utilitaire pour vérifier si un fichier est optimiste
    const isOptimisticFile = (file: FileWithOptimisticState): file is OptimisticFile => {
        return "isOptimistic" in file && file.isOptimistic === true;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChat) return;

        const hasMessage = newMessage.trim().length > 0;
        const hasFile = selectedFile !== null;

        if (!hasMessage && !hasFile) return;

        setIsSubmitting(true);
        setError(null);

        const timestamp = new Date();
        const generateTempId = () => `temp_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

        try {
            // Étape 1: Envoyer le message si nécessaire
            if (hasMessage) {
                const tempMessageId = generateTempId();
                const messageContent = newMessage.trim();

                // Ajouter message optimiste
                const optimisticMessage: OptimisticMessage = {
                    id: tempMessageId,
                    encryptedContent: messageContent,
                    senderId: currentUserId,
                    channelId: selectedChat.id,
                    createdAt: timestamp,
                    isOptimistic: true,
                    pending: true,
                };

                // Ajouter immédiatement à l'UI
                setOptimisticMessages((prev) => [...prev, optimisticMessage]);

                // Réinitialiser le champ de texte
                setNewMessage("");

                // Envoyer au serveur
                const messageFormData = new FormData();
                messageFormData.append("content", messageContent);
                messageFormData.append("channelId", selectedChat.id.toString());
                messageFormData.append("senderId", currentUserId);

                const messageResult = await sendMessage(messageFormData);

                if (messageResult.error) {
                    // Marquer le message optimiste comme en erreur
                    setOptimisticMessages((prev) =>
                        prev.map((m) => (m.id === tempMessageId ? { ...m, error: true, pending: false } : m))
                    );
                    setError(messageResult.error);
                } else {
                    // Supprimer le message optimiste après un court délai
                    // pour assurer la synchronisation avec le serveur
                    setTimeout(() => {
                        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
                        router.refresh();
                    }, 500);
                }
            }

            // Étape 2: Envoyer le fichier si nécessaire
            if (hasFile && selectedFile) {
                const tempFileId = generateTempId();

                // Ajouter fichier optimiste
                const optimisticFile: OptimisticFile = {
                    id: tempFileId,
                    filename: selectedFile.name,
                    size: selectedFile.size,
                    mimeType: selectedFile.type,
                    uploaderId: currentUserId,
                    channelId: selectedChat.id,
                    createdAt: timestamp,
                    isOptimistic: true,
                    pending: true,
                };

                // Ajouter immédiatement à l'UI
                setOptimisticFiles((prev) => [...prev, optimisticFile]);

                // Réinitialiser le sélecteur de fichier
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                // Envoyer au serveur
                const fileFormData = new FormData();
                fileFormData.append("file", selectedFile);
                fileFormData.append("channelId", selectedChat.id.toString());
                fileFormData.append("uploaderId", currentUserId);

                const fileResult = await uploadFile(fileFormData);

                if (fileResult.error) {
                    // Marquer le fichier optimiste comme en erreur
                    setOptimisticFiles((prev) =>
                        prev.map((f) => (f.id === tempFileId ? { ...f, error: true, pending: false } : f))
                    );
                    setError(fileResult.error);
                } else {
                    // Supprimer le fichier optimiste après un court délai
                    // pour assurer la synchronisation avec le serveur
                    setTimeout(() => {
                        setOptimisticFiles((prev) => prev.filter((f) => f.id !== tempFileId));
                        router.refresh();
                    }, 500);
                }
            }
        } catch (err) {
            console.error("Erreur lors de l'envoi:", err);
            setError("Une erreur est survenue lors de l'envoi");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (chats.length === 0) {
        return (
            <div className="py-4 px-6 bg-muted/50 rounded-md text-center">
                <p className="italic text-sm text-muted-foreground">
                    {isOwner
                        ? "Vous n'avez pas encore créé de canaux. Utilisez 'Générer un Magic Link' pour commencer."
                        : "Aucun canal partagé avec vous pour le moment."}
                </p>
            </div>
        );
    }

    // Messages actuellement triés
    const currentMessages = getSortedMessages();
    const currentFiles = getSortedFiles();

    return (
        <div className="flex h-[calc(80vh-2rem)] border rounded-md overflow-hidden">
            {/* Left sidebar with chat list */}
            <div className="w-1/4 border-r bg-muted/20">
                <div className="p-3 border-b">
                    <h3 className="font-medium">
                        {isOwner ? "Vos canaux" : "Canaux partagés"} ({chats.length})
                    </h3>
                </div>
                <ScrollArea className="h-[calc(100%-3rem)]">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            className={cn(
                                "p-3 cursor-pointer hover:bg-muted transition-colors",
                                selectedChat?.id === chat.id ? "bg-muted" : ""
                            )}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage
                                        src={`https://avatar.vercel.sh/${
                                            isOwner ? chat.guest?.email : chat.owner?.email
                                        }`}
                                        alt={isOwner ? chat.guest?.name || "" : chat.owner?.name || ""}
                                    />
                                    <AvatarFallback>
                                        {(isOwner ? chat.guest?.name : chat.owner?.name)?.charAt(0) || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                        {isOwner ? chat.guest?.name : chat.owner?.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {chat.messages?.length || 0} message(s)
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </div>

            {/* Right main content area */}
            <div className="flex-1 flex flex-col h-full">
                {selectedChat && (
                    <>
                        {/* Chat header - Fixed at top */}
                        <div className="p-4 border-b flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage
                                        src={`https://avatar.vercel.sh/${
                                            isOwner ? selectedChat.guest?.email : selectedChat.owner?.email
                                        }`}
                                        alt={isOwner ? selectedChat.guest?.name || "" : selectedChat.owner?.name || ""}
                                    />
                                    <AvatarFallback>
                                        {(isOwner ? selectedChat.guest?.name : selectedChat.owner?.name)?.charAt(0) ||
                                            "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-medium">
                                        {isOwner ? selectedChat.guest?.name : selectedChat.owner?.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {isOwner ? "Invité" : "Propriétaire"} • Canal créé le{" "}
                                        {new Date(selectedChat.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages and files area - Scrollable */}
                        <div className="flex-1 flex flex-col overflow-hidden" ref={scrollAreaRef}>
                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-4 h-[300px]">
                                    {/* Messages */}
                                    {currentMessages.length > 0 ? (
                                        <div className="space-y-4 mb-6">
                                            {currentMessages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={cn(
                                                        "flex",
                                                        message.senderId ===
                                                            (isOwner ? selectedChat.ownerId : selectedChat.guestId)
                                                            ? "justify-end"
                                                            : "justify-start"
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "max-w-[70%] px-4 py-2  rounded-lg",
                                                            message.senderId ===
                                                                (isOwner ? selectedChat.ownerId : selectedChat.guestId)
                                                                ? "bg-[#2194f3] text-primary-foreground"
                                                                : "bg-muted",
                                                            isOptimisticMessage(message) &&
                                                                message.pending &&
                                                                "opacity-70",
                                                            isOptimisticMessage(message) &&
                                                                message.error &&
                                                                "bg-destructive/10 border border-destructive/20"
                                                        )}
                                                    >
                                                        <p>{message.encryptedContent}</p>
                                                        <div className="flex items-center justify-end gap-1 mt-1">
                                                            {isOptimisticMessage(message) && message.pending && (
                                                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                            )}
                                                            {isOptimisticMessage(message) && message.error && (
                                                                <span className="text-destructive text-xs">Échec</span>
                                                            )}
                                                            <span className="text-xs opacity-70">
                                                                {new Date(message.createdAt).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-32">
                                            <p className="text-muted-foreground text-sm">
                                                Aucun message dans ce canal. Soyez le premier à écrire !
                                            </p>
                                        </div>
                                    )}

                                    {/* Files section */}
                                    {currentFiles.length > 0 && (
                                        <>
                                            <Separator className="my-4" />
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                                    <FileIcon className="h-4 w-4" />
                                                    Fichiers partagés ({currentFiles.length})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {currentFiles.map((file) => (
                                                        <div
                                                            key={file.id}
                                                            className={cn(
                                                                "flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50 transition-colors",
                                                                isOptimisticFile(file) && file.pending && "opacity-70",
                                                                isOptimisticFile(file) &&
                                                                    file.error &&
                                                                    "bg-destructive/10 border-destructive/20",
                                                                !isOptimisticFile(file) && "cursor-pointer"
                                                            )}
                                                        >
                                                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm truncate flex-1">
                                                                {file.filename}
                                                            </span>
                                                            {isOptimisticFile(file) && file.pending && (
                                                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                            )}
                                                            {isOptimisticFile(file) && file.error && (
                                                                <span className="text-destructive text-xs">Échec</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Input area - Fixed at bottom */}
                        <div className="p-4 border-t shrink-0">
                            {error && (
                                <div className="mb-3 p-2 text-sm bg-destructive/10 text-destructive rounded-md">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="shrink-0"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSubmitting}
                                    >
                                        <PaperclipIcon className="h-5 w-5" />
                                    </Button>

                                    <Input
                                        placeholder="Écrivez votre message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-1"
                                        disabled={isSubmitting}
                                    />

                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="shrink-0 bg-[#2194f3]"
                                        disabled={isSubmitting || (!newMessage.trim() && !selectedFile)}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <SendIcon className="h-5 w-5" />
                                        )}
                                    </Button>
                                </div>

                                {/* Hidden file input */}
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    disabled={isSubmitting}
                                />

                                {/* File preview when selected */}
                                {selectedFile && (
                                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate flex-1">{selectedFile.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(selectedFile.size / 1024)} KB
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={handleClearFile}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </>
                )}

                {!selectedChat && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                            <p className="text-muted-foreground">
                                Sélectionnez un canal pour commencer la conversation
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
