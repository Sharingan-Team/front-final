"use server";

import { auth } from "@/lib/auth";
import { generateKeyPair } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function acceptInvitation(token: string) {
    try {
        // 1. Vérifier l'authentification de l'utilisateur actuel
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session?.user) {
            return { error: "Non autorisé. Veuillez vous connecter." };
        }

        // 2. Récupérer le magic link et vérifier qu'il est valide
        const magicLink = await prisma.magicLink.findUnique({
            where: { token: token },
            include: { createdBy: true },
        });

        if (!magicLink) {
            return { error: "Invitation non trouvée." };
        }

        if (magicLink.used) {
            return { error: "Cette invitation a déjà été utilisée." };
        }

        if (magicLink.targetUserId !== session.user.id) {
            return { error: "Cette invitation ne vous est pas destinée." };
        }

        if (magicLink.expiresAt && new Date(magicLink.expiresAt) < new Date()) {
            await prisma.magicLink.update({
                where: { token: token },
                data: { used: true },
            });
            return { error: "Cette invitation a expiré." };
        }

        // 3. Vérifier qu'il n'y a pas déjà un canal entre ces utilisateurs
        const existingChannel = await prisma.channel.findFirst({
            where: {
                OR: [
                    {
                        ownerId: magicLink.createdById,
                        guestId: session.user.id,
                    },
                    {
                        ownerId: session.user.id,
                        guestId: magicLink.createdById,
                    },
                ],
            },
        });

        if (existingChannel) {
            // Marquer le lien comme utilisé
            await prisma.magicLink.update({
                where: { token: token },
                data: { used: true },
            });

            return {
                channelId: existingChannel.id,
                message: "Canal existant récupéré.",
            };
        }

        // 4. Générer une paire de clés pour le canal (idéalement, cela devrait être fait côté client)
        // Note: Dans une implémentation réelle du chiffrement de bout en bout, la génération de clés
        // devrait se faire côté client pour assurer la sécurité
        const { publicKey, privateKey } = await generateKeyPair();

        // 5. Créer le nouveau canal
        const newChannel = await prisma.channel.create({
            data: {
                ownerId: magicLink.createdById,
                guestId: session.user.id,
            },
        });

        // 6. Marquer le magic link comme utilisé
        await prisma.magicLink.update({
            where: { token: token },
            data: { used: true },
        });

        // 7. Retourner l'ID du nouveau canal
        return {
            channelId: newChannel.id,
            success: true,
        };
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return { error: "Une erreur s'est produite lors de la création du canal." };
    }
}
