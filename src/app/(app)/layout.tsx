import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";
import { Bell } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
    const response = await auth.api.getSession({
        headers: await headers(),
    });

    if (!response?.user) {
        redirect("/login");
    }

    const user = response.user;
    return (
        <div className="min-h-screen flex flex-col ">
            <header className="border-b border-border bg-card fixed top-0 left-0 right-0 z-50 shadow-sm">
                <nav className="container mx-auto px-8 py-3 flex justify-between items-center ">
                    <Image src={"/logo.svg"} alt="Logo" width={200} height={200} className="h-10" />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                            <Bell className="h-8 w-8 bg-[#219374 rounded-full p-2" />
                        </div>
                    </div>
                </nav>
            </header>
            <main className="flex-grow container mx-auto px-4 py-8 mt-16">{children}</main>
        </div>
    );
}
