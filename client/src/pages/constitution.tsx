import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ConstitutionEditor } from "@/components/constitution-editor";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ConstitutionPage() {
  const [content, setContent] = useState("");
  const [isModified, setIsModified] = useState(false);
  const { toast } = useToast();

  const { data: savedContent, isLoading } = useQuery<{ content: string }>({
    queryKey: ["/api/constitution"]
  });

  useEffect(() => {
    if (savedContent?.content) {
      setContent(savedContent.content);
    }
  }, [savedContent]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      await apiRequest("PUT", "/api/constitution", { content: newContent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/constitution"] });
      setIsModified(false);
      toast({
        title: "Constitution saved",
        description: "Your changes have been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save constitution. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleChange = (newContent: string) => {
    setContent(newContent);
    setIsModified(newContent !== savedContent?.content);
  };

  const handleSave = () => {
    saveMutation.mutate(content);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading constitution...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        <ConstitutionEditor
          content={content}
          onChange={handleChange}
          onSave={handleSave}
          isModified={isModified}
        />
      </div>
    </div>
  );
}
