
'use client';

import { ReactNode } from "react";
import Header from "@/components/Header";
import ScrollButtons from "@/components/ScrollButtons";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function PublicPageLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <ScrollButtons />
            <WhatsAppButton />
        </div>
    );
}
