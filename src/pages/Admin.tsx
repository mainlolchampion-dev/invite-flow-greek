import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, Heart, Church, PartyPopper, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const eventTypeConfig = {
  wedding: { icon: Heart, color: "text-pink-500" },
  baptism: { icon: Church, color: "text-blue-500" },
  party: { icon: PartyPopper, color: "text-purple-500" },
};

export default function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameEl, setNameEl] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionEl, setDescriptionEl] = useState("");
  const [eventType, setEventType] = useState<"wedding" | "baptism" | "party">("wedding");
  const [price, setPrice] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);
  const [hasCountdown, setHasCountdown] = useState(false);
  const [hasLocationMap, setHasLocationMap] = useState(false);
  const [hasRsvp, setHasRsvp] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);

      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
        toast.error("Access denied: Admin only");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      console.error("Error checking auth:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameEn || !nameEl) {
      toast.error("Template names are required");
      return;
    }

    setUploading(true);

    try {
      let zipFileUrl = null;
      let templateId = null;

      // Upload ZIP file if provided
      if (zipFile) {
        const fileExt = zipFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `templates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(filePath, zipFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('templates')
          .getPublicUrl(filePath);

        zipFileUrl = urlData.publicUrl;
      }

      const { data: templateData, error } = await supabase
        .from("templates")
        .insert({
          name_en: nameEn,
          name_el: nameEl,
          description_en: descriptionEn || null,
          description_el: descriptionEl || null,
          event_type: eventType,
          price: parseFloat(price) || 0,
          is_featured: isFeatured,
          has_countdown: hasCountdown,
          has_location_map: hasLocationMap,
          has_rsvp: hasRsvp,
          is_active: true,
          thumbnail_url: zipFileUrl,
        })
        .select()
        .single();

      if (error) throw error;
      
      templateId = templateData.id;

      // Process ZIP file if uploaded
      if (zipFileUrl && templateId) {
        console.log('Triggering ZIP processing for template:', templateId);
        
        // Call edge function to process ZIP in background
        const { error: processError } = await supabase.functions.invoke('process-template-zip', {
          body: { 
            templateId, 
            zipUrl: zipFileUrl 
          },
        });

        if (processError) {
          console.error('Error processing ZIP:', processError);
          toast.error('Template uploaded but ZIP processing failed');
        } else {
          console.log('ZIP processing started successfully');
        }
      }

      toast.success(t.admin.success);
      
      // Reset form
      setNameEn("");
      setNameEl("");
      setDescriptionEn("");
      setDescriptionEl("");
      setEventType("wedding");
      setPrice("0");
      setIsFeatured(false);
      setHasCountdown(false);
      setHasLocationMap(false);
      setHasRsvp(false);
      setZipFile(null);
    } catch (error: any) {
      toast.error(t.admin.error);
      console.error("Error uploading template:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleCleanupStorage = async () => {
    if (!confirm("Are you sure you want to delete ALL files from templates storage? This cannot be undone!")) {
      return;
    }

    setDeleting(true);

    try {
      // List all files in templates bucket
      const { data: files, error: listError } = await supabase.storage
        .from('templates')
        .list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) throw listError;

      if (!files || files.length === 0) {
        toast.info("No files to delete");
        return;
      }

      // Delete all files
      const filePaths = files.map(file => file.name);
      const { error: deleteError } = await supabase.storage
        .from('templates')
        .remove(filePaths);

      if (deleteError) throw deleteError;

      toast.success(`Successfully deleted ${files.length} files from storage`);
    } catch (error: any) {
      toast.error("Error cleaning storage: " + error.message);
      console.error("Error cleaning storage:", error);
    } finally {
      setDeleting(false);
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            {t.admin.title}
          </h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        {/* Storage Cleanup */}
        <Card className="max-w-3xl mx-auto shadow-elegant mb-8 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-6 w-6" />
              Storage Cleanup
            </CardTitle>
            <CardDescription>
              Delete all files from the templates storage bucket
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleCleanupStorage}
              disabled={deleting}
              className="w-full"
            >
              {deleting ? "Deleting..." : "Delete All Template Files"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ This will permanently delete all uploaded template files. Database records will remain intact.
            </p>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card className="max-w-3xl mx-auto shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6 text-primary" />
              {t.admin.uploadTemplate}
            </CardTitle>
            <CardDescription>
              Create a new template for users to customize
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Names */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t.admin.form.nameEn} *</Label>
                  <Input
                    id="nameEn"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Elegant Wedding"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nameEl">{t.admin.form.nameEl} *</Label>
                  <Input
                    id="nameEl"
                    value={nameEl}
                    onChange={(e) => setNameEl(e.target.value)}
                    placeholder="Κομψός Γάμος"
                    required
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t.admin.form.descriptionEn}</Label>
                  <Textarea
                    id="descriptionEn"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Beautiful template for wedding invitations"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descriptionEl">{t.admin.form.descriptionEl}</Label>
                  <Textarea
                    id="descriptionEl"
                    value={descriptionEl}
                    onChange={(e) => setDescriptionEl(e.target.value)}
                    placeholder="Όμορφο πρότυπο για προσκλήσεις γάμου"
                    rows={3}
                  />
                </div>
              </div>

              {/* Event Type & Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventType">{t.admin.form.eventType}</Label>
                  <Select value={eventType} onValueChange={(value: any) => setEventType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          {t.admin.eventTypes.wedding}
                        </div>
                      </SelectItem>
                      <SelectItem value="baptism">
                        <div className="flex items-center gap-2">
                          <Church className="h-4 w-4 text-blue-500" />
                          {t.admin.eventTypes.baptism}
                        </div>
                      </SelectItem>
                      <SelectItem value="party">
                        <div className="flex items-center gap-2">
                          <PartyPopper className="h-4 w-4 text-purple-500" />
                          {t.admin.eventTypes.party}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">{t.admin.form.price}</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <Label>{t.admin.form.features}</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={isFeatured}
                      onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                    />
                    <Label htmlFor="featured" className="font-normal cursor-pointer">
                      {t.admin.form.isFeatured}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="countdown"
                      checked={hasCountdown}
                      onCheckedChange={(checked) => setHasCountdown(checked as boolean)}
                    />
                    <Label htmlFor="countdown" className="font-normal cursor-pointer">
                      {t.templates.features.countdown}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="map"
                      checked={hasLocationMap}
                      onCheckedChange={(checked) => setHasLocationMap(checked as boolean)}
                    />
                    <Label htmlFor="map" className="font-normal cursor-pointer">
                      {t.templates.features.map}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rsvp"
                      checked={hasRsvp}
                      onCheckedChange={(checked) => setHasRsvp(checked as boolean)}
                    />
                    <Label htmlFor="rsvp" className="font-normal cursor-pointer">
                      {t.templates.features.rsvp}
                    </Label>
                  </div>
                </div>
              </div>

              {/* ZIP File Upload */}
              <div className="space-y-2">
                <Label htmlFor="zipFile">{t.admin.form.zipFile}</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="zipFile"
                    type="file"
                    accept=".zip"
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {zipFile && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      <Upload className="h-3 w-3" />
                      {zipFile.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload ZIP file with HTML template from Envato Elements
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                disabled={uploading}
              >
                {uploading ? t.admin.form.uploading : t.admin.form.uploadButton}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
