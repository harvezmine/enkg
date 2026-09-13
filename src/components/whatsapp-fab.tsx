import { whatsappMessages, whatsappUrl } from "@/content/site";

import { Icon } from "./icons";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl(whatsappMessages.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp Every Nation Kelapa Gading"
      className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#25d366] p-3.5 text-ink shadow-lg shadow-ink/25 transition hover:scale-105 sm:right-6 sm:bottom-6 sm:px-5"
    >
      <Icon.whatsapp className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  );
}
