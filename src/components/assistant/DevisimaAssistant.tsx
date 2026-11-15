"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bot, Check, Copy, History, LoaderCircle, MessageCircle, RotateCcw, Send, Square, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { AssistantMarkdown } from "@/components/assistant/AssistantMarkdown";

type Message = { role: "user" | "assistant"; content: string };
type MessageFeedback = "up" | "down";
type ConversationSummary = { id: string; title: string; updatedAt: string };
type ConversationHistory = {
  conversations?: ConversationSummary[];
  activeConversation?: { id: string; title: string; updatedAt: string; messages: Message[] } | null;
  hasMore?: boolean;
  nextCursor?: string | null;
};

const welcome: Message = {
  role: "assistant",
  content: "Hi! I'm Devisima's assistant. Ask me anything about the marketplace, or anything else I can help with.",
};

class AssistantRequestError extends Error {}

async function fetchConversationHistory(url: string, signal: AbortSignal): Promise<ConversationHistory> {
  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { message?: unknown } | null;
    throw new AssistantRequestError(typeof result?.message === "string"
      ? result.message
      : "I couldn't load your saved conversations.");
  }
  return await response.json() as ConversationHistory;
}

function messagesForRequest(messages: Message[]) {
  const recent = messages.slice(-12);
  while (recent.length > 1 && recent.reduce((total, message) => total + message.content.length, 0) > 8000) {
    recent.shift();
  }
  return recent;
}

function suggestionsFor(pathname: string) {
  if (/^\/products\/[^/]+\/?$/.test(pathname)) {
    return [
      "What does this product include?",
      "What are its requirements?",
      "How much does it cost?",
      "What do buyers say about it?",
      "What technology does it use?",
      "How do I buy this?",
      "How do I save it for later?",
      "How do I leave a review?",
    ];
  }
  if (pathname === "/seller/earnings" || pathname === "/seller/payouts") {
    return [
      "How much can I withdraw?",
      "Why can't I withdraw my balance?",
      "What is my latest payout status?",
      "How do I request a payout?",
      "When will pending earnings be available?",
      "How do I add a payout account?",
      "How do I list a product for sale?",
    ];
  }
  if (pathname.startsWith("/purchases")) {
    return [
      "Where do I find my downloads?",
      "How do I download a purchased product?",
      "What if my purchase isn't showing?",
      "How do I leave a review?",
      "How do I get help with a purchase?",
      "How do I buy another product?",
    ];
  }
  return [
    "How do I find a product?",
    "How do I buy something?",
    "How do coupons work?",
    "Where do I find my downloads?",
    "How do I save a product for later?",
    "How do I become a seller?",
    "How do I list a product for sale?",
    "How do I leave a review?",
    "Where can I get help with an order?",
    "How do I update my account?",
  ];
}

export function DevisimaAssistant() {
  const { data: session, status: sessionStatus } = useSession();
  const sessionUserId = sessionStatus === "authenticated" ? session?.user?.id ?? null : null;
  const sessionKey = sessionStatus === "loading"
    ? "loading"
    : sessionUserId
      ? `account:${sessionUserId}`
      : sessionStatus === "authenticated" ? "invalid-account" : "guest";

  return <DevisimaAssistantPanel key={sessionKey} sessionStatus={sessionStatus} sessionUserId={sessionUserId} />;
}

