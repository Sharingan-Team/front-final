import { prisma } from "@/lib/prisma";
import React from "react";
import BadRequest from "../../components/bad-request";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AcceptInvitation from "./accept-invitation";

const Page = async ({
    params,
}: {
    params: Promise<{
        token: string;
    }>;
}) => {
    const response = await auth.api.getSession({
        headers: await headers(),
    });
    if (!response?.user) {
        return (
            <BadRequest
                title="Authentification requise"
                message="Vous devez être connecté pour accéder à cette invitation."
                code={401}
            />
        );
    }

    const token = (await params).token;

    const magicLink = await prisma.magicLink.findFirst({
        where: {
            token,
        },
        include: {
            createdBy: true,
        },
    });

    // Vérification du magic link
    if (!magicLink) {
        return <BadRequest title="Lien invalide" message="Ce lien d'invitation n'existe pas ou a déjà été utilisé." />;
    }

    // Vérification que l'utilisateur correspond bien à la cible du magic link
    if (magicLink.targetUserId !== response.user.id) {
        return (
            <BadRequest
                title="Accès non autorisé"
                message="Cette invitation est destinée à un autre utilisateur."
                code={403}
            />
        );
    }

    // Vérification de l'expiration du token
    if (magicLink.expiresAt && new Date(magicLink.expiresAt) < new Date()) {
        // Marquer le lien comme expiré dans la base de données
        await prisma.magicLink.update({
            where: { id: magicLink.id },
            data: { used: true },
        });

        return (
            <BadRequest
                title="Lien expiré"
                message="Ce lien d'invitation a expiré. Veuillez demander un nouveau lien."
                showRefresh={false}
            />
        );
    }

    // Vérification si le lien a déjà été utilisé
    if (magicLink.used) {
        return (
            <BadRequest
                title="Lien déjà utilisé"
                message="Ce lien d'invitation a déjà été utilisé pour créer un canal."
                showRefresh={false}
            />
        );
    }

    // Vérification si un canal existe déjà entre ces deux utilisateurs
    const existingChannel = await prisma.channel.findFirst({
        where: {
            OR: [
                {
                    ownerId: magicLink.createdById,
                    guestId: response.user.id,
                },
                {
                    ownerId: response.user.id,
                    guestId: magicLink.createdById,
                },
            ],
        },
    });

    if (existingChannel) {
        // Marquer le lien comme utilisé puisqu'un canal existe déjà
        await prisma.magicLink.update({
            where: { id: magicLink.id },
            data: { used: true },
        });

        // Rediriger vers le canal existant
        return redirect(`/channel/${existingChannel.id}`);
    }

    // Si on arrive ici, le token est valide et peut être utilisé pour créer un canal
    return (
        <div className="max-w-3xl mx-auto mt-10">
            <AcceptInvitation magicLink={magicLink} currentUser={response.user} />
        </div>
    );
};

export default Page;
