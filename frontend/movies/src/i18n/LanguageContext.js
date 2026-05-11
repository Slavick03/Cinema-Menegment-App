import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultLanguage, languages, translations } from "./translations";

const LANGUAGE_STORAGE_KEY = "appLanguage";

const LanguageContext = createContext({
  language: defaultLanguage,
  locale: languages[defaultLanguage].locale,
  setLanguage: () => undefined,
  availableLanguages: Object.values(languages),
  t: (key) => key,
});

const interpolate = (template, values = {}) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, `${value}`),
    template,
  );

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return languages[savedLanguage] ? savedLanguage : defaultLanguage;
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const locale =
      languages[language]?.locale || languages[defaultLanguage].locale;

    return {
      language,
      locale,
      setLanguage,
      availableLanguages: Object.values(languages),
      t: (key, values = {}) => {
        const template =
          translations[language]?.[key] ??
          translations[defaultLanguage]?.[key] ??
          key;

        return typeof template === "string"
          ? interpolate(template, values)
          : key;
      },
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => useContext(LanguageContext);
