"use client";
import { Experience } from "@/components/Experience";
import { ChatProvider } from "@/hooks/useChat";
import { Leva } from "leva";

export default function LearnPage() {
  return (
    <main className="h-screen min-h-screen">
      <ChatProvider>
        <Leva hidden/>
        <Experience />
      </ChatProvider>
    </main>
  );
}
