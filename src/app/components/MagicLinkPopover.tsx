"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, Check, Copy, LinkIcon } from "lucide-react";
import { useState } from "react";
import { generateMagicLink } from "../actions/magicLink";

export function MagicLinkPopover() {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        success?: boolean;
        magicLink?: string;
        username?: string;
    } | null>(null);

    const handleGenerateMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);

        if (!username.trim()) {
            setError("Le nom d'utilisateur est requis");
            return;
        }

        try {
            setIsGenerating(true);
            const formData = new FormData();
            formData.append("username", username);
            const response = await generateMagicLink(formData);

            if (response.error) {
                setError(response.error);
                return;
            }

            setResult(response);
        } catch (err) {
            setError("Une erreur s'est produite");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (result?.magicLink) {
            navigator.clipboard.writeText(result.magicLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const closeAndReset = () => {
        setOpen(false);
        setTimeout(() => {
            setUsername("");
            setResult(null);
            setError(null);
        }, 200);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>Générer un Magic Link</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                {!result ? (
                    <>
                        <div className="space-y-4">
                            <h4 className="font-medium leading-none mb-2">Générer un Magic Link</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                Créez un lien sécurisé pour inviter un utilisateur à votre canal.
                            </p>
                            <form onSubmit={handleGenerateMagicLink} className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Nom d'utilisateur</Label>
                                    <Input
                                        id="username"
                                        placeholder="utilisateur@exemple.com"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button type="submit" className="w-full" disabled={isGenerating}>
                                    {isGenerating ? "Génération..." : "Générer"}
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium leading-none">Magic Link Généré</h4>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeAndReset}>
                                    &times;
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Pour l'utilisateur: <span className="font-medium">{result.username}</span>
                                </p>

                                <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                                    <Input readOnly value={result.magicLink} className="h-8 text-xs" />
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyToClipboard}>
                                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Ce lien est à usage unique et expirera après utilisation.
                                </p>
                            </div>

                            <Button variant="secondary" className="w-full" onClick={closeAndReset}>
                                Générer un autre lien
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
