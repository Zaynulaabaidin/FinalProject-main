"use client";

import React, { useState, ChangeEvent } from "react";
import Image from "next/image";


type ApiResponseData = {
  success: boolean;
  adUrl?: string;
  error?: string;
};

// Type helpers for narrowing API responses
type ImageJson = { image: string; contentType?: string };
type CloudflareResult = { result?: { image?: string; output?: string } };
type SuccessUrl = { success: true; adUrl: string };

function hasImageJson(d: unknown): d is ImageJson {
  return !!d && typeof (d as Record<string, unknown>).image === "string";
}

function hasCloudflareResult(d: unknown): d is CloudflareResult {
  if (!d || typeof d !== "object") return false;
  const r = (d as { result?: unknown }).result;
  if (!r || typeof r !== "object") return false;
  const rr = r as Record<string, unknown>;
  return typeof rr.image === "string" || typeof rr.output === "string";
}

function hasSuccessUrl(d: unknown): d is SuccessUrl {
  return (
    !!d &&
    typeof (d as Record<string, unknown>).success === "boolean" &&
    (d as { success?: boolean }).success === true &&
    typeof (d as Record<string, unknown>).adUrl === "string"
  );
}

type SocialHandles = {
  instagram?: string;
  facebook?: string;
  twitter?: string;
};

type SessionData = {
  adType: "image" | "video";
  prompt?: string; // changed from brandName
  slogan?: string;
  website?: string;
  socials?: SocialHandles;
  logoFile?: File | null;
  generateMissingAssets: boolean;
};

export default function AdInitForm() {

    const [generatedAd, setGeneratedAd] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData>({
    adType: "image",
    prompt: "", // changed from brandName
    slogan: "",
    website: "",
    socials: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
    logoFile: null,
    generateMissingAssets: true,
  });

  // Send updates to Durable Object on every change
  const updateSession = (updated: Partial<SessionData>) => {
    const newData = { ...sessionData, ...updated };
    setSessionData(newData);
  };

  function handleInputChange({
    e,
    key,
    isSocial,
  }: {
    e: ChangeEvent<HTMLInputElement>;
    key: keyof SessionData | keyof SocialHandles;
    isSocial?: boolean;
  }) {
    if (isSocial) {
      updateSession({
        socials: {
          ...sessionData.socials,
          [key]: e.target.value,
        },
      });
    } else {
      updateSession({ [key]: e.target.value } as Partial<SessionData>);
    }
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    updateSession({ logoFile: file });

    if (file) {
      const formData = new FormData();
      formData.append("logo", file);

      // Upload file separately to DO or R2
      await fetch("/api/session/logo", {
        method: "POST",
        body: formData,
      });
    }
  };

    const handleContinue = async () => {
    const res = await fetch("/api/get-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData),
    });

    if (res.ok) {
      let data: unknown = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      // Prefer explicit image JSON first
      if (hasImageJson(data)) {
        const mime = typeof data.contentType === 'string' ? data.contentType : 'image/png';
        const dataUrl = `data:${mime};base64,${data.image}`;
        setGeneratedAd(dataUrl);
        return;
      }
      // Then check Cloudflare result shape
      if (hasCloudflareResult(data)) {
        const r = data.result ?? {};
        const base64 = typeof r.image === 'string' ? r.image : typeof r.output === 'string' ? r.output : '';
        if (base64) {
          const dataUrl = `data:image/png;base64,${base64}`;
          setGeneratedAd(dataUrl);
          return;
        }
      }
      // Finally, check for success URL payloads
      if (hasSuccessUrl(data)) {
        setGeneratedAd(data.adUrl);
        return;
      }
      console.error('Failed:', JSON.stringify(data));
      setGeneratedAd(null);
    } else {
      try {
        const data: ApiResponseData = await res.json();
        console.error("Failed:", data.error || 'Unknown error');
      } catch (error) {
        let errorMessage = "Ad generation failed";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error(errorMessage);
        setGeneratedAd(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleContinue();
  };

  return (
    <>
      <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-lg mx-auto p-4"
    >
      <h1 className="text-4xl font-bold text-center">Generative AI Ad Form</h1>
      {/* Toggle for Image / Video */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => updateSession({ adType: "image" })}
          className={`px-4 py-2 rounded ${
            sessionData.adType === "image"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
        >
          Image Ad
        </button>
        <button
          type="button"
          onClick={() => updateSession({ adType: "video" })}
          className={`px-4 py-2 rounded ${
            sessionData.adType === "video"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
        >
          Video Ad
        </button>
      </div>

      {/* Prompt Field (previously Brand Name) */}
      <input
        type="text"
        placeholder="Prompt"
        value={sessionData.prompt || ""}
        onChange={(e) => handleInputChange({ e, key: "prompt" })}
        className="border p-2 w-full rounded"
      />

      <input
        type="text"
        placeholder="Slogan"
        value={sessionData.slogan || ""}
        onChange={(e) => handleInputChange({ e, key: "slogan" })}
        className="border p-2 w-full rounded"
      />

      <input
        type="url"
        placeholder="Website URL"
        value={sessionData.website || ""}
        onChange={(e) => handleInputChange({ e, key: "website" })}
        className="border p-2 w-full rounded"
      />

      {/* Social Handles */}
      <input
        type="text"
        placeholder="Instagram Handle"
        value={sessionData.socials?.instagram || ""}
        onChange={(e) =>
          handleInputChange({ e, key: "instagram", isSocial: true })
        }
        className="border p-2 w-full rounded"
      />

      <input
        type="text"
        placeholder="Facebook Handle"
        value={sessionData.socials?.facebook || ""}
        onChange={(e) =>
          handleInputChange({ e, key: "facebook", isSocial: true })
        }
        className="border p-2 w-full rounded"
      />

      <input
        type="text"
        placeholder="Twitter Handle"
        value={sessionData.socials?.twitter || ""}
        onChange={(e) =>
          handleInputChange({ e, key: "twitter", isSocial: true })
        }
        className="border p-2 w-full rounded"
      />

      {/* Logo File */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="border p-2 w-full rounded"
      />

      {/* Checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={sessionData.generateMissingAssets}
          onChange={(e) =>
            updateSession({ generateMissingAssets: e.target.checked })
          }
        />
        Generate missing assets with AI
      </label>

      {/* Submit */}
      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Continue
      </button>
    </form>

    {generatedAd && (
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Generated Ad</h2>
        {sessionData.adType === 'image' && generatedAd ? (
          <Image src={generatedAd} alt="Generated Ad" width={512} height={512} className="border rounded mx-auto" />
        ) : (generatedAd &&
          <video src={generatedAd} controls className="border rounded mx-auto" />
        )}
      </div>
    )}
    </>
  );
}
