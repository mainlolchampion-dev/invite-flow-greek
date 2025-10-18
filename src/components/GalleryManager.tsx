import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface GalleryManagerProps {
  onImagesUpload: (images: string[]) => void;
}

export const GalleryManager = ({ onImagesUpload }: GalleryManagerProps) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} δεν είναι εικόνα`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newImages.push(result);
        processedCount++;

        if (processedCount === files.length) {
          const allImages = [...uploadedImages, ...newImages];
          setUploadedImages(allImages);
          onImagesUpload(allImages);
          toast.success(`${newImages.length} φωτογραφίες προστέθηκαν`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    onImagesUpload(newImages);
    toast.info("Η φωτογραφία αφαιρέθηκε");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Φωτογραφίες
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload Button */}
        <div>
          <Label htmlFor="gallery-upload" className="text-xs mb-2 block">
            Ανέβασε Φωτογραφίες
          </Label>
          <label
            htmlFor="gallery-upload"
            className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Κλικ ή σύρε φωτογραφίες
            </span>
          </label>
          <input
            id="gallery-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Uploaded Images Grid */}
        {uploadedImages.length > 0 && (
          <div>
            <Label className="text-xs mb-2 block">
              Φωτογραφίες ({uploadedImages.length})
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedImages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Δεν έχουν ανέβει φωτογραφίες ακόμα
          </p>
        )}
      </CardContent>
    </Card>
  );
};
