import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Sparkles, Plus, Edit, Eye, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Project {
  id: string;
  project_name: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  template_id: string | null;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadProjects(session.user.id);
    };

    checkAuth();

    // Listen for auth changes
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
  }, [navigate]);

  const loadProjects = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error(t.common.error);
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm(t.common.confirm)) return;

    try {
      const { error } = await supabase
        .from("user_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success(t.dashboard.delete);
    } catch (error: any) {
      toast.error(t.common.error);
      console.error("Error deleting project:", error);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              {t.dashboard.title}
            </h1>
            <p className="text-muted-foreground">
              {user?.email}
            </p>
          </div>
          
          <Button 
            size="lg" 
            asChild
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-elegant"
          >
            <Link to="/templates">
              <Plus className="mr-2 h-5 w-5" />
              {t.dashboard.createNew}
            </Link>
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="border-dashed border-2 shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">{t.dashboard.noProjects}</h3>
              <p className="text-muted-foreground mb-6">{t.dashboard.noProjectsDescription}</p>
              <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <Link to="/templates">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.dashboard.createNew}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Card 
                key={project.id} 
                className="group hover:shadow-elegant transition-all duration-300 hover:scale-105 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{project.project_name}</CardTitle>
                    <Badge variant={project.is_published ? "default" : "secondary"}>
                      {project.is_published ? t.dashboard.status.published : t.dashboard.status.draft}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      asChild
                      className="flex-1"
                    >
                      <Link to={`/editor/${project.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t.dashboard.edit}
                      </Link>
                    </Button>
                    
                    {project.is_published && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        asChild
                        className="flex-1"
                      >
                        <Link to={`/p/${project.slug}`} target="_blank">
                          <Eye className="mr-2 h-4 w-4" />
                          {t.dashboard.view}
                        </Link>
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
