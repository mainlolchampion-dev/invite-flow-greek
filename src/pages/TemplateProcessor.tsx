import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Save, Wand2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditableField {
  id: string;
  label: string;
  type: "text" | "date" | "time" | "location" | "color" | "image" | "gallery";
  selector: string;
  defaultValue?: string;
}

export default function TemplateProcessor() {
  const [htmlContent, setHtmlContent] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [eventType, setEventType] = useState<"wedding" | "baptism" | "party">("wedding");
  const [editableFields, setEditableFields] = useState<EditableField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlContent(content);
      toast({
        title: "Template uploaded",
        description: "HTML file loaded successfully",
      });
    };
    reader.readAsText(file);
  };

  const autoDetectFields = () => {
    if (!htmlContent) return;

    const detected: EditableField[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Detect couple names
    const nameElements = doc.querySelectorAll('[class*="name"], [class*="title"], h1, h2');
    nameElements.forEach((el, idx) => {
      if (idx < 2 && el.textContent?.trim()) {
        detected.push({
          id: `name_${idx + 1}`,
          label: idx === 0 ? "First Name" : "Second Name",
          type: "text",
          selector: `.${el.className}`,
          defaultValue: el.textContent.trim(),
        });
      }
    });

    // Detect date/time fields
    const dateElements = doc.querySelectorAll('[class*="date"], [class*="time"]');
    dateElements.forEach((el, idx) => {
      detected.push({
        id: `date_${idx}`,
        label: "Event Date",
        type: "date",
        selector: `.${el.className}`,
      });
    });

    // Detect images
    const images = doc.querySelectorAll('img');
    images.forEach((img, idx) => {
      detected.push({
        id: `image_${idx}`,
        label: `Image ${idx + 1}`,
        type: "image",
        selector: `img:nth-of-type(${idx + 1})`,
        defaultValue: img.src,
      });
    });

    // Detect gallery sections
    const galleries = doc.querySelectorAll('[class*="gallery"], [class*="photos"]');
    if (galleries.length > 0) {
      detected.push({
        id: "gallery_main",
        label: "Photo Gallery",
        type: "gallery",
        selector: `.${galleries[0].className}`,
      });
    }

    setEditableFields(detected);
    toast({
      title: "Auto-detection complete",
      description: `Found ${detected.length} editable fields`,
    });
  };

  const addManualField = () => {
    const newField: EditableField = {
      id: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      selector: "",
    };
    setEditableFields([...editableFields, newField]);
  };

  const updateField = (id: string, updates: Partial<EditableField>) => {
    setEditableFields(fields =>
      fields.map(f => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeField = (id: string) => {
    setEditableFields(fields => fields.filter(f => f.id !== id));
  };

  const processAndSave = async () => {
    if (!templateName || !htmlContent || editableFields.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide template name, HTML content, and at least one editable field",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert colors to CSS variables
      let processedHtml = htmlContent;
      const colorRegex = /#[0-9A-Fa-f]{6}/g;
      const colors = htmlContent.match(colorRegex) || [];
      const uniqueColors = [...new Set(colors)];

      uniqueColors.forEach((color, idx) => {
        const varName = `--theme-color-${idx + 1}`;
        processedHtml = processedHtml.replace(
          new RegExp(color, "g"),
          `var(${varName}, ${color})`
        );
      });

      // Add injection points for countdown and gallery
      processedHtml = processedHtml.replace(
        /<body/,
        `<body data-has-countdown="true" data-has-gallery="true"`
      );

      // Create template in database
      const { error } = await supabase.from("templates").insert([{
        name_en: templateName,
        name_el: templateName,
        event_type: eventType,
        html_content: processedHtml,
        editable_fields: editableFields as any,
        is_active: true,
        has_countdown: editableFields.some(f => f.type === "date"),
        has_rsvp: true,
        has_location_map: editableFields.some(f => f.type === "location"),
      }]);

      if (error) throw error;

      toast({
        title: "Template processed successfully",
        description: "Template is ready for use",
      });

      navigate("/admin");
    } catch (error) {
      console.error("Error processing template:", error);
      toast({
        title: "Error",
        description: "Failed to process template",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Template Processor</h1>
          <p className="text-muted-foreground">
            Upload and process Envato templates to make them editable
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Template Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Elegant Wedding"
                  />
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={eventType} onValueChange={(v: any) => setEventType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="baptism">Baptism</SelectItem>
                      <SelectItem value="party">Party</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="htmlFile">Upload HTML Template</Label>
                  <div className="mt-2">
                    <Input
                      id="htmlFile"
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                {htmlContent && (
                  <Button onClick={autoDetectFields} className="w-full" variant="outline">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Auto-Detect Editable Fields
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Editable Fields</h2>
                <Button onClick={addManualField} size="sm">
                  Add Field
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {editableFields.map((field) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(type: any) => updateField(field.id, { type })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="time">Time</SelectItem>
                              <SelectItem value="location">Location</SelectItem>
                              <SelectItem value="color">Color</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="gallery">Gallery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">CSS Selector</Label>
                        <Input
                          value={field.selector}
                          onChange={(e) => updateField(field.id, { selector: e.target.value })}
                          placeholder=".class-name or #id"
                          className="h-8 font-mono text-xs"
                        />
                      </div>

                      <Button
                        onClick={() => removeField(field.id)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}

                {editableFields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No fields defined yet. Upload a template and use auto-detect or add manually.
                  </p>
                )}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                {previewMode ? "Hide Preview" : "Show Preview"}
              </Button>
              
              <Button
                onClick={processAndSave}
                disabled={isProcessing || !htmlContent || !templateName}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {isProcessing ? "Processing..." : "Save Template"}
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Preview</h2>
              
              {previewMode && htmlContent ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={htmlContent}
                    className="w-full h-[600px]"
                    title="Template Preview"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/50">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Upload a template to see preview
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
