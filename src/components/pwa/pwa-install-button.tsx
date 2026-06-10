"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isIos() {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || "";
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === "macintel" && maxTouchPoints > 1)
  );
}

function isStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error Safari iOS expõe essa propriedade fora do tipo padrão.
    window.navigator.standalone === true
  );
}

function canUseSessionStorage() {
  try {
    return typeof window !== "undefined" && Boolean(window.sessionStorage);
  } catch {
    return false;
  }
}

const DISMISS_KEY = "limastock_pwa_install_dismissed_session_v2";

export function PwaInstallButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const ios = useMemo(() => isIos(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    if (canUseSessionStorage()) {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true");
    }

    if (ios) {
      setShowHelp(true);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShowHelp(true);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setInstallEvent(null);
      setShowHelp(false);
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
  }, [ios]);

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
    if (canUseSessionStorage()) {
      sessionStorage.setItem(DISMISS_KEY, "true");
    }

    setDismissed(true);
    setShowHelp(false);
    setInstallEvent(null);
  }

  if (installed || dismissed || !showHelp) {
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
                Use o sistema como aplicativo no celular, com ícone na tela inicial.
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
              aria-label="Fechar aviso de instalação"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (ios) {
    return (
      <div className="fixed bottom-5 left-4 right-4 z-50 sm:left-auto sm:max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Smartphone size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">
                Instalar LimaStock no iPhone
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                No Safari, toque no botão de compartilhar
                <Share className="mx-1 inline" size={14} />
                e escolha “Adicionar à Tela de Início”.
              </p>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                O iPhone não exibe um instalador automático como o Android; ele usa o menu de compartilhar.
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
              aria-label="Fechar aviso de instalação"
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
