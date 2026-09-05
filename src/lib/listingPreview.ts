export const PREVIEW_STORAGE_KEY = "bidboard-preview";

export type ListingPreview = {
  url: string;
  uniqueKey: string;
  title: string;
  description: string;
  logoUrl: string;
  category: string;
  subcategory: string | null;
  states: string[];
  confident: {
    category: boolean;
    subcategory: boolean;
    states: boolean;
  };
  scraped: boolean;
  existing: { bidCents: number } | null;
  amountCents: number;
};
