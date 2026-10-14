"use client";

import { toast } from "sonner";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useAppStore, type View } from "@/lib/store";
import { Logo } from "@/components/app/bits";

const COLUMNS: { heading: string; links: { label: string; view?: View }[] }[] = [
  {
    heading: "Company",
    links: [
      { label: "Browse", view: "browse" },
      { label: "About NOVA" },
      { label: "Careers" },
      { label: "Press" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center" },
      { label: "Plans & Devices", view: "plans" },
      { label: "Contact Us" },
      { label: "Accessibility" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Use" },
      { label: "Privacy Policy" },
      { label: "Cookie Preferences" },
      { label: "Corporate Information" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "New & Popular", view: "browse" },
      { label: "Movies", view: "movies" },
      { label: "Series", view: "series" },
      { label: "My List", view: "mylist" },
    ],
  },
];

const SOCIALS = [
  { icon: Facebook, label: "NOVA on Facebook" },
  { icon: Twitter, label: "NOVA on Twitter" },
  { icon: Instagram, label: "NOVA on Instagram" },
  { icon: Youtube, label: "NOVA on YouTube" },
];

export function Footer() {
  const setView = useAppStore((s) => s.setView);

  return (
    <footer className="mt-auto border-t border-white/5 bg-black/50 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <Logo size="lg" />
          <ul className="flex items-center gap-2" aria-label="Social media">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <button
                  type="button"
                  aria-label={s.label}
                  onClick={() => toast.info("Coming soon to NOVA")}
                  className="flex size-11 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-rose-500/50 hover:text-rose-400"
                >
                  <s.icon aria-hidden className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() =>
                        link.view
                          ? setView(link.view)
                          : toast.info("Coming soon to NOVA")
                      }
                      className="text-sm text-zinc-400 transition hover:text-white"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-white/5 pt-6">
          <p className="text-xs leading-relaxed text-zinc-500">
            © {new Date().getFullYear()} NOVA Stream Beyond Limits. All rights
            reserved. NOVA is a demonstration streaming platform — all titles
            are sample content.
          </p>
        </div>
      </div>
    </footer>
  );
}
