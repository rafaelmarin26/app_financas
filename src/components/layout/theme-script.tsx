import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Roda antes da primeira pintura para o tema salvo já valer no primeiro frame.
 * Sem isso a página aparece clara por um instante antes de virar escura.
 * Precisa ser um script inline e autossuficiente — não pode importar nada.
 */
const script = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.classList.add(t)}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
