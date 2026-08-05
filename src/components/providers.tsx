"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!bg-paper !text-ink !border-ink/10 !shadow-soft !rounded-lg",
        }}
      />
    </ThemeProvider>
  );
}
