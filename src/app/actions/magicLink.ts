"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { headers } from "next/headers";

export async function generateMagicLink(formData: FormData) {
    // Vérifie si l'utilisateur est connecté
    const response = await auth.api.getSession({
        headers: await headers(),
    });
    if (!response?.user) {
        return {
            error: "Utilisateur non connecté",
        };
    }

    const senderId = response?.user?.id;

    const username = formData.get("username") as string;

    const user = await prisma.user.findFirst({
        where: {
            name: username,
        },
    });
    if (!user) {
        return {
            error: "Utilisateur introuvable",
        };
    }

    // Génère un token sécurisé
    const token = randomBytes(32).toString("hex");

    // Dans une implémentation réelle, nous devrions:
    // 1. Stocker le token en base de données avec le nom d'utilisateur et une date d'expiration
    // 2. L'associer à l'utilisateur courant (créateur)

    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;

    // Enregistrer le lien magique dans la base de données
    await prisma.magicLink.create({
        data: {
            token,
            targetUserId: user.id,
            createdById: senderId,
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 heure d'expiration
        },
    });

    return {
        success: true,
        username,
        magicLink,
    };
}
