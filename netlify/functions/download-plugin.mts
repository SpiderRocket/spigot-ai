import type { Context, Config } from "@netlify/functions";
import JSZip from "jszip";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { files, pluginName } = await req.json();

    const zip = new JSZip();

    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content as string);
    }

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${pluginName || 'plugin'}.zip"`,
        "Content-Length": zipBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    return new Response(JSON.stringify({ error: "Failed to create download" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/download-plugin"
};
