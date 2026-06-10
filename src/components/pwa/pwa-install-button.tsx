"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isIos() {
  if (typeof window === "undefined") return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari standalone
    window.navigator.standalone === true
  );
}

export function PwaInstallButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showIosHint, setShowIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    if (isIos()) {
      setShowIosHint(true);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setInstallEvent(null);
      setShowIosHint(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function installApp() {
    if (!installEvent) return;

    await installEvent.prompt();

    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstalled(true);
    }

    setInstallEvent(null);
  }

  if (installed) {
    return null;
  }

  if (installEvent) {
    return (
      <button
        onClick={installApp}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-2xl transition hover:bg-slate-800"
      >
        <Download size={18} />
        Instalar app
      </button>
    );
  }

  if (showIosHint) {
    return (
      <div className="fixed bottom-5 left-4 right-4 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:left-auto sm:max-w-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <Smartphone size={18} />
          </div>

          <div>
            <p className="text-sm font-black text-slate-950">
              Instalar LimaStock
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              No iPhone, toque em compartilhar e depois em “Adicionar à Tela de
              Início”.
            </p>

            <button
              onClick={() => setShowIosHint(false)}
              className="mt-3 text-xs font-black text-slate-950 underline"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}