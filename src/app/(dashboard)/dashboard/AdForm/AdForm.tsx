"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateAdCopy, BrandInfo } from "@/lib/adgen";

export default function AdForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [brand, setBrand] = useState<BrandInfo>({
    name: "",
    slogan: "",
    website: "",
    socials: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const adCopy = generateAdCopy(prompt, brand);

    const searchParams = new URLSearchParams({
      headline: adCopy.headline,
      description: adCopy.description,
      cta: adCopy.cta,
      name: brand.name || "",
      slogan: brand.slogan || "",
      website: brand.website || "",
      socials: brand.socials || ""
    });

    // Create a type-safe URL with query parameters
    const resultUrl = `/result?${searchParams.toString()}` as const;
    router.push(resultUrl as Parameters<typeof router.push>[0]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <input
        type="text"
        placeholder="Enter ad prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="border rounded p-2 w-full"
        required
      />

      <input
        type="text"
        placeholder="Brand Name"
        value={brand.name}
        onChange={(e) => setBrand({ ...brand, name: e.target.value })}
        className="border rounded p-2 w-full"
      />

      <input
        type="text"
        placeholder="Slogan"
        value={brand.slogan}
        onChange={(e) => setBrand({ ...brand, slogan: e.target.value })}
        className="border rounded p-2 w-full"
      />

      <input
        type="url"
        placeholder="Website"
        value={brand.website}
        onChange={(e) => setBrand({ ...brand, website: e.target.value })}
        className="border rounded p-2 w-full"
      />

      <input
        type="text"
        placeholder="Social Media Links"
        value={brand.socials}
        onChange={(e) => setBrand({ ...brand, socials: e.target.value })}
        className="border rounded p-2 w-full"
      />

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Generate Ad
      </button>
    </form>
  );
}