function DevisimaAssistantPanel({
  sessionStatus,
  sessionUserId,
}: {
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  sessionUserId: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [conversationCursor, setConversationCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [memoryLoading, setMemoryLoading] = useState(Boolean(sessionUserId));
  const [historyError, setHistoryError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [copyErrorIndex, setCopyErrorIndex] = useState<number | null>(null);
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<number, MessageFeedback>>({});
  const [generationNotice, setGenerationNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestInFlightRef = useRef(false);
  const retryConversationRef = useRef<Message[] | null>(null);
  const retryConversationIdRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const requestGenerationRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const historyAbortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const suggestions = suggestionsFor(pathname);

  function updateConversationId(value: string | null) {
    activeConversationIdRef.current = value;
    setConversationId(value);
  }

  async function loadAccountHistory() {
    const controller = new AbortController();
    historyAbortControllerRef.current?.abort();
    historyAbortControllerRef.current = controller;
    setMemoryLoading(true);
    setHistoryError("");
    try {
      const result = await fetchConversationHistory("/api/ai/chat", controller.signal);
      if (!mountedRef.current || historyAbortControllerRef.current !== controller) return;
      const active = result.activeConversation ?? null;
      setConversations(Array.isArray(result.conversations) ? result.conversations : []);
      setHasMoreConversations(Boolean(result.hasMore));
      setConversationCursor(result.nextCursor ?? null);
      setHistoryError("");
      updateConversationId(active?.id ?? null);
      setMessages(active?.messages?.length ? active.messages : [welcome]);
    } catch (cause) {
      if (!mountedRef.current || historyAbortControllerRef.current !== controller) return;
      setHistoryError(cause instanceof Error
        ? cause.message
        : "I couldn't load your saved conversations. Please try again.");
      setConversations([]);
      updateConversationId(null);
      setMessages([welcome]);
    } finally {
      if (mountedRef.current && historyAbortControllerRef.current === controller) setMemoryLoading(false);
    }
  }

  async function openConversation(id: string) {
    setMemoryLoading(true);
    setHistoryError("");
    const controller = new AbortController();
    historyAbortControllerRef.current?.abort();
    historyAbortControllerRef.current = controller;
    try {
      const result = await fetchConversationHistory(`/api/ai/chat?conversationId=${encodeURIComponent(id)}`, controller.signal);
      if (!mountedRef.current || historyAbortControllerRef.current !== controller) return;
      const active = result.activeConversation ?? null;
      if (!active) throw new AssistantRequestError("That conversation could not be found.");
      setConversations((current) => {
        const summaries = new Map(current.map((item) => [item.id, item]));
        for (const item of result.conversations ?? []) summaries.set(item.id, item);
        summaries.set(active.id, { id: active.id, title: active.title, updatedAt: active.updatedAt });
        return [...summaries.values()].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
      });
      setHasMoreConversations(Boolean(result.hasMore));
      setConversationCursor(result.nextCursor ?? null);
      updateConversationId(active.id);
      setMessages(active.messages);
      shouldAutoScrollRef.current = true;
      setShowHistory(false);
      setError("");
      setGenerationNotice("");
      retryConversationRef.current = null;
      retryConversationIdRef.current = null;
      setCopiedMessageIndex(null);
      setCopyErrorIndex(null);
      setFeedbackByMessage({});
    } catch (cause) {
      if (mountedRef.current && historyAbortControllerRef.current === controller) {
        setHistoryError(cause instanceof Error ? cause.message : "I couldn't open that conversation.");
      }
    } finally {
      if (mountedRef.current && historyAbortControllerRef.current === controller) setMemoryLoading(false);
    }
  }

  async function loadMoreConversations() {
    if (!conversationCursor || memoryLoading) return;
    setMemoryLoading(true);
    setHistoryError("");
    const controller = new AbortController();
    historyAbortControllerRef.current?.abort();
    historyAbortControllerRef.current = controller;
    try {
      const result = await fetchConversationHistory(`/api/ai/chat?cursor=${encodeURIComponent(conversationCursor)}`, controller.signal);
      if (!mountedRef.current || historyAbortControllerRef.current !== controller) return;
      setConversations((current) => {
        const summaries = new Map(current.map((item) => [item.id, item]));
        for (const item of result.conversations ?? []) summaries.set(item.id, item);
        return [...summaries.values()].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
      });
      setHasMoreConversations(Boolean(result.hasMore));
      setConversationCursor(result.nextCursor ?? null);
    } catch (cause) {
      if (mountedRef.current && historyAbortControllerRef.current === controller) {
        setHistoryError(cause instanceof Error ? cause.message : "I couldn't load more conversations.");
      }
    } finally {
      if (mountedRef.current && historyAbortControllerRef.current === controller) setMemoryLoading(false);
    }
  }

  async function refreshConversationList() {
    const controller = new AbortController();
    historyAbortControllerRef.current?.abort();
    historyAbortControllerRef.current = controller;
    try {
      const result = await fetchConversationHistory("/api/ai/chat?listOnly=1", controller.signal);
      if (!mountedRef.current || historyAbortControllerRef.current !== controller) return;
      setConversations(Array.isArray(result.conversations) ? result.conversations : []);
      setHasMoreConversations(Boolean(result.hasMore));
      setConversationCursor(result.nextCursor ?? null);
      setHistoryError("");
    } catch (cause) {
      if (mountedRef.current && historyAbortControllerRef.current === controller) {
        setHistoryError(cause instanceof Error ? cause.message : "I couldn't refresh your conversations.");
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    if (sessionUserId) {
      const controller = new AbortController();
      historyAbortControllerRef.current = controller;
      const restoreHistory = async () => {
        try {
          const result = await fetchConversationHistory("/api/ai/chat", controller.signal);
          if (!mountedRef.current || historyAbortControllerRef.current !== controller) return;
          const active = result.activeConversation ?? null;
          setConversations(Array.isArray(result.conversations) ? result.conversations : []);
          setHasMoreConversations(Boolean(result.hasMore));
          setConversationCursor(result.nextCursor ?? null);
          updateConversationId(active?.id ?? null);
          setMessages(active?.messages?.length ? active.messages : [welcome]);
        } catch (cause) {
          if (!mountedRef.current || historyAbortControllerRef.current !== controller) return;
          setHistoryError(cause instanceof Error
            ? cause.message
            : "I couldn't load your saved conversations. Please try again.");
          setConversations([]);
          updateConversationId(null);
          setMessages([welcome]);
        } finally {
          if (mountedRef.current && historyAbortControllerRef.current === controller) setMemoryLoading(false);
        }
      };
      void restoreHistory();
    }
    return () => {
      mountedRef.current = false;
      requestGenerationRef.current += 1;
      abortControllerRef.current?.abort();
      historyAbortControllerRef.current?.abort();
    };
  }, [sessionUserId]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
  }, [draft, open]);

  useEffect(() => {
    if (!open) return;
    if (!shouldAutoScrollRef.current) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: pending ? "auto" : "smooth" });
  }, [open, messages, pending, error]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function resetConversation() {
    if (requestInFlightRef.current) return;
    shouldAutoScrollRef.current = true;
    setMessages([welcome]);
    setDraft("");
    setError("");
    setGenerationNotice("");
    setHistoryError("");
    setShowHistory(false);
    updateConversationId(null);
    retryConversationRef.current = null;
    retryConversationIdRef.current = null;
    setCopiedMessageIndex(null);
    setCopyErrorIndex(null);
    setFeedbackByMessage({});
  }

  async function copyResponse(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(index);
      setCopyErrorIndex(null);
    } catch {
      setCopiedMessageIndex(null);
      setCopyErrorIndex(index);
    }
  }

  function updateFeedback(index: number, feedback: MessageFeedback) {
    setFeedbackByMessage((current) => {
      const next = { ...current };
      if (next[index] === feedback) delete next[index];
      else next[index] = feedback;
      return next;
    });
  }

  function stopGenerating() {
    const controller = abortControllerRef.current;
    if (!controller || !requestInFlightRef.current) return;
    setGenerationNotice("Response stopped. The unfinished turn was discarded.");
    controller.abort();
  }

  async function requestAnswer(conversation: Message[], requestConversationId = activeConversationIdRef.current) {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    retryConversationRef.current = conversation;
    retryConversationIdRef.current = requestConversationId;
    const requestGeneration = requestGenerationRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setError("");
    setGenerationNotice("");
    setPending(true);
    setMessages([...conversation, { role: "assistant", content: "" }]);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagePath: pathname,
          ...(requestConversationId ? { conversationId: requestConversationId } : {}),
          messages: messagesForRequest(conversation),
        }),
        signal: controller.signal,
      });
      if (requestGeneration !== requestGenerationRef.current) return;
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { message?: unknown } | null;
        throw new AssistantRequestError(typeof result?.message === "string"
          ? result.message
          : "The assistant couldn't answer just now.");
      }
      if (!response.body) throw new AssistantRequestError("The assistant returned an empty response. Please try again.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      let completed = false;
      const processLine = (line: string) => {
        if (!line.trim()) return;
        if (requestGeneration !== requestGenerationRef.current) return;
        let payload: { delta?: unknown; done?: unknown; error?: unknown; conversationId?: unknown };
        try {
          payload = JSON.parse(line) as typeof payload;
        } catch {
          throw new AssistantRequestError("The assistant returned an invalid response. Please try again.");
        }
        if (typeof payload.error === "string") throw new AssistantRequestError(payload.error);
        if (typeof payload.delta === "string") {
          answer += payload.delta;
          setMessages([...conversation, { role: "assistant", content: answer }]);
        }
        if (payload.done === true) {
          completed = true;
          if (typeof payload.conversationId === "string") {
            updateConversationId(payload.conversationId);
            if (sessionUserId) void refreshConversationList();
          }
        }
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          lines.forEach(processLine);
        }
        buffer += decoder.decode();
        if (buffer.trim()) processLine(buffer);
      } finally {
        reader.releaseLock();
      }
      if (!completed || !answer.trim()) {
        throw new AssistantRequestError("The assistant couldn't finish that response. Please try again.");
      }
    } catch (cause) {
      if (requestGeneration === requestGenerationRef.current) {
        setMessages(conversation);
        if (controller.signal.aborted) {
          setError("");
        } else {
          setGenerationNotice("");
          setError(cause instanceof AssistantRequestError
            ? cause.message
            : "I couldn't connect to the assistant. Please try again shortly.");
        }
      }
    } finally {
      if (requestGeneration === requestGenerationRef.current) {
        requestInFlightRef.current = false;
        abortControllerRef.current = null;
        setPending(false);
      }
    }
  }

  async function sendMessage(value = draft) {
    const content = value.trim();
    const sessionReady = sessionStatus !== "loading"
      && (sessionStatus !== "authenticated" || Boolean(sessionUserId));
    if (!content || requestInFlightRef.current || memoryLoading || !sessionReady) return;
    const userMessage: Message = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    shouldAutoScrollRef.current = true;
    setMessages(nextMessages);
    setDraft("");
    setGenerationNotice("");
    await requestAnswer(nextMessages);
  }

  const sessionReady = sessionStatus !== "loading"
    && (sessionStatus !== "authenticated" || Boolean(sessionUserId));
  const visibleMessages = sessionReady ? messages : [welcome];

  return (
    <>
      {open && <section
        role="dialog"
        aria-modal="false"
        aria-labelledby="devisima-assistant-title"
        className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] top-16 z-[70] flex flex-col overflow-hidden rounded-3xl border border-[#dce6e1] bg-[#F7F5EF] shadow-2xl sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[400px]"
      >
        <header className="flex items-center justify-between gap-3 bg-[#0F4C5C] px-4 py-3.5 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-[#35D0BA]"><Bot className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h2 id="devisima-assistant-title" className="truncate text-sm font-semibold">Devisima Assistant</h2>
              <p className="mt-0.5 text-xs text-white/70">Here to help with Devisima</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {sessionStatus === "authenticated" && sessionUserId && <button type="button" onClick={() => setShowHistory((current) => !current)} disabled={pending || memoryLoading} aria-label="View previous conversations" title="Previous conversations" className="grid h-9 w-9 place-items-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] disabled:opacity-40"><History className="h-4 w-4" /></button>}
            <button type="button" onClick={resetConversation} disabled={pending || memoryLoading} aria-label="Start a new conversation" title="New conversation" className="grid h-9 w-9 place-items-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] disabled:opacity-40"><RotateCcw className="h-4 w-4" /></button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="grid h-9 w-9 place-items-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA]"><X className="h-5 w-5" /></button>
          </div>
        </header>

        <div
          ref={scrollRef}
          onScroll={(event) => {
            const element = event.currentTarget;
            shouldAutoScrollRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
          }}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
          aria-live="polite"
        >
          {showHistory ? <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#708076]">Previous conversations</p>
              <button type="button" onClick={() => setShowHistory(false)} className="text-xs font-medium text-[#0F4C5C] underline">Back to chat</button>
            </div>
            {historyError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800" role="alert">{historyError}<button type="button" onClick={() => { if (!sessionUserId) return; setMemoryLoading(true); setHistoryError(""); void loadAccountHistory(); }} className="ml-2 font-semibold underline">Try again</button></p>}
            {!conversations.length && !historyError && <p className="rounded-xl bg-white p-3 text-sm text-[#64736a]">No saved conversations yet.</p>}
            {conversations.map((conversation) => <button key={conversation.id} type="button" disabled={memoryLoading} onClick={() => void openConversation(conversation.id)} className={`block w-full rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] disabled:opacity-50 ${conversation.id === conversationId ? "border-[#35D0BA] bg-[#f4fbf8]" : "border-[#dce6e1] bg-white hover:border-[#35D0BA]"}`}>
              <span className="block truncate text-sm font-medium text-[#23453d]">{conversation.title}</span>
              <span className="mt-1 block text-[10px] text-[#829087]">{new Date(conversation.updatedAt).toLocaleString()}</span>
            </button>)}
            {hasMoreConversations && <button type="button" onClick={() => void loadMoreConversations()} disabled={memoryLoading} className="w-full rounded-xl border border-[#dce6e1] bg-white px-3 py-2.5 text-center text-xs font-medium text-[#0F4C5C] hover:border-[#35D0BA] disabled:opacity-50">{memoryLoading ? "Loading…" : "Show older conversations"}</button>}
          </div> : <div className="mx-auto w-full max-w-[42rem] space-y-6">
            {historyError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900" role="status">{historyError}</div>}
            {memoryLoading && <div className="flex items-center gap-2 text-sm text-[#64736a]" role="status"><LoaderCircle className="h-4 w-4 animate-spin text-[#0F4C5C]" />Restoring your conversations…</div>}
            {visibleMessages.map((message, index) => {
              const isStreamingMessage = pending && index === visibleMessages.length - 1 && message.role === "assistant" && message.content.length > 0;
              if (message.role === "assistant" && !message.content) return null;
              if (message.role === "user") {
                return <div key={`${index}-${message.role}`} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[#0F4C5C] px-4 py-2.5 text-sm leading-6 text-white [overflow-wrap:anywhere]">{message.content}</p>
                </div>;
              }
              const canShowActions = message.content.trim().length > 0 && !isStreamingMessage;
              return <div key={`${index}-${message.role}`} className="group flex w-full min-w-0 items-start gap-2.5">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0F4C5C]/10 text-[#0F4C5C]" aria-hidden="true"><Bot className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <AssistantMarkdown content={message.content} isStreaming={isStreamingMessage} />
                  {canShowActions && <div className="mt-1 flex min-h-7 flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void copyResponse(message.content, index)}
                      aria-label={copiedMessageIndex === index ? "Response copied" : "Copy response"}
                      title={copiedMessageIndex === index ? "Copied" : "Copy response"}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-[#71807b] transition hover:bg-[#e7f2ef] hover:text-[#0F4C5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA]"
                    >
                      {copiedMessageIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedMessageIndex === index ? "Copied" : "Copy"}
                    </button>
                    {copyErrorIndex === index && <span className="text-[11px] text-[#71807b]" role="status">Copy failed. Select the response to copy it.</span>}
                    <button
                      type="button"
                      onClick={() => updateFeedback(index, "up")}
                      aria-label="Helpful response"
                      aria-pressed={feedbackByMessage[index] === "up"}
                      title="Helpful"
                      className={`grid h-7 w-7 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] ${feedbackByMessage[index] === "up" ? "bg-[#e7f2ef] text-[#0F4C5C]" : "text-[#71807b] hover:bg-[#e7f2ef] hover:text-[#0F4C5C]"}`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFeedback(index, "down")}
                      aria-label="Unhelpful response"
                      aria-pressed={feedbackByMessage[index] === "down"}
                      title="Not helpful"
                      className={`grid h-7 w-7 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] ${feedbackByMessage[index] === "down" ? "bg-[#e7f2ef] text-[#0F4C5C]" : "text-[#71807b] hover:bg-[#e7f2ef] hover:text-[#0F4C5C]"}`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>}
                </div>
              </div>;
            })}
            {pending && (!visibleMessages[visibleMessages.length - 1]?.content) && <div className="flex items-center gap-2 pl-9 text-xs text-[#526468]" role="status"><span className="assistant-thinking-dots" aria-hidden="true"><span /><span /><span /></span>Thinking</div>}
            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800" role="alert">{error}<button type="button" onClick={() => { const conversation = retryConversationRef.current; if (conversation) void requestAnswer(conversation, retryConversationIdRef.current); }} disabled={pending} className="ml-2 font-semibold underline disabled:opacity-50">Retry</button></div>}
            {generationNotice && <p className="pl-9 text-xs text-[#526468]" role="status">{generationNotice}</p>}
            {visibleMessages.length === 1 && <div className="space-y-2 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#708076]">Suggested questions</p>
              {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="block w-full rounded-xl border border-[#dce6e1] bg-white px-3 py-2.5 text-left text-xs font-medium leading-5 text-[#23453d] transition hover:border-[#35D0BA] hover:bg-[#f4fbf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA]">{suggestion}</button>)}
            </div>}
          </div>}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="border-t border-[#e1e8e2] bg-white p-3">
          <label className="sr-only" htmlFor="devisima-assistant-message">Your message</label>
          <div className="flex items-end gap-2 rounded-2xl border border-[#dce6e1] bg-[#fbfcfa] p-2 transition-[border-color,box-shadow] duration-200 focus-within:border-[#35D0BA] focus-within:ring-2 focus-within:ring-[#35D0BA]/20">
            <textarea
              id="devisima-assistant-message"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Ask me anything…"
              className="max-h-28 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm leading-5 text-[#101820] outline-none placeholder:text-[#88948d]"
            />
            <button
              type={pending ? "button" : "submit"}
              onClick={pending ? stopGenerating : undefined}
              disabled={pending ? false : memoryLoading || !sessionReady || !draft.trim()}
              aria-label={pending ? "Stop generating" : "Send message"}
              title={pending ? "Stop generating" : "Send message"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0F4C5C] text-white transition hover:bg-[#176276] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA]"
            >
              {pending ? <Square className="h-3.5 w-3.5 fill-current" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] leading-4 text-[#829087]">Never share your password, bank details, or payment credentials here.</p>
        </form>
      </section>}

      <button
        type="button"
        aria-label={open ? "Close Devisima Assistant" : "Open Devisima Assistant"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="fixed right-4 z-[71] grid h-14 w-14 place-items-center rounded-full bg-[#0F4C5C] text-white shadow-xl shadow-[#0F4C5C]/25 transition duration-200 hover:-translate-y-0.5 hover:bg-[#176276] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#35D0BA]/50 sm:right-6"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
