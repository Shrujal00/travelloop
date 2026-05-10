export const COMMUNITY_TOPICS = [
  "General",
  "Food",
  "Culture",
  "Outdoors",
  "Budget tips",
  "Transport",
  "Stay",
] as const;

export type CommunityTopic = (typeof COMMUNITY_TOPICS)[number];
