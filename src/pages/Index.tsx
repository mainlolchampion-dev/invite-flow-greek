import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useTranslation } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import { Sparkles, Palette, Share2, Heart, Church, PartyPopper } from "lucide-react";

const Index = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Sparkles,
      title: t.landing.features.upload.title,
      description: t.landing.features.upload.description,
    },
    {
      icon: Palette,
      title: t.landing.features.customize.title,
      description: t.landing.features.customize.description,
    },
    {
      icon: Share2,
      title: t.landing.features.share.title,
      description: t.landing.features.share.description,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 opacity-50" />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.1) 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-up">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t.landing.hero}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {t.landing.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-elegant text-lg px-8">
                <Link to="/auth">{t.landing.cta}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link to="/templates">{t.landing.viewTemplates}</Link>
              </Button>
            </div>

            {/* Event Type Icons */}
            <div className="flex justify-center gap-8 pt-8">
              <div className="flex items-center gap-2 text-pink-500">
                <Heart className="h-8 w-8" />
                <span className="text-sm font-medium">{t.eventTypes.wedding.label}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-500">
                <Church className="h-8 w-8" />
                <span className="text-sm font-medium">{t.eventTypes.baptism.label}</span>
              </div>
              <div className="flex items-center gap-2 text-purple-500">
                <PartyPopper className="h-8 w-8" />
                <span className="text-sm font-medium">{t.eventTypes.party.label}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.landing.features.title}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-105 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20 shadow-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {t.landing.hero}
                </span>
              </CardTitle>
              <CardDescription className="text-lg">
                {t.landing.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8">
                <Link to="/auth">{t.landing.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
