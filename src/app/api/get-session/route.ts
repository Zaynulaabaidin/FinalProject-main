import { getSessionFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";
import { tryCatch } from "@/lib/try-catch";
import { getConfig } from "@/flags";


type AdRequestBody = {
  adType: "image" | "video";
  prompt?: string;
  slogan?: string;
  website?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  // File cannot be sent via JSON; use an upload endpoint. Keep placeholder as unknown|null.
  logoFile?: unknown | null;
  generateMissingAssets: boolean;
};

// ====== GET: Return session + config ======
export async function GET(): Promise<NextResponse> {
  const { data: session, error } = await tryCatch(getSessionFromCookie());
  const config = await getConfig();

  const headers = new Headers();
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  if (error) {
    return NextResponse.json({ session: null, config }, { headers });
  }

  return NextResponse.json({ session, config }, { headers });
}

// ====== POST: Generate Ad ======
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: AdRequestBody = await req.json();
    const { adType, prompt } = body;

    if (!adType || !["image", "video"].includes(adType)) {
      return NextResponse.json({ error: "Invalid ad type" }, { status: 400 });
    }

    // Example: Call Cloudflare Workers AI / LLaVA / custom model


        if (adType === "image") {
      console.log('CLOUDFLARE_API_TOKEN:', process.env.CLOUDFLARE_API_TOKEN ? 'Loaded' : 'Missing');
      console.log('CLOUDFLARE_ACCOUNT_ID:', process.env.CLOUDFLARE_ACCOUNT_ID ? 'Loaded' : 'Missing');



      const inputs = {
        prompt: prompt || 'A beautiful landscape',
      };
      console.log('AI Inputs:', inputs);

      const model = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
      const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;
      const cfRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      });

      if (!cfRes.ok) {
        const errText = await cfRes.text();
        throw new Error(`Cloudflare AI HTTP error ${cfRes.status}: ${errText}`);
      }

      const contentType = cfRes.headers.get('content-type') || '';
      if (contentType.startsWith('image/')) {
        const arrayBuf = await cfRes.arrayBuffer();
        // Convert to base64 to keep the API response JSON-friendly for the client
        const base64 = Buffer.from(arrayBuf).toString('base64');
        return NextResponse.json({ image: base64, contentType });
      } else {
        const response = await cfRes.json();
        return NextResponse.json(response);
      }

    } else {
      // Video generation still uses a placeholder
      const videoUrl = await generateVideoAd({ prompt });
      return NextResponse.json({ success: true, adUrl: videoUrl });
    }
  } catch (error) {
    console.error("Ad generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ success: false, error: `Ad generation failed: ${errorMessage}` }, { status: 500 });
  }
}

// Placeholder for video generation
async function generateVideoAd(data: Partial<AdRequestBody>): Promise<string> {
  console.log("Generating video ad with data:", data);
  return "https://www.w3schools.com/html/mov_bbb.mp4";
}
