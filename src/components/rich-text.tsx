import { Fragment } from "react";

import { parseInline, parseRichText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

function Inline({ text }: { text: string }) {
  return parseInline(text).map((part, i) =>
    part.kind === "strong" ? (
      <strong key={i}>{part.text}</strong>
    ) : part.kind === "em" ? (
      <em key={i}>{part.text}</em>
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    ),
  );
}

/** Isi News dan event dari admin panel. Sintaks: lihat lib/rich-text.ts. */
export function RichText({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose-enkg", className)}>
      {parseRichText(content).map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i}>
                <Inline text={block.text} />
              </h2>
            );
          case "h3":
            return (
              <h3 key={i}>
                <Inline text={block.text} />
              </h3>
            );
          case "quote":
            return (
              <blockquote key={i}>
                <Inline text={block.text} />
              </blockquote>
            );
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </List>
            );
          }
          default:
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
