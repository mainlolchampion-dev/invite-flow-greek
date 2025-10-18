import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { VisualEditor } from "@/components/VisualEditor";
import { Sparkles, Save, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Project {
  id: string;
  project_name: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  template_id: string | null;
  user_id: string;
}

export default function Editor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [html, setHtml] = useState<string>("");
  const [htmlLoaded, setHtmlLoaded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadProject(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, projectId]);

  const loadProject = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast.error(t.common.error);
        navigate("/dashboard");
        return;
      }

      setProject(data);
      setProjectName(data.project_name);

      // Load HTML: prefer modified_html, fallback to template html
      if (data.modified_html) {
        setHtml(data.modified_html);
      } else if (data.template_id) {
        const { data: tpl } = await supabase
          .from("templates")
          .select("html_content")
          .eq("id", data.template_id)
          .maybeSingle();
        setHtml(tpl?.html_content || "");
      }
      setHtmlLoaded(true);
    } catch (error: any) {
      toast.error(t.common.error);
      console.error("Error loading project:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_projects")
        .update({ 
          project_name: projectName,
          updated_at: new Date().toISOString()
        })
        .eq("id", project.id);

      if (error) throw error;
      
      toast.success("Αποθηκεύτηκε επιτυχώς");
    } catch (error: any) {
      toast.error(t.common.error);
      console.error("Error saving project:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!project) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_projects")
        .update({ 
          is_published: !project.is_published,
          updated_at: new Date().toISOString()
        })
        .eq("id", project.id);

      if (error) throw error;
      
      setProject({ ...project, is_published: !project.is_published });
      toast.success(
        project.is_published 
          ? "Η πρόσκληση αποσύρθηκε" 
          : "Η πρόσκληση δημοσιεύτηκε"
      );
    } catch (error: any) {
      toast.error(t.common.error);
      console.error("Error publishing project:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleHtmlSave = async (modifiedHtml?: string) => {
    if (!project) return;
    setSaving(true);
    try {
      const contentToSave = modifiedHtml || html;
      const { error } = await supabase
        .from("user_projects")
        .update({ modified_html: contentToSave, updated_at: new Date().toISOString() })
        .eq("id", project.id);
      if (error) throw error;
      setHtml(contentToSave);
      toast.success("Το περιεχόμενο αποθηκεύτηκε");
    } catch (error: any) {
      toast.error(t.common.error);
      console.error("Error saving html:", error);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.common.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Πίσω στο Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Επεξεργασία Πρόσκλησης
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {project?.slug}
              </p>
            </div>
          </div>
        </div>

        {/* Editor Content - Split View */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left Column - Compact Settings */}
          <div className="xl:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ρυθμίσεις</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-xs">Όνομα</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Όνομα πρόσκλησης"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    size="sm"
                    className="w-full"
                  >
                    <Save className="mr-2 h-3 w-3" />
                    Αποθήκευση
                  </Button>
                  
                  <Button 
                    onClick={handlePublish} 
                    disabled={saving}
                    variant={project?.is_published ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                  >
                    {project?.is_published ? "Απόσυρση" : "Δημοσίευση"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {project?.is_published && (
              <Card className="border-primary/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Δημόσια URL</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input 
                    readOnly 
                    value={`${window.location.origin}/p/${project.slug}`}
                    className="h-8 text-xs"
                  />
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/p/${project.slug}`);
                      toast.success("Αντιγράφηκε");
                    }}
                  >
                    Αντιγραφή
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Large Visual Editor */}
          <div className="xl:col-span-10">
            <Card className="h-full shadow-lg border-2">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Visual Editor
                  </span>
                  {project?.is_published && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/p/${project.slug}`, '_blank')}
                    >
                      <Eye className="mr-2 h-4 w-4" />Προεπισκόπηση
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {htmlLoaded && html ? (
                  <VisualEditor 
                    html={html} 
                    onSave={handleHtmlSave}
                    isSaving={saving}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p>Φόρτωση περιεχομένου...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
