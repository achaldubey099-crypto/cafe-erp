const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", "..", "frontend", ".env"), override: false });

const Menu = require("../models/Menu");
const cloudinary = require("../config/cloudinary");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_MENU_FOLDER || "cafe-erp/menu-ai";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function categoryHint(category = "") {
  const normalized = category.toLowerCase();

  if (normalized.includes("dessert")) {
    return "a plated dessert with rich texture, premium garnish, and warm cafe styling";
  }
  if (normalized.includes("burger")) {
    return "a stacked gourmet burger with crisp detail, soft buns, and appetizing layers";
  }
  if (normalized.includes("oriental")) {
    return "an elegant asian-inspired plated dish with steam, shine, and vivid ingredients";
  }
  if (normalized.includes("tandoor")) {
    return "a smoky tandoor platter with charred edges, herbs, and restaurant presentation";
  }
  if (normalized.includes("seafood") || normalized.includes("chicken")) {
    return "a premium savory cafe dish with realistic texture, garnish, and rich lighting";
  }
  if (normalized.includes("appetizer") || normalized.includes("bar bites")) {
    return "a shareable appetizer plated beautifully with crisp texture and inviting garnish";
  }

  return "a premium cafe dish plated beautifully with photorealistic texture and garnish";
}

function buildPrompt(item) {
  return [
    `Photorealistic commercial food photography of "${item.name}".`,
    `Show ${categoryHint(item.category)}.`,
    "Square 1:1 composition for a digital cafe menu.",
    "Single dish or drink as the hero subject, centered, clean composition, shallow depth of field.",
    "Natural premium restaurant lighting, appetizing detail, realistic ingredients, no people.",
    "No text, no watermark, no menu card, no logo, no collage.",
    "Neutral or softly styled background suitable for a modern cafe ordering app.",
  ].join(" ");
}

async function generateGeminiImage(prompt, attempt = 1) {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "x-goog-api-key": GEMINI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || `Gemini request failed with status ${response.status}`;
    if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
      await delay(2000 * attempt);
      return generateGeminiImage(prompt, attempt + 1);
    }
    throw new Error(message);
  }

  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart) {
    const textPart = parts.find((part) => part.text)?.text;
    throw new Error(textPart || "Gemini returned no image data");
  }

  return {
    mimeType: imagePart.inlineData.mimeType || "image/png",
    data: imagePart.inlineData.data,
  };
}

async function generateOpenAIImage(prompt, attempt = 1) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      prompt,
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI request failed with status ${response.status}`;
    if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
      await delay(2000 * attempt);
      return generateOpenAIImage(prompt, attempt + 1);
    }
    throw new Error(message);
  }

  const imageData = payload?.data?.[0]?.b64_json;

  if (!imageData) {
    throw new Error("OpenAI returned no image data");
  }

  return {
    mimeType: "image/png",
    data: imageData,
  };
}

async function uploadToCloudinary(item, generated) {
  const publicId = `${slugify(item.name)}-${item._id}`;
  const dataUri = `data:${generated.mimeType};base64,${generated.data}`;

  return cloudinary.uploader.upload(dataUri, {
    folder: CLOUDINARY_FOLDER,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
  });
}

async function main() {
  const providerArg = process.argv.find((arg) => arg.startsWith("--provider="));
  const provider = providerArg?.split("=")[1] || (OPENAI_API_KEY ? "openai" : "gemini");

  if (provider === "openai" && !OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (provider === "gemini" && !GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;

  const items = await Menu.find({}, "name category image isFeatured").sort({ name: 1 }).limit(limit || 0);

  console.log(
    `Generating AI images for ${items.length} menu items using ${
      provider === "openai" ? OPENAI_MODEL : GEMINI_MODEL
    } (${provider})...`
  );

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const prompt = buildPrompt(item);

    console.log(`[${index + 1}/${items.length}] ${item.name}`);

    try {
      const generated =
        provider === "openai" ? await generateOpenAIImage(prompt) : await generateGeminiImage(prompt);
      const uploaded = await uploadToCloudinary(item, generated);

      item.image = uploaded.secure_url;
      await item.save();

      console.log(`  Uploaded -> ${uploaded.secure_url}`);
      await delay(800);
    } catch (error) {
      console.error(`  Failed for ${item.name}: ${error.message}`);
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch (_error) {
    // ignore disconnect failures on the way out
  }
  process.exit(1);
});
