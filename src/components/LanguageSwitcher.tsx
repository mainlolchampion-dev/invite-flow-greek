import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useLanguage";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "el" : "en")}
      className="gap-2"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{language === "en" ? "ΕΛ" : "EN"}</span>
    </Button>
  );
};
