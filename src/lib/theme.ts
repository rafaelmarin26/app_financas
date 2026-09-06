export const THEME_STORAGE_KEY = "saldo-tema";

export type Theme = "light" | "dark" | "system";

export const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * O CSS trata os três casos por classe no <html>: `dark` força o escuro,
 * `light` força o claro (o bloco `prefers-color-scheme` ignora `.light`) e a
 * ausência das duas deixa a preferência do sistema decidir.
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);
}

function readStored(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    // Navegador com armazenamento bloqueado: cai no padrão do sistema.
    return "system";
  }
}

// --- Store externa consumida por useSyncExternalStore ------------------------
// O tema mora no localStorage, fora do React. Guardar em cache evita ler o
// disco a cada render, e o evento `storage` mantém as abas em sincronia.

let cached: Theme | null = null;
const listeners = new Set<() => void>();

function emit() {
  cached = null;
  for (const listener of listeners) listener();
}

export function subscribeTheme(onChange: () => void) {
  listeners.add(onChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    cached = null;
    applyTheme(readStored());
    onChange();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getThemeSnapshot(): Theme {
  if (cached === null) cached = readStored();
  return cached;
}

/** No servidor não há preferência salva; o script inline corrige antes da pintura. */
export function getThemeServerSnapshot(): Theme {
  return "system";
}

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Sem persistência a escolha vale só para esta aba — melhor que quebrar.
  }
  applyTheme(theme);
  emit();
}
