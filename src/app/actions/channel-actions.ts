"use server";

import { prisma } from "@/lib/prisma";
import { appendFile, appendFileSync, writeFileSync } from "fs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "path";

/**
 * Envoie un message dans un canal
 */
export async function sendMessage(formData: FormData) {
    try {
        const content = formData.get("content") as string;
        const channelId = formData.get("channelId") as string;
        const senderId = formData.get("senderId") as string;

        if (!content?.trim() || !channelId || !senderId) {
            return { error: "Tous les champs requis ne sont pas remplis" };
        }

        const message = await prisma.message.create({
            data: {
                // Note: Dans une app réelle, ce contenu serait chiffré côté client
                encryptedContent: content,
                channelId: Number(channelId),
                senderId,
            },
        });

        revalidatePath("/");
        return { success: true, message };
    } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        return { error: "Échec de l'envoi du message" };
    }
}

/**
 * Télécharge un fichier et l'associe à un canal
 */
export async function uploadFile(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        const channelId = formData.get("channelId") as string;
        const uploaderId = formData.get("uploaderId") as string;

        if (!file || !channelId || !uploaderId) {
            return { error: "Fichier ou informations manquantes" };
        }

        // Ecrire le fichier sur le serveur
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.name);
        const baseName = path.basename(file.name, ext);
        const filename = `${baseName}-${uniqueSuffix}${ext}`; // Générer un nom de fichier unique
        const filePath = path.join(process.cwd(), "public", "uploads", filename); // Exemple de chemin, à adapter selon votre structure de projet

        // Lire le contenu du fichier et l'écrire sur le disque
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        appendFileSync(filePath, buffer);

        // Pour cet exemple, nous stockons seulement les métadonnées du fichier
        const fileData = await prisma.file.create({
            data: {
                filename: file.name,
                size: file.size,
                mimeType: file.type,
                channelId: Number(channelId),
                uploaderId,
                url: `/uploads/${filename}`, // URL d'accès au fichier
            },
        });

        revalidatePath("/");
        // Redirige vers la page d'accueil après le téléchargement
        return { success: true, file: fileData };
    } catch (error) {
        console.error("Erreur lors du téléchargement du fichier:", error);
        return { error: "Échec du téléchargement du fichier" };
    }
}
