import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

interface SchemeLink {
  id: string;
  name: string;
  apply_url: string;
}

function loadAllSchemeLinks(): SchemeLink[] {
  const baseDir = join(process.cwd(), "data/schemes");
  const links: SchemeLink[] = [];

  function walk(dir: string) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".json")) {
        try {
          const scheme = JSON.parse(readFileSync(fullPath, "utf-8"));
          if (scheme.id && scheme.apply_url) {
            links.push({
              id: scheme.id,
              name: scheme.name.en || scheme.name.hi,
              apply_url: scheme.apply_url,
            });
          }
        } catch {}
      }
    }
  }

  walk(baseDir);
  return links;
}

async function verifyLinks() {
  console.log("🔍 Checking all scheme portal links...");
  const links = loadAllSchemeLinks();
  console.log(`Found ${links.length} scheme URLs to verify.\n`);

  let validCount = 0;
  for (const item of links) {
    try {
      const url = new URL(item.apply_url);
      if (url.protocol === "https:") {
        validCount++;
        console.log(`✓ [${item.id}] ${item.apply_url}`);
      } else {
        console.warn(`⚠ [${item.id}] Insecure protocol: ${item.apply_url}`);
      }
    } catch {
      console.error(`✗ [${item.id}] Invalid URL format: ${item.apply_url}`);
    }
  }

  console.log(`\n✅ Link format verification complete: ${validCount}/${links.length} links are valid HTTPS URLs.`);
}

verifyLinks();
