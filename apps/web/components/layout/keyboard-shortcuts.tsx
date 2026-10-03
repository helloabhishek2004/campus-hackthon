"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "./sidebar-context";

export function KeyboardShortcutsHandler() {
  const router = useRouter();
  const { toggleSidebar, toggleCommandPalette, isCommandPaletteOpen, setCommandPaletteOpen } = useSidebar();
  const pendingPrefixRef = useRef<string | null>(null);
  const prefixTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.getAttribute("role") === "textbox");

      // Global Command Palette shortcut: Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Sidebar toggle shortcut: Cmd+B / Ctrl+B
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // If command palette is open, let CommandPalette component handle arrow keys / enter
      if (isCommandPaletteOpen) {
        return;
      }

      // Do NOT trigger single-key chords if user is typing in an input
      if (isInputFocused) {
        return;
      }

      // Sidebar toggle via '['
      if (e.key === "[") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // '?' opens command palette / shortcuts
      if (e.key === "?") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Two-key navigation chord (G then <key>)
      const key = e.key.toLowerCase();
      if (pendingPrefixRef.current === "g") {
        // Clear pending prefix
        if (prefixTimeoutRef.current) {
          clearTimeout(prefixTimeoutRef.current);
        }
        pendingPrefixRef.current = null;

        if (key === "h") {
          e.preventDefault();
          router.push("/home");
        } else if (key === "d") {
          e.preventDefault();
          router.push("/documents");
        } else if (key === "c") {
          e.preventDefault();
          router.push("/complaints");
        } else if (key === "l") {
          e.preventDefault();
          router.push("/lost-and-found");
        } else if (key === "e") {
          e.preventDefault();
          router.push("/emergency");
        } else if (key === "f") {
          e.preventDefault();
          router.push("/faculty");
        } else if (key === "p") {
          e.preventDefault();
          router.push("/profile");
        } else if (key === "s") {
          e.preventDefault();
          router.push("/settings");
        }
        return;
      }

      // Start "g" prefix chord
      if (key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        pendingPrefixRef.current = "g";
        // Timeout chord after 1.5 seconds if second key is not pressed
        if (prefixTimeoutRef.current) {
          clearTimeout(prefixTimeoutRef.current);
        }
        prefixTimeoutRef.current = setTimeout(() => {
          pendingPrefixRef.current = null;
        }, 1500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (prefixTimeoutRef.current) {
        clearTimeout(prefixTimeoutRef.current);
      }
    };
  }, [router, toggleSidebar, toggleCommandPalette, isCommandPaletteOpen, setCommandPaletteOpen]);

  return null;
}
