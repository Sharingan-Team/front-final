import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MagicLinkPopover } from "../components/MagicLinkPopover";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { DisplayChats } from "./components/display-chats";

export default async function Home() {
    const response = await auth.api.getSession({
        headers: await headers(),
    });

    const ownedChannels = await prisma.channel.findMany({
        where: {
            ownerId: response?.user?.id,
        },
        include: {
            guest: true,
            messages: true,
            owner: true,
            files: true,
        },
    });

    const sharedChannels = await prisma.channel.findMany({
        where: {
            guestId: response?.user?.id,
        },
        include: {
            guest: true,
            messages: true,
            owner: true,
            files: true,
        },
    });

    return (
        <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Canaux sécurisés</h1>
                <MagicLinkPopover />
            </div>

            <Card>
                {ownedChannels.length + sharedChannels.length == 0 ? (
                    <>
                        <CardHeader>
                            <CardTitle>Bienvenue sur PrismaSecure</CardTitle>
                            <CardDescription>Créez et gérez vos canaux de communication sécurisés</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Pour démarrer un nouveau canal de communication sécurisé, utilisez le bouton "Générer un
                                Magic Link" ci-dessus. Vous pourrez ensuite partager ce lien avec la personne que vous
                                souhaitez inviter.
                            </p>
                            <div className="mt-4 py-4 px-6 bg-muted/50 rounded-md">
                                <p className="italic text-sm text-muted-foreground">
                                    Aucun canal actif pour le moment. Cliquez sur "Générer un Magic Link" pour créer
                                    votre premier canal.
                                </p>
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle>Vos Canaux de Communication</CardTitle>
                            <CardDescription>
                                Consultez et gérez tous vos canaux de communication sécurisés
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="owned" className="w-full">
                                <TabsList className=" w-1/2">
                                    <TabsTrigger
                                        value="owned"
                                        className="flex p-4  focus:!bg-[#2194f3] focus-visible:!bg-[#2194f3] focus:!text-white items-center gap-2"
                                    >
                                        <ArrowRightIcon className="h-4 w-4" />
                                        <span>Canaux créés ({ownedChannels.length})</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="guest"
                                        className="flex p-4 focus:!bg-[#2194f3] focus-visible:!bg-[#2194f3] focus:!text-white  items-center gap-2"
                                    >
                                        <ArrowLeftIcon className="h-4 w-4" />
                                        <span>Canaux partagés ({sharedChannels.length})</span>
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="owned">
                                    <DisplayChats
                                        chats={ownedChannels}
                                        isOwner={true}
                                        currentUserId={response?.user?.id || ""}
                                    />
                                </TabsContent>
                                <TabsContent value="guest">
                                    <DisplayChats
                                        chats={sharedChannels}
                                        isOwner={false}
                                        currentUserId={response?.user?.id || ""}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}
