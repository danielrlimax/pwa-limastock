"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

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
    // @ts-expect-error Safari iOS
    window.navigator.standalone === true
  );
}

export function PwaInstallButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showIosHint, setShowIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (process.env.NODE_ENV !== "production") return;

    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const alreadyDismissed =
      localStorage.getItem("limastock_pwa_install_dismissed") === "true";

    if (alreadyDismissed) {
      setDismissed(true);
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

  function dismiss() {
    localStorage.setItem("limastock_pwa_install_dismissed", "true");
    setDismissed(true);
    setShowIosHint(false);
    setInstallEvent(null);
  }

  if (installed || dismissed) {
    return null;
  }

  if (installEvent) {
    return (
      <div className="fixed bottom-5 left-4 right-4 z-50 sm:left-auto sm:max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Download size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">
                Instalar LimaStock
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Use o sistema como aplicativo no celular.
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={installApp}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white"
                >
                  Instalar
                </button>

                <button
                  onClick={dismiss}
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700"
                >
                  Agora não
                </button>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="rounded-xl bg-slate-100 p-2 text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div className="fixed bottom-5 left-4 right-4 z-50 sm:left-auto sm:max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Smartphone size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">
                Instalar LimaStock
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                No iPhone, toque em compartilhar e depois em “Adicionar à Tela
                de Início”.
              </p>

              <button
                onClick={dismiss}
                className="mt-3 text-xs font-black text-slate-950 underline"
              >
                Entendi
              </button>
            </div>

            <button
              onClick={dismiss}
              className="rounded-xl bg-slate-100 p-2 text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}