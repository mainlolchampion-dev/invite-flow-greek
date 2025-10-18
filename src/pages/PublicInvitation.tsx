import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Home, Calendar, MapPin } from "lucide-react";

interface Project {
  id: string;
  project_name: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  template_id: string | null;
  modified_html: string | null;
}

interface Template {
  html_content: string | null;
  asset_urls: any;
}

export default function PublicInvitation() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadProject();
  }, [slug]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setProject(data);

      // Load template if available
      if (data.template_id) {
        const { data: templateData } = await supabase
          .from("templates")
          .select("html_content, asset_urls")
          .eq("id", data.template_id)
          .single();

        if (templateData) {
          setTemplate(templateData);
        }
      }
    } catch (error: any) {
      console.error("Error loading project:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Φόρτωση πρόσκλησης...</p>
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center">Δεν βρέθηκε η πρόσκληση</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Η πρόσκληση που ψάχνετε δεν υπάρχει ή δεν είναι δημοσιευμένη.
            </p>
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Αρχική Σελίδα
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If there's modified HTML or template HTML, render it
  const htmlContent = project.modified_html || template?.html_content;
  
  if (htmlContent) {
    return (
      <div 
        className="min-h-screen"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // Default fallback view
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elegant">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {project.project_name}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Ημερομηνία</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString('el-GR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-secondary/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-secondary" />
                      <CardTitle className="text-lg">Τοποθεσία</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Να οριστεί</p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center pt-8">
                <p className="text-muted-foreground mb-4">
                  Περισσότερες λεπτομέρειες θα προστεθούν σύντομα
                </p>
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Επιστροφή στην Αρχική
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
