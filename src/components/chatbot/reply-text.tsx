import { Fragment } from "react";

import { parseReply, type Inline } from "@/lib/chatbot/format";
import { cn } from "@/lib/utils";

/** Jawaban chatbot sebagai elemen React biasa. Tidak ada HTML mentah dari model. */
function Inlines({ parts, tone }: { parts: Inline[]; tone: "light" | "dark" }) {
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "bold") return <strong key={index} className="font-semibold">{part.text}</strong>;
        if (part.type === "link") {
          return (
            <a
              key={index}
              href={part.href}
              {...(part.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "font-semibold underline decoration-2 underline-offset-2 transition-colors",
                tone === "light" ? "text-navy-700 decoration-sun-500 hover:text-navy-900" : "text-sun-300 decoration-sun-500/60",
              )}
            >
              {part.text}
            </a>
          );
        }
        return <Fragment key={index}>{part.text}</Fragment>;
      })}
    </>
  );
}

export function ReplyText({ text, tone = "light" }: { text: string; tone?: "light" | "dark" }) {
  return (
    <div className="space-y-2">
      {parseReply(text).map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="space-y-1">
            {block.items.map((item, i) => (
              <li key={i} className="relative pl-4">
                <span
                  aria-hidden="true"
                  className={cn("absolute top-[0.6em] left-0 h-1.5 w-1.5 rounded-full", tone === "light" ? "bg-sun-500" : "bg-sun-300")}
                />
                <Inlines parts={item} tone={tone} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            {block.lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                <Inlines parts={line} tone={tone} />
              </Fragment>
            ))}
          </p>
        ),
      )}
    </div>
  );
}
