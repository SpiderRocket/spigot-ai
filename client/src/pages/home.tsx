import { useState } from "react";
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
  Check,
  ChevronRight
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

// --- Schema ---
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(32, "Name too long"),
  version: z.string().min(1, "Version is required"),
  apiVersion: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  mainClass: z.string().min(1, "Main class path is required"),
  
  // Features
  hasCommands: z.boolean().default(true),
  hasEvents: z.boolean().default(true),
  hasConfig: z.boolean().default(true),
  hasPermissions: z.boolean().default(false),
  
  // AI Prompt
  aiPrompt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// --- Mock Data ---
const SPIGOT_VERSIONS = [
  "1.20.4", "1.20.1", "1.19.4", "1.18.2", "1.17.1", "1.16.5", "1.12.2", "1.8.8"
];

// --- Components ---

function CodePreview({ code, language = "java" }: { code: string, language?: string }) {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-[#0d0d12]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a22] border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">{language === 'yaml' ? 'plugin.yml' : 'Main.java'}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <Download className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="h-[400px] w-full p-4">
        <pre className="font-mono text-sm text-blue-100 leading-relaxed">
          <code>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}

export default function Home() {
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "MyAwesomePlugin",
      version: "1.0.0",
      apiVersion: "1.20.4",
      description: "A generic Spigot plugin",
      author: "Steve",
      mainClass: "com.example.myawesomeplugin.Main",
      hasCommands: true,
      hasEvents: true,
      hasConfig: true,
      hasPermissions: false,
      aiPrompt: "",
    },
  });

  // Watch values for live preview updates
  const values = form.watch();

  const generatePlugin = async (data: FormValues) => {
    setIsGenerating(true);
    setActiveTab("code");
    
    // Simulate AI generation delay
    setTimeout(() => {
      // Basic "AI" logic simulation
      let aiLogic = "// Add your logic here";
      if (data.aiPrompt) {
        const prompt = data.aiPrompt.toLowerCase();
        if (prompt.includes("command") || prompt.includes("/welcome")) {
            aiLogic = `        // AI Generated Logic for: "${data.aiPrompt}"
        // Command implementation
        if (label.equalsIgnoreCase("welcome")) {
            if (sender instanceof Player) {
                Player player = (Player) sender;
                player.sendMessage(ChatColor.GREEN + "Welcome, " + player.getName() + "!");
            } else {
                sender.sendMessage("This command is only for players!");
            }
            return true;
        }`;
        } else if (prompt.includes("sword") || prompt.includes("lightning")) {
            aiLogic = `        // AI Generated Logic for: "${data.aiPrompt}"
        @EventHandler
        public void onEntityDamage(EntityDamageByEntityEvent event) {
            if (event.getDamager() instanceof Player) {
                Player player = (Player) event.getDamager();
                if (player.getInventory().getItemInMainHand().getType() == Material.DIAMOND_SWORD) {
                    event.getEntity().getWorld().strikeLightning(event.getEntity().getLocation());
                }
            }
        }`;
        } else {
             aiLogic = `        // AI Generated Logic for: "${data.aiPrompt}"
        // NOTE: This is a simulation. In a real app, this would call an LLM API.
        getLogger().info("AI Logic placeholder for: " + "${data.aiPrompt}");`;
        }
      }

      const javaCode = `package ${data.mainClass.substring(0, data.mainClass.lastIndexOf('.'))};

import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.entity.Player;
${data.hasCommands ? 'import org.bukkit.command.Command;\nimport org.bukkit.command.CommandSender;' : ''}
${data.hasEvents ? 'import org.bukkit.event.Listener;\nimport org.bukkit.event.EventHandler;\nimport org.bukkit.event.entity.EntityDamageByEntityEvent;' : ''}

public final class ${data.mainClass.split('.').pop()} extends JavaPlugin${data.hasEvents ? ' implements Listener' : ''} {

    @Override
    public void onEnable() {
        // Plugin startup logic
        getLogger().info("${data.name} has been enabled!");
        
        ${data.hasConfig ? 'saveDefaultConfig();' : ''}
        ${data.hasEvents ? 'getServer().getPluginManager().registerEvents(this, this);' : ''}
    }

    @Override
    public void onDisable() {
        // Plugin shutdown logic
        getLogger().info("${data.name} has been disabled!");
    }
    
    ${data.hasCommands ? `
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equalsIgnoreCase("hello")) {
            sender.sendMessage("Hello from ${data.name}!");
            return true;
        }
        
${aiLogic.includes("Command implementation") ? aiLogic : ''}
        
        return false;
    }` : ''}

${!aiLogic.includes("Command implementation") && data.aiPrompt ? aiLogic : ''}
}
`;
      setGeneratedCode(javaCode);
      setIsGenerating(false);
    }, 1500);
  };

  const yamlCode = `name: ${values.name}
version: ${values.version}
main: ${values.mainClass}
api-version: ${values.apiVersion.split('.').slice(0, 2).join('.')}
authors: [${values.author}]
description: ${values.description}
${values.hasCommands ? `
commands:
  hello:
    description: A simple hello command
    usage: /hello` : ''}
${values.hasPermissions ? `
permissions:
  ${values.name.toLowerCase()}.use:
    description: Allows use of the plugin
    default: true` : ''}
`;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <header className="mb-12 text-center md:text-left md:flex md:justify-between md:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-white/5 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">v2.0.0 Beta</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
              SpigotForge <span className="text-primary">AI</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Generate production-ready Spigot plugins in seconds using advanced AI models. 
              Describe your mechanics, and let us handle the NMS.
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Wizard */}
          <div className="lg:col-span-5 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(generatePlugin)} className="space-y-8">
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hammer className="w-5 h-5 text-primary" />
                      Plugin Configuration
                    </CardTitle>
                    <CardDescription>
                      Define the core metadata for your Spigot plugin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plugin Name</FormLabel>
                            <FormControl>
                              <Input placeholder="SuperSmash" {...field} className="bg-secondary/50 border-white/10 focus:border-primary/50 transition-colors" />
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
                            <FormLabel>Spigot Version</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-secondary/50 border-white/10">
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
                          <FormLabel>Main Class Package</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Box className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="com.studio.plugin.Main" {...field} className="pl-9 bg-secondary/50 border-white/10 font-mono text-xs" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Modules & Features</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <FormField
                          control={form.control}
                          name="hasCommands"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-secondary/30 p-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Terminal className="w-4 h-4 text-accent" />
                                  <FormLabel className="text-base">Commands</FormLabel>
                                </div>
                                <FormDescription className="text-xs">
                                  Enable CommandExecutor implementation
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="hasEvents"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-secondary/30 p-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-yellow-400" />
                                  <FormLabel className="text-base">Events</FormLabel>
                                </div>
                                <FormDescription className="text-xs">
                                  Register Listener interface
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl shadow-2xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Cpu className="w-5 h-5" />
                      AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="aiPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe specific mechanics: e.g., 'Create a sword that strikes lightning when hitting a creeper'..." 
                              className="min-h-[120px] bg-background/50 border-primary/20 focus:border-primary resize-none"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-12 text-lg font-medium group"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Forging...
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
          <div className="lg:col-span-7 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1">
                <TabsTrigger value="builder">
                  <Layers className="w-4 h-4 mr-2" /> Preview
                </TabsTrigger>
                <TabsTrigger value="code">
                  <FileCode className="w-4 h-4 mr-2" /> Source
                </TabsTrigger>
                <TabsTrigger value="assets" disabled>
                  <Box className="w-4 h-4 mr-2" /> Assets
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="builder" className="mt-4">
                <div className="space-y-4">
                  <Card className="bg-[#0d0d12] border-border">
                    <CardHeader className="pb-2 border-b border-border bg-secondary/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono text-muted-foreground">src/main/resources/plugin.yml</CardTitle>
                        <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">YAML</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CodePreview code={yamlCode} language="yaml" />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="mt-4">
                <AnimatePresence mode="wait">
                  {generatedCode ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="bg-[#0d0d12] border-border">
                        <CardHeader className="pb-2 border-b border-border bg-secondary/10">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-mono text-muted-foreground">src/main/java/Main.java</CardTitle>
                            <Badge variant="outline" className="font-mono text-xs border-yellow-500/30 text-yellow-500">JAVA</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <CodePreview code={generatedCode} language="java" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 text-muted-foreground">
                      <Code className="w-12 h-12 mb-4 opacity-20" />
                      <p>Generate code to view source</p>
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-1">Instant Boilerplate</h3>
                <p className="text-sm text-muted-foreground">Skip the 20 minutes of setup. get a compiling `plugin.yml` and Main class instantly.</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 text-accent">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-1">AI-Powered Logic</h3>
                <p className="text-sm text-muted-foreground">Describe mechanics in plain English and let our fine-tuned models write the Spigot API calls.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
