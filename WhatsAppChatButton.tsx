import React from "react";
import { MessageCircle } from "lucide-react";

// TODO: sustituir por el número real de WhatsApp Business (formato internacional, sin "+" ni espacios,
// p. ej. "34600000000") y, si se quiere, un mensaje de apertura distinto por disciplina.
const WHATSAPP_BUSINESS_NUMBER = "34600000000";
const WHATSAPP_DEFAULT_MESSAGE = "Hola! Tengo una consulta sobre mi plan de entrenamiento en ELEVR.";

export default function WhatsAppChatButton() {
  const href = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider rounded-xl text-xs transition cursor-pointer shadow-sm"
    >
      <MessageCircle className="w-4 h-4" />
      Hablar con nosotros por WhatsApp
    </a>
  );
}
