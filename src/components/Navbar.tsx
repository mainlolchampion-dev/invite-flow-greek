import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useLanguage";
import { Sparkles } from "lucide-react";

export const Navbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 animate-glow rounded-full" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TemplateStudio
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/templates">{t.nav.templates}</Link>
            </Button>
            
            <LanguageSwitcher />
            
            <Button variant="outline" asChild>
              <Link to="/auth">{t.nav.signIn}</Link>
            </Button>
            
            <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Link to="/auth">{t.nav.getStarted}</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
