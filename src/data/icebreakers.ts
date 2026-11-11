export interface IcebreakerPrompt { id: string; text: string; audience: "all" | "clinical" | "education" | "college" }

export const ICEBREAKERS: IcebreakerPrompt[] = [
  { id: "ib1", audience: "all", text: "If you could teleport anywhere in the world right now for a vacation, where are we going?" },
  { id: "ib2", audience: "clinical", text: "What is your ultimate post-shift decompression ritual? Couch potato style or gym rescue?" },
  { id: "ib3", audience: "all", text: "What’s the absolute best snack hiding in your breakroom or office right now?" },
  { id: "ib4", audience: "education", text: "When you are not shaping minds or running the campus, what is your absolute favorite weekend escape?" },
  { id: "ib5", audience: "education", text: "If you could permanently ban one phrase from professional development day, what would it be?" },
  { id: "ib6", audience: "college", text: "If you could automatically pass or exempt yourself from one university bureaucracy task forever, what would it be?" },
];

export const promptById = (id: string) => ICEBREAKERS.find((p) => p.id === id);
