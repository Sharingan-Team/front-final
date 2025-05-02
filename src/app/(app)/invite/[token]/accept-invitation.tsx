"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckIcon, LockIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "./actions";
import { LoaderCircle } from "lucide-react";
import { Prisma, User } from "@/generated";
import { auth } from "@/lib/auth";

export default function AcceptInvitation({
    magicLink,
    currentUser,
}: {
    magicLink: Prisma.MagicLinkGetPayload<{
        include: {
            createdBy: true;
        };
    }>;
    currentUser: typeof auth.$Infer.Session.user;
}) {
    const router = useRouter();
    const [isAccepting, setIsAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setIsAccepting(true);
        setError(null);
        try {
            const result = await acceptInvitation(magicLink.token);

            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.channelId) {
                router.push(`/`);
            }
        } catch (err) {
            setError("Une erreur s'est produite. Veuillez réessayer.");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = () => {
        router.push("/");
    };

    return (
        <Card className="shadow-lg">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <LockIcon className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl">Invitation à rejoindre un canal sécurisé</CardTitle>
                <CardDescription>
                    Vous avez reçu une invitation pour établir un canal de communication sécurisé
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="bg-muted/40 p-4 rounded-lg flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                        <AvatarImage
                            src={`https://avatar.vercel.sh/${magicLink.createdBy.email}`}
                            alt={magicLink.createdBy.name}
                        />
                        <AvatarFallback>{magicLink.createdBy.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <h3 className="font-medium">{magicLink.createdBy.name}</h3>
                        <p className="text-sm text-muted-foreground">{magicLink.createdBy.email}</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                            Invitation envoyée le {new Date(magicLink.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="text-sm space-y-2">
                    <p>
                        En acceptant cette invitation, vous allez créer un canal de communication sécurisé avec{" "}
                        <span className="font-semibold">{magicLink.createdBy.name}</span>.
                    </p>
                    <p>Tous les messages et fichiers échangés dans ce canal seront chiffrés de bout en bout.</p>
                </div>

                {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}
            </CardContent>

            <CardFooter className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleDecline} disabled={isAccepting}>
                    <XIcon className="mr-2 h-4 w-4" />
                    Décliner
                </Button>
                <Button onClick={handleAccept} disabled={isAccepting}>
                    {isAccepting ? (
                        <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Traitement...
                        </>
                    ) : (
                        <>
                            <CheckIcon className="mr-2 h-4 w-4" />
                            Accepter l'invitation
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
