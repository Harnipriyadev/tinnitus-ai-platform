"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  AlertCircle,
  Bot,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  authenticatedFetch,
  logoutUser,
} from "../../../../lib/authService";

import {
  chatbotTranslations,
} from "../../../../lib/chatbotTranslations";

import {
  useLanguage,
} from "../../context/LanguageContext";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

type AssistantResponse = {
  success?: boolean;
  reply?: string;
  message?: string;
};

function createMessage(
  sender: Message["sender"],
  text: string
): Message {
  return {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
    sender,
    text,
  };
}

export default function ChatBot() {
  const {
    language,
  } = useLanguage();

  const text =
    chatbotTranslations[
      language
    ];

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    input,
    setInput,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([
    {
      id: "welcome-message",
      sender: "bot",
      text: text.welcome,
    },
  ]);

  const messagesEndRef =
    useRef<HTMLDivElement>(
      null
    );

  /*
   * Translate the chatbot welcome message
   * whenever the selected language changes.
   */
  useEffect(() => {
    setMessages(
      (previous) =>
        previous.map(
          (message) =>
            message.id ===
            "welcome-message"
              ? {
                  ...message,

                  text:
                    chatbotTranslations[
                      language
                    ].welcome,
                }
              : message
        )
    );
  }, [language]);

  /*
   * Allows other components to open the
   * chatbot using a browser event.
   */
  useEffect(() => {
    const openAssistant =
      () => {
        setOpen(true);
      };

    window.addEventListener(
      "open-ai-assistant",
      openAssistant
    );

    return () => {
      window.removeEventListener(
        "open-ai-assistant",
        openAssistant
      );
    };
  }, []);

  /*
   * Automatically scroll to the newest
   * message when the conversation changes.
   */
  useEffect(() => {
    if (open) {
      messagesEndRef.current
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }
  }, [
    messages,
    loading,
    open,
  ]);

  const addBotMessage = (
    message: string
  ) => {
    setMessages(
      (previous) => [
        ...previous,

        createMessage(
          "bot",
          message
        ),
      ]
    );
  };

  const sendMessage = async (
    event?:
      FormEvent<HTMLFormElement>
  ) => {
    event?.preventDefault();

    const question =
      input.trim();

    if (
      !question ||
      loading
    ) {
      return;
    }

    if (
      question.length > 1500
    ) {
      addBotMessage(
        text.messageTooLong
      );

      return;
    }

    const apiUrl =
      process.env
        .NEXT_PUBLIC_API_URL
        ?.replace(
          /\/+$/,
          ""
        );

    if (!apiUrl) {
      addBotMessage(
        text.apiNotConfigured
      );

      return;
    }

    const userMessage =
      createMessage(
        "user",
        question
      );

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
      ]
    );

    setInput("");
    setLoading(true);

    try {
      const response =
        await authenticatedFetch(
          `${apiUrl}/api/assistant/chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                message:
                  question,
              }),
          }
        );

      const data:
        AssistantResponse =
        await response.json();

      if (!response.ok) {
        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          await logoutUser();

          throw new Error(
            text.sessionExpired
          );
        }

        throw new Error(
          data.message ||
            text.assistantUnavailable
        );
      }

      if (!data.reply) {
        throw new Error(
          text.emptyResponse
        );
      }

      addBotMessage(
        data.reply
      );
    } catch (error) {
      console.error(
        "Assistant error:",
        error
      );

      /*
       * Explicit string type prevents TypeScript
       * from restricting this variable to only
       * translation literal values.
       */
      let message: string =
        text.unableToContact;

      if (
        error instanceof Error
      ) {
        message =
          error.message;
      }

      if (
        message ===
          "You are not authenticated" ||
        message ===
          "Authentication token is required"
      ) {
        message =
          text.loginRequired;
      }

      addBotMessage(
        message
      );
    } finally {
      setLoading(false);
    }
  };

  const selectQuickPrompt =
    () => {
      setInput(
        text.quickPrompt
      );
    };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="fixed bottom-6 right-6 z-[100] flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.55)] transition hover:scale-110 hover:bg-cyan-300"
        aria-label={
          open
            ? text.closeAssistant
            : text.openAssistant
        }
      >
        {open ? (
          <X size={27} />
        ) : (
          <MessageCircle
            size={27}
          />
        )}
      </button>

      {open && (
        <section className="fixed bottom-24 right-4 z-[100] flex h-[620px] max-h-[calc(100vh-120px)] w-[calc(100vw-32px)] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#08131f]/95 shadow-2xl backdrop-blur-xl sm:right-6">
          <header className="flex items-center justify-between bg-gradient-to-r from-cyan-400 to-cyan-500 p-4 text-slate-950">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/10">
                <Bot
                  size={23}
                />
              </div>

              <div>
                <h2 className="font-bold">
                  {text.title}
                </h2>

                <p className="text-xs text-slate-800">
                  {text.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              className="rounded-lg p-2 transition hover:bg-black/10"
              aria-label={
                text.closeAssistant
              }
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex items-start gap-2 border-b border-white/10 bg-cyan-400/5 px-4 py-3 text-xs leading-5 text-slate-400">
            <ShieldCheck
              size={16}
              className="mt-0.5 shrink-0 text-cyan-300"
            />

            <p>
              {text.disclaimer}
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map(
              (message) => (
                <div
                  key={
                    message.id
                  }
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.sender ===
                    "user"
                      ? "ml-auto rounded-br-md bg-cyan-400 text-slate-950"
                      : "rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-200"
                  }`}
                >
                  {message.text}
                </div>
              )
            )}

            {loading && (
              <div className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">
                <LoaderCircle
                  className="animate-spin text-cyan-300"
                  size={17}
                />

                {
                  text.reviewing
                }
              </div>
            )}

            <div
              ref={
                messagesEndRef
              }
            />
          </div>

          {messages.length ===
            1 && (
            <div className="border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={
                  selectQuickPrompt
                }
                className="w-full rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-left text-xs leading-5 text-cyan-200 transition hover:bg-cyan-400/10"
              >
                {
                  text.quickPrompt
                }
              </button>
            </div>
          )}

          <div className="flex items-start gap-2 border-t border-white/10 px-4 py-2 text-[11px] leading-4 text-slate-500">
            <AlertCircle
              size={14}
              className="mt-0.5 shrink-0"
            />

            <p>
              {
                text.urgentWarning
              }
            </p>
          </div>

          <form
            onSubmit={
              sendMessage
            }
            className="flex gap-2 border-t border-white/10 p-4"
          >
            <input
              value={input}
              onChange={(
                event
              ) =>
                setInput(
                  event.target
                    .value
                )
              }
              placeholder={
                text.inputPlaceholder
              }
              aria-label={
                text.inputLabel
              }
              maxLength={1500}
              disabled={loading}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#122033] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50 disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={
                !input.trim() ||
                loading
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={
                text.sendMessage
              }
            >
              <Send
                size={18}
              />
            </button>
          </form>
        </section>
      )}
    </>
  );
}