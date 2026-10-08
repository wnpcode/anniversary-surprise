import seedData from "@/data/anniversaries.seed.json";

export type Memory = {
  label: string;
  copy: string;
};

export type AlbumPhoto = {
  src: string;
  alt: string;
  caption?: string;
};

export type Anniversary = {
  slug: string;
  year: number;
  dateLabel: string;
  eyebrow: string;
  headlineLead: string;
  headlineEmphasis: string;
  intro: string;
  memories: Memory[];
  photos: AlbumPhoto[];
  conversationPrompt: string;
  letter: string;
  signoff: string;
};

export const initialAnniversaries = seedData satisfies Anniversary[];
