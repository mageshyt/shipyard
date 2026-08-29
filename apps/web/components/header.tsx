"use client";

import Link from "next/link";
import { ThemeToggle } from "@workspace/ui/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border dark:border-white/10 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Web App
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Starter Kit
              </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Tech Stack", "Docs"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
            <div className="pl-4 border-l border-border flex items-center gap-3">
              <ThemeToggle />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                Sign In
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
