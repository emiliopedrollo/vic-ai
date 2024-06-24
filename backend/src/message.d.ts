export interface Message {
  role: "system" | "user" | "assistant",
  content: string,
  metadata?: Record<string, string>|null
}
