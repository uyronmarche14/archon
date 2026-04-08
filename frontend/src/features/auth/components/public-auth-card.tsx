"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

type PublicAuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerHref: string;
  footerLabel: string;
  footerText: string;
};

export function PublicAuthCard({
  eyebrow,
  title,
  description,
  children,
  footerHref,
  footerLabel,
  footerText,
}: PublicAuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,rgba(44,62,255,0.05),transparent_28%),linear-gradient(135deg,rgba(28,46,190,0.08),transparent_52%),var(--background)] px-4 py-6">
      <section className="w-full max-w-md rounded-[8px] border border-border/70 bg-card px-5 py-7 shadow-[0_24px_80px_rgba(32,44,120,0.12)] sm:px-7 sm:py-8">
        <div className="mb-7 space-y-4 text-center">
          <div className="mx-auto flex w-fit items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Archon</p>
              <p className="text-xs text-muted-foreground">Project delivery</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.26em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {footerLabel}{" "}
              <Link className="font-semibold text-primary hover:underline" href={footerHref}>
                {footerText}
              </Link>
            </p>
          </div>
        </div>

        {children}
      </section>
    </main>
  );
}
