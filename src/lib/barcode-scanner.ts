import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export type BarcodeScannerController = {
  stop: () => Promise<void>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect: (source: HTMLVideoElement | HTMLCanvasElement) => Promise<
    Array<{
      rawValue?: string;
      displayValue?: string;
    }>
  >;
};

type StartBarcodeScannerOptions = {
  elementId: string;
  onDetected: (code: string) => void | Promise<void>;
  onStatus?: (message: string) => void;
  preferNativeDetector?: boolean;
};

const HTML5_QRCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
];

const NATIVE_BARCODE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "codabar",
  "qr_code",
];

function getContainer(elementId: string) {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error("Área do scanner não encontrada na tela.");
  }

  return element;
}

function clearContainer(element: HTMLElement) {
  element.innerHTML = "";
}

function buildQrbox(width: number) {
  const safeWidth = Math.max(260, Math.min(width - 32, 520));

  return {
    width: safeWidth,
    height: Math.max(150, Math.round(safeWidth * 0.42)),
  };
}

function getCameraErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (/notallowed|permission|denied/i.test(message)) {
    return "Permissão da câmera negada. Libere a câmera nas configurações do navegador e tente novamente.";
  }

  if (/notfound|devicesnotfound|requested device not found/i.test(message)) {
    return "Nenhuma câmera foi encontrada neste dispositivo.";
  }

  if (/notreadable|track start|could not start/i.test(message)) {
    return "Não foi possível usar a câmera. Feche outros apps que possam estar usando a câmera e tente novamente.";
  }

  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    return "A câmera só funciona em HTTPS ou localhost. Publique o app em HTTPS para usar o scanner.";
  }

  return "Não foi possível iniciar a câmera. Digite o código manualmente ou tente novamente com mais luz.";
}

export function normalizeBarcodeInput(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\dA-Za-z\-_.]/g, "");
}

async function startNativeBarcodeScanner({
  elementId,
  onDetected,
  onStatus,
}: StartBarcodeScannerOptions): Promise<BarcodeScannerController> {
  const BarcodeDetector = (window as unknown as {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }).BarcodeDetector;

  if (!BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Leitor nativo indisponível.");
  }

  const container = getContainer(elementId);
  clearContainer(container);

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: {
        ideal: "environment",
      },
      width: {
        ideal: 1280,
      },
      height: {
        ideal: 720,
      },
    },
    audio: false,
  });

  const video = document.createElement("video");
  video.setAttribute("playsinline", "true");
  video.setAttribute("muted", "true");
  video.muted = true;
  video.autoplay = true;
  video.srcObject = stream;
  video.className = "h-full min-h-[320px] w-full rounded-[1.5rem] object-cover";

  const overlay = document.createElement("div");
  overlay.className =
    "pointer-events-none absolute left-1/2 top-1/2 h-36 w-[82%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]";

  container.style.position = "relative";
  container.appendChild(video);
  container.appendChild(overlay);

  await video.play();

  const detector = new BarcodeDetector({
    formats: NATIVE_BARCODE_FORMATS,
  });

  let stopped = false;
  let busy = false;

  const scan = async () => {
    if (stopped || busy) return;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      window.setTimeout(scan, 120);
      return;
    }

    busy = true;

    try {
      const codes = await detector.detect(video);
      const rawCode = codes[0]?.rawValue || codes[0]?.displayValue || "";
      const cleanCode = normalizeBarcodeInput(rawCode);

      if (cleanCode) {
        stopped = true;
        await onDetected(cleanCode);
        return;
      }
    } finally {
      busy = false;
    }

    window.setTimeout(scan, 120);
  };

  onStatus?.("Câmera aberta. Alinhe o código na faixa central.");
  scan();

  return {
    stop: async () => {
      stopped = true;
      stream.getTracks().forEach((track) => track.stop());
      clearContainer(container);
    },
  };
}

async function startHtml5QrCodeScanner({
  elementId,
  onDetected,
  onStatus,
}: StartBarcodeScannerOptions): Promise<BarcodeScannerController> {
  const container = getContainer(elementId);
  clearContainer(container);

  const scanner = new Html5Qrcode(elementId, {
    formatsToSupport: HTML5_QRCODE_FORMATS,
    verbose: false,
  });

  const containerWidth = container.clientWidth || window.innerWidth || 360;

  await scanner.start(
    {
      facingMode: {
        ideal: "environment",
      },
    } as MediaTrackConstraints,
    {
      fps: 10,
      qrbox: buildQrbox(containerWidth),
      aspectRatio: 1.7777778,
      disableFlip: true,
      videoConstraints: {
        facingMode: {
          ideal: "environment",
        },
        width: {
          ideal: 1280,
        },
        height: {
          ideal: 720,
        },
      },
    } as never,
    async (decodedText) => {
      const cleanCode = normalizeBarcodeInput(decodedText);

      if (cleanCode) {
        await onDetected(cleanCode);
      }
    },
    () => {
      // Frames sem leitura são normais.
    }
  );

  onStatus?.("Câmera aberta. Aproxime o código e mantenha boa iluminação.");

  return {
    stop: async () => {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } finally {
        await scanner.clear();
        clearContainer(container);
      }
    },
  };
}

export async function startBarcodeScanner(
  options: StartBarcodeScannerOptions
): Promise<BarcodeScannerController> {
  const useNativeFirst = options.preferNativeDetector ?? true;

  if (useNativeFirst) {
    try {
      return await startNativeBarcodeScanner(options);
    } catch {
      // Se o navegador não suportar BarcodeDetector, usa html5-qrcode.
    }
  }

  try {
    return await startHtml5QrCodeScanner(options);
  } catch (error) {
    throw new Error(getCameraErrorMessage(error));
  }
}
