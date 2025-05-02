"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, HomeIcon, RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface BadRequestProps {
    title?: string;
    message?: string;
    code?: number;
    showRefresh?: boolean;
    showHome?: boolean;
}

export function BadRequest({
    title = "Requête invalide",
    message = "La requête n'a pas pu être traitée. Veuillez vérifier les informations fournies et réessayer.",
    code = 400,
    showRefresh = true,
    showHome = true,
}: BadRequestProps) {
    const router = useRouter();

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        router.push("/");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-6">
                <AlertTriangleIcon className="h-10 w-10 text-destructive" />
            </div>

            <h1 className="text-3xl font-bold mb-2">
                {title}
                {code && <span className="text-muted-foreground ml-2">({code})</span>}
            </h1>

            <p className="text-muted-foreground mb-8 max-w-md">{message}</p>

            <div className="flex flex-col sm:flex-row gap-4">
                {showRefresh && (
                    <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
                        <RefreshCwIcon className="h-4 w-4" />
                        <span>Réessayer</span>
                    </Button>
                )}

                {showHome && (
                    <Button onClick={handleGoHome} className="flex items-center gap-2">
                        <HomeIcon className="h-4 w-4" />
                        <span>Retour à l'accueil</span>
                    </Button>
                )}
            </div>
        </div>
    );
}

export default BadRequest;
