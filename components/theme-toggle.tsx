"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-neutral-400"
      >
        <Sun className="h-5 w-5 opacity-0" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-lg text-neutral-400 hover:bg-transparent!"
      aria-label="Toggle theme"
      id="theme-toggle-button"
    >
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all text-amber-400 hover:rotate-45 duration-300" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all text-neutral-200  hover:scale-110 duration-300" />
      )}
    </Button>
  );
}
