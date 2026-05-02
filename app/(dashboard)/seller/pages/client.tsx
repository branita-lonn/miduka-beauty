"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type PageData = {
  slug: string;
  title: string;
  content: string;
};

export default function EditorClient({ initialPages }: { initialPages: Record<string, PageData> }) {
  const [pages, setPages] = useState(initialPages);
  const [activeTab, setActiveTab] = useState("about");
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (slug: string) => {
    setIsSaving(true);
    try {
      const page = pages[slug];
      const res = await fetch(`/api/seller/pages/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: page.title, content: page.content }),
      });

      if (!res.ok) throw new Error("Failed to save page");

      toast.success("Page updated successfully");
    } catch (error) {
      toast.error("Failed to update page");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePage = (slug: string, field: "title" | "content", value: string) => {
    setPages((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [field]: value },
    }));
  };

  const renderTabContent = (slug: string) => {
    const page = pages[slug];
    return (
      <div className="space-y-6 mt-6">
        <div className="space-y-2">
          <Label htmlFor={`${slug}-title`}>Page Title</Label>
          <Input
            id={`${slug}-title`}
            value={page.title}
            onChange={(e) => updatePage(slug, "title", e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id={`${slug}-preview-mode`}
            checked={previewMode}
            onCheckedChange={setPreviewMode}
          />
          <Label htmlFor={`${slug}-preview-mode`}>Preview Mode</Label>
        </div>

        {previewMode ? (
          <div className="prose dark:prose-invert max-w-none p-4 border rounded-md min-h-[300px]">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`${slug}-content`}>Markdown Content</Label>
            <Textarea
              id={`${slug}-content`}
              className="min-h-[300px] font-mono text-sm"
              value={page.content}
              onChange={(e) => updatePage(slug, "content", e.target.value)}
            />
          </div>
        )}

        <Button onClick={() => handleSave(slug)} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="returns">Returns Policy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about">{renderTabContent("about")}</TabsContent>
        <TabsContent value="contact">{renderTabContent("contact")}</TabsContent>
        <TabsContent value="privacy">{renderTabContent("privacy")}</TabsContent>
        <TabsContent value="returns">{renderTabContent("returns")}</TabsContent>
      </Tabs>
    </div>
  );
}
