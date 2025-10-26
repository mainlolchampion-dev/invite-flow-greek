import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { processDahliaTemplate } from "@/lib/templateProcessor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, ArrowLeft, Sparkles } from "lucide-react";

export default function ProcessDahlia() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("Dahlia Wedding Template");
  const [description, setDescription] = useState("Elegant wedding invitation template with romantic design");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.html')) {
      setHtmlFile(file);
      toast.success("Αρχείο HTML επιλέχθηκε");
    } else {
      toast.error("Παρακαλώ επιλέξτε ένα αρχείο .html");
    }
  };

  const handleProcess = async () => {
    if (!htmlFile) {
      toast.error("Παρακαλώ επιλέξτε ένα αρχείο HTML");
      return;
    }

    setLoading(true);
    try {
      // Read the HTML file
      const htmlContent = await htmlFile.text();
      
      // Process the template
      const processedHtml = processDahliaTemplate(htmlContent);
      
      // Upload to Supabase
      const { data, error } = await supabase
        .from("templates")
        .insert({
          name_en: templateName,
          name_el: templateName,
          description_en: description,
          description_el: description,
          event_type: "wedding",
          price: 0,
          is_active: true,
          is_featured: true,
          html_content: processedHtml,
          has_rsvp: true,
          has_countdown: false,
          has_location_map: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Το template δημιουργήθηκε επιτυχώς!");
      
      // Navigate to templates page after 2 seconds
      setTimeout(() => {
        navigate("/templates");
      }, 2000);
      
    } catch (error: any) {
      console.error("Error processing template:", error);
      toast.error("Σφάλμα κατά την επεξεργασία του template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Πίσω στο Admin
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Επεξεργασία Dahlia Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="templateName">Όνομα Template</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="π.χ. Dahlia Wedding Template"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Περιγραφή</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Σύντομη περιγραφή του template..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="htmlFile">Αρχείο HTML</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="htmlFile"
                    type="file"
                    accept=".html"
                    onChange={handleFileSelect}
                  />
                  {htmlFile && (
                    <span className="text-sm text-green-600">✓</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Επιλέξτε το index.html από το Dahlia template
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Τι θα κάνει αυτό το εργαλείο:</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Θα προσθέσει data-editable attributes σε όλα τα κείμενα</li>
                  <li>Θα δημιουργήσει CSS variables για το theming</li>
                  <li>Θα κάνει όλες τις εικόνες clickable για αλλαγή</li>
                  <li>Θα αποθηκεύσει το template στη βάση δεδομένων</li>
                </ul>
              </div>

              <Button 
                onClick={handleProcess}
                disabled={loading || !htmlFile}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Επεξεργασία...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Επεξεργασία & Αποθήκευση Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
