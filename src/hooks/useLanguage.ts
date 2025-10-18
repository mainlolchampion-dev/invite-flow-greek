import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations, Language, TranslationKeys } from "@/lib/i18n/translations";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "el" as Language,
      t: translations.el,
      setLanguage: (lang: Language) => 
        set({ 
          language: lang,
          t: translations[lang]
        }),
    }),
    { 
      name: "templatestudio-language",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.language];
        }
      },
    }
  )
);

export const useTranslation = () => {
  const { language, setLanguage, t } = useLanguage();
  return { t, language, setLanguage };
};
