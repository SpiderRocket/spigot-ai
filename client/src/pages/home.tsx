import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Box, 
  Code, 
  Cpu, 
  Download, 
  FileCode, 
  Hammer, 
  Layers, 
  Sparkles, 
  Terminal, 
  Zap,
  ChevronRight,
  Package,
  FolderArchive,
  Save,
  File,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// --- Schema ---
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(32, "Name too long"),
  version: z.string().min(1, "Version is required"),
  apiVersion: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  mainClass: z.string().min(1, "Main class path is required"),
  hasCommands: z.boolean().default(true),
  hasEvents: z.boolean().default(true),
  hasConfig: z.boolean().default(true),
  libraries: z.array(z.string()).default([]),
  buildTool: z.enum(["maven", "gradle"]).default("maven"),
  aiPrompt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// --- Mock Data ---
const SPIGOT_VERSIONS = [
  "1.20.4", "1.20.1", "1.19.4", "1.18.2", "1.17.1", "1.16.5", "1.12.2", "1.8.8"
];

interface Library {
  id: string;
  name: string;
}

// --- Components ---

function CodeEditor({ 
  code, 
  onChange, 
  filename,
  language = "java" 
}: { 
  code: string; 
  onChange: (code: string) => void;
  filename: string;
  language?: string;
}) {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-[#0d0d12]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a22] border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">{filename}</span>
        </div>
        <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary uppercase">
          {language}
        </Badge>
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[400px] bg-transparent text-blue-100 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-0 border-0"
        spellCheck={false}
        data-testid={`editor-${filename.replace(/[^a-z0-9]/gi, '-')}`}
      />
    </div>
  );
}

