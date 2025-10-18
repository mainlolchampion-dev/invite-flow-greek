import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Undo } from "lucide-react";
import { toast } from "sonner";

interface VisualEditorProps {
  html: string;
  onSave: (html: string) => void;
  isSaving?: boolean;
}

export const VisualEditor = ({ html, onSave, isSaving }: VisualEditorProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingElement, setEditingElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!iframeRef.current || !html) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for iframe to load
    const initEditor = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Add custom styles for editing mode
      const style = iframeDoc.createElement('style');
      style.textContent = `
        .lovable-editable-text:hover {
          outline: 2px dashed #8B5CF6 !important;
          outline-offset: 2px !important;
          cursor: text !important;
        }
        .lovable-editable-image:hover {
          outline: 2px dashed #8B5CF6 !important;
          outline-offset: 2px !important;
          cursor: pointer !important;
        }
        .lovable-editing {
          outline: 3px solid #8B5CF6 !important;
          outline-offset: 2px !important;
        }
        * {
          -webkit-user-select: text !important;
          user-select: text !important;
        }
      `;
      iframeDoc.head.appendChild(style);

      // Make text elements editable
      const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, li, td, th, label, button');
      textElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        
        // Skip if element contains images or other complex content
        if (htmlEl.querySelector('img, video, iframe, svg')) return;
        
        htmlEl.classList.add('lovable-editable-text');
        
        htmlEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Remove editing class from previous element
          if (editingElement && editingElement !== htmlEl) {
            editingElement.classList.remove('lovable-editing');
            editingElement.contentEditable = 'false';
          }
          
          htmlEl.classList.add('lovable-editing');
          htmlEl.contentEditable = 'true';
          htmlEl.focus();
          setEditingElement(htmlEl);
          setHasChanges(true);
        });

        htmlEl.addEventListener('blur', () => {
          htmlEl.classList.remove('lovable-editing');
          htmlEl.contentEditable = 'false';
        });
      });

      // Make images editable
      const images = iframeDoc.querySelectorAll('img');
      images.forEach((img) => {
        img.classList.add('lovable-editable-image');
        
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Create file input
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';
          
          fileInput.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              img.src = result;
              setHasChanges(true);
              toast.success('Η εικόνα άλλαξε - πάτησε Αποθήκευση');
            };
            reader.readAsDataURL(file);
          };
          
          fileInput.click();
        });
      });

      // Handle clicks outside editable elements
      iframeDoc.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.classList.contains('lovable-editable-text') && editingElement) {
          editingElement.classList.remove('lovable-editing');
          editingElement.contentEditable = 'false';
          setEditingElement(null);
        }
      });
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      initEditor();
    } else {
      iframe.onload = initEditor;
    }
  }, [html]);

  const handleSave = () => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Remove editing classes before saving
    doc.querySelectorAll('.lovable-editable-text, .lovable-editable-image').forEach(el => {
      el.classList.remove('lovable-editable-text', 'lovable-editable-image', 'lovable-editing');
      (el as HTMLElement).contentEditable = 'false';
    });

    // Remove custom style
    const customStyle = doc.querySelector('style[data-custom]');
    if (customStyle) customStyle.remove();

    const modifiedHtml = doc.documentElement.outerHTML;
    onSave(modifiedHtml);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
    setHasChanges(false);
    toast.info('Οι αλλαγές ακυρώθηκαν');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Κάντε κλικ σε κείμενα για επεξεργασία ή σε εικόνες για αλλαγή
        </p>
        <div className="flex gap-2">
          {hasChanges && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleReset}
            >
              <Undo className="mr-2 h-4 w-4" />
              Ακύρωση
            </Button>
          )}
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Αποθήκευση..." : "Αποθήκευση"}
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          className="w-full h-[calc(100vh-300px)] min-h-[700px]"
          sandbox="allow-same-origin allow-scripts"
          title="Visual Editor"
        />
      </div>
    </div>
  );
};
