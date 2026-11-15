import { z } from "zod";

export const assistantChatRequestSchema = z.object({
  pagePath: z.string().max(256).nullish().transform((path) => path ?? "/"),
  conversationId: z.string().min(1).max(64).nullish(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1, "Enter a message before sending.").max(8000, "A conversation message is too long. Start a new conversation."),
  })).min(1).max(12),
}).refine((input) => input.messages[input.messages.length - 1]?.role === "user", {
  message: "Send a user message to continue.",
}).refine((input) => (input.messages[input.messages.length - 1]?.content.length ?? 0) <= 2000, {
  message: "Your latest message must be 2,000 characters or fewer.",
});

export type AssistantChatMessage = z.infer<typeof assistantChatRequestSchema>["messages"][number];

export function limitAssistantChatHistory(messages: AssistantChatMessage[]) {
  const recent: AssistantChatMessage[] = [];
  let totalCharacters = 0;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (totalCharacters + message.content.length > 8000) break;
    recent.unshift(message);
    totalCharacters += message.content.length;
  }
  return recent;
}
