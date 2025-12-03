import type { Context, Config } from "@netlify/functions";
import OpenAI from "openai";

// Library definitions with Maven coordinates
const LIBRARY_DEFINITIONS: Record<string, { name: string; maven: string; repository?: string }> = {
  vault: {
    name: "Vault",
    maven: `<dependency>
            <groupId>com.github.MilkBowl</groupId>
            <artifactId>VaultAPI</artifactId>
            <version>1.7</version>
            <scope>provided</scope>
        </dependency>`,
    repository: `<repository>
            <id>jitpack.io</id>
            <url>https://jitpack.io</url>
        </repository>`
  },
  jda: {
    name: "JDA (Discord)",
    maven: `<dependency>
            <groupId>net.dv8tion</groupId>
            <artifactId>JDA</artifactId>
            <version>5.0.0-beta.20</version>
        </dependency>`,
  },
  placeholderapi: {
    name: "PlaceholderAPI",
    maven: `<dependency>
            <groupId>me.clip</groupId>
            <artifactId>placeholderapi</artifactId>
            <version>2.11.5</version>
            <scope>provided</scope>
        </dependency>`,
    repository: `<repository>
            <id>placeholderapi</id>
            <url>https://repo.extendedclip.com/content/repositories/placeholderapi/</url>
        </repository>`
  },
  protocollib: {
    name: "ProtocolLib",
    maven: `<dependency>
            <groupId>com.comphenix.protocol</groupId>
            <artifactId>ProtocolLib</artifactId>
            <version>5.1.0</version>
            <scope>provided</scope>
        </dependency>`,
    repository: `<repository>
            <id>dmulloy2-repo</id>
            <url>https://repo.dmulloy2.net/repository/public/</url>
        </repository>`
  },
  worldedit: {
    name: "WorldEdit API",
    maven: `<dependency>
            <groupId>com.sk89q.worldedit</groupId>
            <artifactId>worldedit-bukkit</artifactId>
            <version>7.2.15</version>
            <scope>provided</scope>
        </dependency>`,
    repository: `<repository>
            <id>enginehub</id>
            <url>https://maven.enginehub.org/repo/</url>
        </repository>`
  },
  worldguard: {
    name: "WorldGuard API",
    maven: `<dependency>
            <groupId>com.sk89q.worldguard</groupId>
            <artifactId>worldguard-bukkit</artifactId>
            <version>7.0.9</version>
            <scope>provided</scope>
        </dependency>`,
    repository: `<repository>
            <id>enginehub</id>
            <url>https://maven.enginehub.org/repo/</url>
        </repository>`
  },
  citizens: {
    name: "Citizens API",
    maven: `<dependency>
            <groupId>net.citizensnpcs</groupId>
            <artifactId>citizens-main</artifactId>
            <version>2.0.33-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>`,
    repository: `<repository>
            <id>citizens-repo</id>
            <url>https://maven.citizensnpcs.co/repo</url>
        </repository>`
  },
  luckperms: {
    name: "LuckPerms API",
    maven: `<dependency>
            <groupId>net.luckperms</groupId>
            <artifactId>api</artifactId>
            <version>5.4</version>
            <scope>provided</scope>
        </dependency>`,
  }
};

interface PluginData {
  name: string;
  version: string;
  apiVersion: string;
  mainClass: string;
  description?: string;
  author?: string;
  hasCommands: boolean;
  hasEvents: boolean;
  hasConfig: boolean;
  libraries: string[];
  buildTool: "maven" | "gradle";
  aiPrompt?: string;
}

function generatePluginYml(data: PluginData): string {
  let yml = `name: ${data.name}
version: ${data.version}
main: ${data.mainClass}
api-version: ${data.apiVersion.split('.').slice(0, 2).join('.')}
authors: [${data.author || 'Unknown'}]
description: ${data.description || 'A Spigot plugin'}
`;

  if (data.hasCommands) {
    yml += `
commands:
  ${data.name.toLowerCase()}:
    description: Main plugin command
    usage: /${data.name.toLowerCase()} <args>
`;
  }

  if (data.libraries.includes('vault')) {
    yml += `
softdepend: [Vault]
`;
  }

  return yml;
}

