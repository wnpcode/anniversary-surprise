export const REMOTE_COMMANDS = [
  "pembuka", "catatan", "penutup",
  "gulir-atas", "gulir-catatan", "gulir-pertanyaan", "gulir-surat", "gulir-album",
  "surat-buka", "surat-tutup",
  "album-buka", "album-sebelumnya", "album-berikutnya", "album-tutup",
  "kembang-lewati", "kembang-ulang",
] as const;

export type RemoteCommand = (typeof REMOTE_COMMANDS)[number];

export function isRemoteCommand(value: string): value is RemoteCommand {
  return (REMOTE_COMMANDS as readonly string[]).includes(value);
}

export const REMOTE_LABELS: Record<RemoteCommand, string> = {
  pembuka: "Kembang api pembuka",
  penutup: "Kembang api penutup",
  "kembang-lewati": "Lewati",
  "kembang-ulang": "Putar lagi",
  catatan: "Buka catatan",
  "gulir-atas": "Ke atas",
  "gulir-catatan": "Kenangan",
  "gulir-pertanyaan": "Pertanyaan",
  "gulir-surat": "Surat",
  "gulir-album": "Album",
  "surat-buka": "Buka suratnya",
  "surat-tutup": "Tutup suratnya",
  "album-buka": "Buka album",
  "album-sebelumnya": "← Sebelumnya",
  "album-berikutnya": "Berikutnya →",
  "album-tutup": "Tutup album",
};

export const NAVIGATION_TARGETS = {
  pembuka: "/perayaan/pembuka/",
  catatan: "/",
  penutup: "/perayaan/penutup/",
} as const satisfies Partial<Record<RemoteCommand, string>>;

export const SCROLL_TARGETS = {
  "gulir-atas": "atas",
  "gulir-catatan": "catatan",
  "gulir-pertanyaan": "pertanyaan",
  "gulir-surat": "surat",
  "gulir-album": "album",
} as const satisfies Partial<Record<RemoteCommand, string>>;

export const REMOTE_EVENT = "anniversary:remote";
export const SCREEN_STORAGE_KEY = "anniversary-layar";
export const SCREEN_CHANGE_EVENT = "anniversary:layar";

export function dispatchRemoteCommand(command: RemoteCommand) {
  window.dispatchEvent(new CustomEvent<RemoteCommand>(REMOTE_EVENT, { detail: command }));
}

export function subscribeRemoteCommand(handler: (command: RemoteCommand) => void) {
  const listener = (event: Event) => {
    const command = (event as CustomEvent<unknown>).detail;
    if (typeof command === "string" && isRemoteCommand(command)) handler(command);
  };
  window.addEventListener(REMOTE_EVENT, listener);
  return () => window.removeEventListener(REMOTE_EVENT, listener);
}
