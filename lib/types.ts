export type Author = "guy" | "dan";
export type PostType = "text" | "quote" | "link";

export type Comment = {
  id: string;
  author: Author;
  time: string;
  body: string;
};

export type Post = {
  id: string;
  author: Author;
  type: PostType;
  time: string;
  body?: string;
  attribution?: string;
  title?: string;
  url?: string;
  excerpt?: string;
  source?: string;
  tags: string[];
  comments: Comment[];
};

export type Challenge = {
  title: string;
  body: string;
  started: string;
  ends: string;
  setBy: Author;
};

export const BROTHERS: Record<Author, { name: string; initial: string }> = {
  guy: { name: "Guy", initial: "G" },
  dan: { name: "Dan", initial: "D" },
};