function generatePomXml(data: PluginData, libs: { name: string; maven: string; repository?: string }[]): string {
  const repositories = new Set<string>();
  const dependencies: string[] = [];

  repositories.add(`<repository>
            <id>spigot-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>`);

  for (const lib of libs) {
    if (lib.repository) {
      repositories.add(lib.repository);
    }
    dependencies.push(lib.maven);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>${data.mainClass.substring(0, data.mainClass.lastIndexOf('.'))}</groupId>
    <artifactId>${data.name.toLowerCase()}</artifactId>
    <version>${data.version}</version>
    <packaging>jar</packaging>

    <name>${data.name}</name>
    <description>${data.description || 'A Spigot plugin'}</description>

    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        ${Array.from(repositories).join('\n        ')}
    </repositories>

    <dependencies>
        <dependency>
            <groupId>org.spigotmc</groupId>
            <artifactId>spigot-api</artifactId>
            <version>${data.apiVersion}-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
        ${dependencies.join('\n        ')}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.1</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
        </resources>
    </build>
</project>
`;
}

function generateBuildGradle(data: PluginData, libs: { name: string; maven: string; repository?: string }[]): string {
  const repositories: string[] = ['mavenCentral()', `maven { url = 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/' }`];
  const dependencies: string[] = [`compileOnly 'org.spigotmc:spigot-api:${data.apiVersion}-R0.1-SNAPSHOT'`];

  for (const lib of libs) {
    if (lib.repository) {
      const urlMatch = lib.repository.match(/<url>(.+?)<\/url>/);
      if (urlMatch) {
        repositories.push(`maven { url = '${urlMatch[1]}' }`);
      }
    }
    const groupMatch = lib.maven.match(/<groupId>(.+?)<\/groupId>/);
    const artifactMatch = lib.maven.match(/<artifactId>(.+?)<\/artifactId>/);
    const versionMatch = lib.maven.match(/<version>(.+?)<\/version>/);
    const scopeMatch = lib.maven.match(/<scope>(.+?)<\/scope>/);

    if (groupMatch && artifactMatch && versionMatch) {
      const scope = scopeMatch?.[1] === 'provided' ? 'compileOnly' : 'implementation';
      dependencies.push(`${scope} '${groupMatch[1]}:${artifactMatch[1]}:${versionMatch[1]}'`);
    }
  }

  return `plugins {
    id 'java'
    id 'com.github.johnrengelman.shadow' version '8.1.1'
}

group = '${data.mainClass.substring(0, data.mainClass.lastIndexOf('.'))}'
version = '${data.version}'

repositories {
    ${repositories.join('\n    ')}
}

dependencies {
    ${dependencies.join('\n    ')}
}

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(17))
}

processResources {
    filesMatching('plugin.yml') {
        expand(
            'version': project.version
        )
    }
}

shadowJar {
    archiveClassifier.set('')
}

build.dependsOn shadowJar
`;
}

function generateConfigYml(data: PluginData): string {
  return `# ${data.name} Configuration
# Version: ${data.version}

# General Settings
settings:
  debug: false
  prefix: "&7[&b${data.name}&7]&r "

# Messages
messages:
  no-permission: "&cYou don't have permission to do that!"
  player-only: "&cThis command can only be used by players!"
  reload-success: "&aConfiguration reloaded successfully!"

# Feature toggles
features:
  feature-one: true
  feature-two: false
`;
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data: PluginData = await req.json();

    // Validate required fields
    if (!data.name || !data.version || !data.apiVersion || !data.mainClass) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Set defaults
    data.hasCommands = data.hasCommands ?? true;
    data.hasEvents = data.hasEvents ?? true;
    data.hasConfig = data.hasConfig ?? true;
    data.libraries = data.libraries ?? [];
    data.buildTool = data.buildTool ?? "maven";

    const selectedLibs = data.libraries
      .filter(id => LIBRARY_DEFINITIONS[id])
      .map(id => LIBRARY_DEFINITIONS[id]);

    // Using Cerebras API with OpenAI-compatible SDK
    const cerebras = new OpenAI({
      apiKey: Netlify.env.get("CEREBRAS_API_KEY"),
      baseURL: "https://api.cerebras.ai/v1"
    });

    // Build the system prompt for Spigot plugin generation
    const systemPrompt = `You are an expert Minecraft Spigot plugin developer. Generate clean, production-ready Java code for Spigot plugins.

Rules:
1. Always use proper Spigot/Bukkit API patterns
2. Include ALL necessary imports
3. Follow Java naming conventions
4. Add helpful comments
5. Handle edge cases (null checks, player-only commands, etc.)
6. Use modern Spigot APIs for the specified version
7. Return ONLY the Java code, no markdown or explanation
8. Do not wrap code in markdown code blocks
${selectedLibs.length > 0 ? `9. The following libraries are available: ${selectedLibs.map(l => l.name).join(', ')}. Use them if relevant to the requirements.` : ''}`;

    const userPrompt = `Generate a Spigot plugin with these specifications:

Plugin Name: ${data.name}
Version: ${data.version}
Spigot API Version: ${data.apiVersion}
Main Class: ${data.mainClass}
${data.description ? `Description: ${data.description}` : ''}
${data.author ? `Author: ${data.author}` : ''}

Features:
- Commands: ${data.hasCommands ? 'Enabled' : 'Disabled'}
- Event Listeners: ${data.hasEvents ? 'Enabled' : 'Disabled'}
- Config: ${data.hasConfig ? 'Enabled' : 'Disabled'}
${selectedLibs.length > 0 ? `- Libraries: ${selectedLibs.map(l => l.name).join(', ')}` : ''}

${data.aiPrompt ? `Special Requirements:\n${data.aiPrompt}` : 'Create a basic plugin with standard setup.'}

Generate the complete Main.java class code. If commands are enabled, implement the onCommand method with the logic for the special requirements. If events are enabled, implement any necessary @EventHandler methods.`;

    const response = await cerebras.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    let mainJava = response.choices[0].message.content || "// Error: No code generated";
    mainJava = mainJava.replace(/^```java\n?/gm, '').replace(/^```\n?/gm, '').trim();

    // Generate plugin.yml
    const pluginYml = generatePluginYml(data);

    // Generate build file
    const buildFile = data.buildTool === "maven"
      ? generatePomXml(data, selectedLibs)
      : generateBuildGradle(data, selectedLibs);

    // Generate config.yml if enabled
    const configYml = data.hasConfig ? generateConfigYml(data) : null;

    const files: Record<string, string> = {
      [`src/main/java/${data.mainClass.replace(/\./g, '/')}.java`]: mainJava,
      'src/main/resources/plugin.yml': pluginYml,
      [data.buildTool === 'maven' ? 'pom.xml' : 'build.gradle']: buildFile,
    };

    if (configYml) {
      files['src/main/resources/config.yml'] = configYml;
    }

    return new Response(JSON.stringify({ files }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Plugin generation error:", error);

    return new Response(JSON.stringify({
      error: "Failed to generate plugin",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/generate-plugin"
};
