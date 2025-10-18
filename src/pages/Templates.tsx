import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Heart, Church, PartyPopper, Clock, MapPin, Mail } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Template {
  id: string;
  name_en: string;
  name_el: string;
  description_en: string | null;
  description_el: string | null;
  event_type: "wedding" | "baptism" | "party";
  thumbnail_url: string | null;
  price: number;
  has_countdown: boolean;
  has_location_map: boolean;
  has_rsvp: boolean;
  preview_images: string[];
  is_featured: boolean;
}

const eventTypeConfig = {
  wedding: {
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  baptism: {
    icon: Church,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  party: {
    icon: PartyPopper,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
};

export default function Templates() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "wedding" | "baptism" | "party">("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as Template[]);
    } catch (error: any) {
      toast.error(t.common.error);
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedFilter !== "all") {
      filtered = filtered.filter(t => t.event_type === selectedFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name_en.toLowerCase().includes(query) ||
        t.name_el.toLowerCase().includes(query) ||
        t.description_en?.toLowerCase().includes(query) ||
        t.description_el?.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = async (templateId: string) => {
    if (!user) {
      toast.error(t.auth.signIn);
      navigate("/auth");
      return;
    }

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const projectName = `${language === "en" ? template.name_en : template.name_el} - ${new Date().toLocaleDateString()}`;
      
      // Generate slug
      const { data: slugData, error: slugError } = await supabase
        .rpc("generate_slug", { base_text: projectName });

      if (slugError) throw slugError;

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("user_projects")
        .insert({
          user_id: user.id,
          template_id: templateId,
          project_name: projectName,
          slug: slugData,
          preferred_language: language,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      toast.success(t.common.save);
      navigate(`/editor/${project.id}`);
    } catch (error: any) {
      toast.error(t.common.error);
      console.error("Error creating project:", error);
    }
  };

  const getTemplateName = (template: Template) => 
    language === "en" ? template.name_en : template.name_el;

  const getTemplateDescription = (template: Template) => 
    language === "en" ? template.description_en : template.description_el;

  const getEventTypeLabel = (type: string) => 
    t.eventTypes[type as keyof typeof t.eventTypes].label;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4 animate-fade-up">
            {t.templates.title}
          </h1>
        </div>

        {/* Search & Filters */}
        <div className="max-w-4xl mx-auto mb-12 space-y-4 animate-fade-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t.templates.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {(["all", "wedding", "baptism", "party"] as const).map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                onClick={() => setSelectedFilter(filter)}
                className={selectedFilter === filter ? "bg-gradient-to-r from-primary to-secondary" : ""}
              >
                {t.templates.filters[filter]}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t.common.loading}</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t.common.error}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => {
              const EventIcon = eventTypeConfig[template.event_type].icon;
              
              return (
                <Card 
                  key={template.id}
                  className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:scale-105 animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Thumbnail */}
                  <div className={`h-48 ${eventTypeConfig[template.event_type].bgColor} flex items-center justify-center relative overflow-hidden`}>
                    <EventIcon className={`h-20 w-20 ${eventTypeConfig[template.event_type].color} opacity-20 group-hover:scale-110 transition-transform`} />
                    {template.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-primary to-secondary">
                        Featured
                      </Badge>
                    )}
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-xl">{getTemplateName(template)}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <EventIcon className={`h-3 w-3 ${eventTypeConfig[template.event_type].color}`} />
                        {getEventTypeLabel(template.event_type)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {getTemplateDescription(template) || t.templates.title}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {template.has_countdown && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {t.templates.features.countdown}
                        </Badge>
                      )}
                      {template.has_location_map && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {t.templates.features.map}
                        </Badge>
                      )}
                      {template.has_rsvp && (
                        <Badge variant="secondary" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          {t.templates.features.rsvp}
                        </Badge>
                      )}
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-primary">
                        {template.price > 0 ? `€${template.price}` : t.templates.free}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          {t.templates.preview}
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleUseTemplate(template.id)}
                          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        >
                          {t.templates.use}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {previewTemplate && getTemplateName(previewTemplate)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {previewTemplate && getTemplateDescription(previewTemplate)}
            </p>
            <div className="flex gap-2">
              {previewTemplate?.has_countdown && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {t.templates.features.countdown}
                </Badge>
              )}
              {previewTemplate?.has_location_map && (
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  {t.templates.features.map}
                </Badge>
              )}
              {previewTemplate?.has_rsvp && (
                <Badge variant="secondary">
                  <Mail className="h-3 w-3 mr-1" />
                  {t.templates.features.rsvp}
                </Badge>
              )}
            </div>
            {previewTemplate && (
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                onClick={() => {
                  handleUseTemplate(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
              >
                {t.templates.use}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