function FileTree({ files, activeFile, onSelect }: { 
  files: Record<string, string>; 
  activeFile: string;
  onSelect: (path: string) => void;
}) {
  const paths = Object.keys(files);
  
  return (
    <div className="bg-card/50 border border-border rounded-lg p-2 space-y-1">
      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">Files</div>
      {paths.map((path) => {
        const filename = path.split('/').pop() || path;
        const isActive = path === activeFile;
        return (
          <button
            key={path}
            onClick={() => onSelect(path)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
              isActive 
                ? 'bg-primary/20 text-primary' 
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
            data-testid={`file-${filename.replace(/[^a-z0-9]/gi, '-')}`}
          >
            <File className="w-4 h-4 shrink-0" />
            <span className="truncate font-mono text-xs">{filename}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "MyAwesomePlugin",
      version: "1.0.0",
      apiVersion: "1.20.4",
      description: "A powerful Spigot plugin",
      author: "Developer",
      mainClass: "com.example.myawesomeplugin.Main",
      hasCommands: true,
      hasEvents: true,
      hasConfig: true,
      libraries: [],
      buildTool: "maven",
      aiPrompt: "",
    },
  });

  // Fetch available libraries
  useEffect(() => {
    fetch("/api/libraries")
      .then(res => res.json())
      .then(setLibraries)
      .catch(console.error);
  }, []);

  const values = form.watch();

  const generatePlugin = async (data: FormValues) => {
    setIsGenerating(true);
    setActiveTab("code");
    
    try {
      const response = await fetch("/api/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to generate plugin");
      }

      const result = await response.json();
      setGeneratedFiles(result.files);
      
      // Set the first file as active
      const firstFile = Object.keys(result.files)[0];
      if (firstFile) setActiveFile(firstFile);
    } catch (error) {
      console.error("Generation error:", error);
      setGeneratedFiles({
        'error.txt': `Error generating plugin: ${error instanceof Error ? error.message : 'Unknown error'}\nPlease check your API key and try again.`
      });
      setActiveFile('error.txt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (path: string, content: string) => {
    setGeneratedFiles(prev => ({
      ...prev,
      [path]: content
    }));
  };

  const downloadPlugin = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/download-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          files: generatedFiles, 
          pluginName: values.name 
        }),
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${values.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const yamlCode = `name: ${values.name}
version: ${values.version}
main: ${values.mainClass}
api-version: ${values.apiVersion.split('.').slice(0, 2).join('.')}
authors: [${values.author}]
description: ${values.description}
${values.hasCommands ? `
commands:
  ${values.name.toLowerCase()}:
    description: Main plugin command
    usage: /${values.name.toLowerCase()} <args>` : ''}
`;

  const getFileLanguage = (path: string): string => {
    if (path.endsWith('.java')) return 'java';
    if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml';
    if (path.endsWith('.xml')) return 'xml';
    if (path.endsWith('.gradle')) return 'gradle';
    return 'text';
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center md:text-left md:flex md:justify-between md:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-white/5 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">v2.0.0 Beta</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
              SpigotForge <span className="text-primary">AI</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-lg">
              Generate production-ready Spigot plugins with AI. Full project structure included.
            </p>
          </div>
          
          <div className="hidden md:flex gap-4 mt-6 md:mt-0">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-mono">
                  U{i}
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground flex flex-col justify-center">
              <span className="font-bold text-foreground">1,200+</span>
              <span>Plugins Generated</span>
            </div>
          </div>
        </header>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Wizard */}
          <div className="lg:col-span-4 space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(generatePlugin)} className="space-y-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Hammer className="w-5 h-5 text-primary" />
                      Plugin Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Plugin Name</FormLabel>
                            <FormControl>
                              <Input placeholder="SuperSmash" {...field} className="bg-secondary/50 border-white/10 h-9 text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="apiVersion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Spigot Version</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-secondary/50 border-white/10 h-9 text-sm">
                                  <SelectValue placeholder="Select version" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SPIGOT_VERSIONS.map(ver => (
                                  <SelectItem key={ver} value={ver}>{ver}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="mainClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Main Class Package</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Box className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="com.studio.plugin.Main" {...field} className="pl-9 bg-secondary/50 border-white/10 font-mono text-xs h-9" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="buildTool"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Build Tool</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-secondary/50 border-white/10 h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="maven">Maven (pom.xml)</SelectItem>
                              <SelectItem value="gradle">Gradle (build.gradle)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="hasCommands"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border border-white/5 bg-secondary/30 p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-xs !mt-0">Commands</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hasEvents"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border border-white/5 bg-secondary/30 p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-xs !mt-0">Events</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hasConfig"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-lg border border-white/5 bg-secondary/30 p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-xs !mt-0">Config</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Libraries Card */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="w-5 h-5 text-accent" />
                      Libraries & Dependencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="libraries"
                      render={() => (
                        <FormItem>
                          <div className="grid grid-cols-2 gap-2">
                            {libraries.map((lib) => (
                              <FormField
                                key={lib.id}
                                control={form.control}
                                name="libraries"
                                render={({ field }) => (
                                  <FormItem className="flex items-center gap-2 p-2 rounded border border-white/5 bg-secondary/20">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(lib.id)}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...(field.value || []), lib.id]
                                            : (field.value || []).filter((id) => id !== lib.id);
                                          field.onChange(newValue);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs font-normal cursor-pointer !mt-0">
                                      {lib.name}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* AI Prompt Card */}
                <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl shadow-2xl shadow-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-primary text-lg">
                      <Cpu className="w-5 h-5" />
                      AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="aiPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your plugin: e.g., 'Create a /fly command that toggles flight mode and costs 100 coins using Vault economy'" 
                              className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary resize-none text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11 text-base font-medium group"
                      disabled={isGenerating}
                      data-testid="button-generate"
                    >
                      {isGenerating ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Generate Plugin <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          {/* Right Panel: Preview & Output */}
          <div className="lg:col-span-8 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-secondary/50 p-1">
                  <TabsTrigger value="builder">
                    <Layers className="w-4 h-4 mr-2" /> Preview
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <FileCode className="w-4 h-4 mr-2" /> Editor
                  </TabsTrigger>
                </TabsList>

                {Object.keys(generatedFiles).length > 0 && (
                  <Button 
                    onClick={downloadPlugin} 
                    disabled={isDownloading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    data-testid="button-download"
                  >
                    {isDownloading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Preparing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <FolderArchive className="w-4 h-4" />
                        Download ZIP
                      </span>
                    )}
                  </Button>
                )}
              </div>
              
              <TabsContent value="builder" className="mt-0">
                <Card className="bg-[#0d0d12] border-border">
                  <CardHeader className="pb-2 border-b border-border bg-secondary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono text-muted-foreground">src/main/resources/plugin.yml</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">YAML</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] w-full p-4">
                      <pre className="font-mono text-sm text-blue-100 leading-relaxed">
                        <code>{yamlCode}</code>
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="code" className="mt-0">
                <AnimatePresence mode="wait">
                  {Object.keys(generatedFiles).length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="grid grid-cols-12 gap-4"
                    >
                      <div className="col-span-3">
                        <FileTree 
                          files={generatedFiles} 
                          activeFile={activeFile}
                          onSelect={setActiveFile}
                        />
                      </div>
                      <div className="col-span-9">
                        {activeFile && generatedFiles[activeFile] && (
                          <CodeEditor
                            code={generatedFiles[activeFile]}
                            onChange={(code) => handleFileChange(activeFile, code)}
                            filename={activeFile.split('/').pop() || activeFile}
                            language={getFileLanguage(activeFile)}
                          />
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 text-muted-foreground">
                      <Code className="w-12 h-12 mb-4 opacity-20" />
                      <p>Generate a plugin to view and edit files</p>
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-1">Full Project</h3>
                <p className="text-xs text-muted-foreground">Complete Maven/Gradle setup with all dependencies configured.</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 text-accent">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-1">AI-Powered</h3>
                <p className="text-xs text-muted-foreground">Describe any feature and watch real code get generated.</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-yellow-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-3 text-yellow-500">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-1">Library Support</h3>
                <p className="text-xs text-muted-foreground">JDA, Vault, PlaceholderAPI, and more pre-configured.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
