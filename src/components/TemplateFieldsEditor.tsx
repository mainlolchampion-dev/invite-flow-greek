import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Upload, Save } from "lucide-react";
import { toast } from "sonner";

interface TemplateField {
  brideFirstName: string;
  brideBio: string;
  groomFirstName: string;
  groomBio: string;
  ceremonyDate: string;
  ceremonyTime: string;
  ceremonyLocation: string;
  ceremonyAddress: string;
  receptionDate: string;
  receptionTime: string;
  receptionLocation: string;
  receptionAddress: string;
  rsvpDeadline: string;
  proposalStory: string;
}

interface TemplateFieldsEditorProps {
  html: string;
  onUpdate: (updatedHtml: string) => void;
}

export const TemplateFieldsEditor = ({ html, onUpdate }: TemplateFieldsEditorProps) => {
  const [fields, setFields] = useState<TemplateField>({
    brideFirstName: "Milea",
    brideBio: "I am just crazy about Dilan. He has a truly amazing heart...",
    groomFirstName: "Dilan",
    groomBio: "Milea means so much to me and I can't believe she is actually going to marry me...",
    ceremonyDate: "Sunday - September 13th, 2021",
    ceremonyTime: "09:00am - 10:00am",
    ceremonyLocation: "St. Patrick's Catholic Church",
    ceremonyAddress: "619 10th Street NW, Washington, DC",
    receptionDate: "Sunday - September 13th, 2021",
    receptionTime: "06:00pm - 10:00pm",
    receptionLocation: "The Mayflower Hotel",
    receptionAddress: "620 11th Street NW, Washington, DC",
    rsvpDeadline: "November 21, 2023",
    proposalStory: "He proposed on a Scrabble board..."
  });

  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [brideImage, setBrideImage] = useState<string | null>(null);
  const [groomImage, setGroomImage] = useState<string | null>(null);

  const handleFieldChange = (field: keyof TemplateField, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setImage: (img: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImage(result);
      toast.success("Η εικόνα φορτώθηκε");
    };
    reader.readAsDataURL(file);
  };

  const applyChangesToHtml = () => {
    let updatedHtml = html;

    // Replace bride name
    updatedHtml = updatedHtml.replace(
      /<h2 class="font-alt fw-bold m-0">Milea<\/h2>/g,
      `<h2 class="font-alt fw-bold m-0" data-editable="bride-name">${fields.brideFirstName}</h2>`
    );

    // Replace groom name
    updatedHtml = updatedHtml.replace(
      /<h2 class="font-alt fw-bold m-0">Dilan<\/h2>/g,
      `<h2 class="font-alt fw-bold m-0" data-editable="groom-name">${fields.groomFirstName}</h2>`
    );

    // Replace bride full name in couple section
    updatedHtml = updatedHtml.replace(
      /<h5 class="font-alt fw-bold text-uppercase">Jane Milea<\/h5>/g,
      `<h5 class="font-alt fw-bold text-uppercase" data-editable="bride-fullname">Jane ${fields.brideFirstName}</h5>`
    );

    // Replace groom full name in couple section
    updatedHtml = updatedHtml.replace(
      /<h5 class="font-alt fw-bold text-uppercase">John Dilan<\/h5>/g,
      `<h5 class="font-alt fw-bold text-uppercase" data-editable="groom-fullname">John ${fields.groomFirstName}</h5>`
    );

    // Replace ceremony details
    updatedHtml = updatedHtml.replace(
      /Sunday - September 13th, 2021<br>\s*09:00am - 10:00am/g,
      `${fields.ceremonyDate}<br>\n                                ${fields.ceremonyTime}`
    );

    updatedHtml = updatedHtml.replace(
      /St\. Patrick's Catholic Church<br>\s*619 10th Street NW, Washington, DC/g,
      `${fields.ceremonyLocation}<br>\n                                ${fields.ceremonyAddress}`
    );

    // Replace reception details
    updatedHtml = updatedHtml.replace(
      /Sunday - September 13th, 2021<br>\s*06:00pm - 10:00pm/g,
      `${fields.receptionDate}<br>\n                                ${fields.receptionTime}`
    );

    updatedHtml = updatedHtml.replace(
      /The Mayflower Hotel<br>\s*620 11th Street NW, Washington, DC/g,
      `${fields.receptionLocation}<br>\n                                ${fields.receptionAddress}`
    );

    // Replace RSVP deadline
    updatedHtml = updatedHtml.replace(
      /Please RSVP by November 21, 2023\./g,
      `Please RSVP by ${fields.rsvpDeadline}.`
    );

    // Replace images if uploaded
    if (heroImage) {
      updatedHtml = updatedHtml.replace(
        /https:\/\/demo\.lucky-roo\.com\/dahlia-v1\.0\/images\/the-couple-hero\.jpg/g,
        heroImage
      );
    }

    if (brideImage) {
      updatedHtml = updatedHtml.replace(
        /https:\/\/demo\.lucky-roo\.com\/dahlia-v1\.0\/images\/the-couple-1\.jpg/g,
        brideImage
      );
    }

    if (groomImage) {
      updatedHtml = updatedHtml.replace(
        /https:\/\/demo\.lucky-roo\.com\/dahlia-v1\.0\/images\/the-couple-2\.jpg/g,
        groomImage
      );
    }

    onUpdate(updatedHtml);
    toast.success("Οι αλλαγές εφαρμόστηκαν στο template!");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Πεδία Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Couple Names */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">👰‍♀️ Νύφη & Γαμπρός</h3>
          <div className="space-y-2">
            <Label className="text-xs">Όνομα Νύφης</Label>
            <Input
              value={fields.brideFirstName}
              onChange={(e) => handleFieldChange("brideFirstName", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. Μαρία"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Βιογραφικό Νύφης</Label>
            <Textarea
              value={fields.brideBio}
              onChange={(e) => handleFieldChange("brideBio", e.target.value)}
              className="text-sm min-h-[60px]"
              placeholder="Σύντομο βιογραφικό..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Όνομα Γαμπρού</Label>
            <Input
              value={fields.groomFirstName}
              onChange={(e) => handleFieldChange("groomFirstName", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. Γιώργος"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Βιογραφικό Γαμπρού</Label>
            <Textarea
              value={fields.groomBio}
              onChange={(e) => handleFieldChange("groomBio", e.target.value)}
              className="text-sm min-h-[60px]"
              placeholder="Σύντομο βιογραφικό..."
            />
          </div>
        </div>

        <Separator />

        {/* Images */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">📸 Εικόνες</h3>
          
          <div className="space-y-2">
            <Label className="text-xs">Hero Image</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setHeroImage)}
                className="h-8 text-xs"
              />
              {heroImage && <span className="text-xs text-green-600">✓</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Φωτογραφία Νύφης</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setBrideImage)}
                className="h-8 text-xs"
              />
              {brideImage && <span className="text-xs text-green-600">✓</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Φωτογραφία Γαμπρού</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setGroomImage)}
                className="h-8 text-xs"
              />
              {groomImage && <span className="text-xs text-green-600">✓</span>}
            </div>
          </div>
        </div>

        <Separator />

        {/* Ceremony Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">⛪ Τελετή</h3>
          <div className="space-y-2">
            <Label className="text-xs">Ημερομηνία</Label>
            <Input
              value={fields.ceremonyDate}
              onChange={(e) => handleFieldChange("ceremonyDate", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. Κυριακή 13 Σεπτεμβρίου 2021"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Ώρα</Label>
            <Input
              value={fields.ceremonyTime}
              onChange={(e) => handleFieldChange("ceremonyTime", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. 09:00πμ - 10:00πμ"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Τοποθεσία</Label>
            <Input
              value={fields.ceremonyLocation}
              onChange={(e) => handleFieldChange("ceremonyLocation", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. Εκκλησία Αγίου Γεωργίου"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Διεύθυνση</Label>
            <Input
              value={fields.ceremonyAddress}
              onChange={(e) => handleFieldChange("ceremonyAddress", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. Πλατεία Συντάγματος 1, Αθήνα"
            />
          </div>
        </div>

        <Separator />

        {/* Reception Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">🎉 Δεξίωση</h3>
          <div className="space-y-2">
            <Label className="text-xs">Ημερομηνία</Label>
            <Input
              value={fields.receptionDate}
              onChange={(e) => handleFieldChange("receptionDate", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. Κυριακή 13 Σεπτεμβρίου 2021"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Ώρα</Label>
            <Input
              value={fields.receptionTime}
              onChange={(e) => handleFieldChange("receptionTime", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. 18:00μμ - 22:00μμ"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Τοποθεσία</Label>
            <Input
              value={fields.receptionLocation}
              onChange={(e) => handleFieldChange("receptionLocation", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. Κτήμα Paradise"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Διεύθυνση</Label>
            <Input
              value={fields.receptionAddress}
              onChange={(e) => handleFieldChange("receptionAddress", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. Λεωφ. Κηφισίας 100, Μαρούσι"
            />
          </div>
        </div>

        <Separator />

        {/* RSVP */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">📅 RSVP</h3>
          <div className="space-y-2">
            <Label className="text-xs">Καταληκτική Ημερομηνία</Label>
            <Input
              value={fields.rsvpDeadline}
              onChange={(e) => handleFieldChange("rsvpDeadline", e.target.value)}
              className="h-8 text-sm"
              placeholder="π.χ. 21 Νοεμβρίου 2023"
            />
          </div>
        </div>

        <Separator />

        {/* Apply Button */}
        <Button 
          onClick={applyChangesToHtml}
          className="w-full"
          size="sm"
        >
          <Save className="mr-2 h-4 w-4" />
          Εφαρμογή Αλλαγών
        </Button>
      </CardContent>
    </Card>
  );
};
