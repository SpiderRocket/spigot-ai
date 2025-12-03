import type { Context, Config } from "@netlify/functions";

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

export default async (req: Request, context: Context) => {
  const libraries = Object.entries(LIBRARY_DEFINITIONS).map(([id, lib]) => ({
    id,
    name: lib.name
  }));

  return new Response(JSON.stringify(libraries), {
    headers: { "Content-Type": "application/json" }
  });
};

export const config: Config = {
  path: "/api/libraries"
};
