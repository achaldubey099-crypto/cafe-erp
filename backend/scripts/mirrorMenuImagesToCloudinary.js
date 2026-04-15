const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const Menu = require("../models/Menu");
const cloudinary = require("../config/cloudinary");

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_MENU_FOLDER || "cafe-erp/menu-imported";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function resolveSourceUrl(item) {
  if (item.image && /^https?:\/\//i.test(item.image)) {
    return item.image;
  }

  return `https://source.unsplash.com/featured/?${encodeURIComponent(item.name)}`;
}

function extractSearchTerms(item) {
  const terms = [];
  const rawImage = typeof item.image === "string" ? item.image : "";

  if (rawImage.includes("source.unsplash.com/featured/?")) {
    const sourceQuery = rawImage.split("?")[1];
    if (sourceQuery) {
      terms.push(decodeURIComponent(sourceQuery));
    }
  }

  terms.push(item.name);

  const simplified = item.name
    .replace(/\b(classic|with|and|period|hustle|meets)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (simplified && simplified.toLowerCase() !== item.name.toLowerCase()) {
    terms.push(simplified);
  }

  const primaryWordPair = simplified.split(" ").slice(0, 2).join(" ").trim();
  if (primaryWordPair) {
    terms.push(primaryWordPair);
  }

  return [...new Set(terms.filter(Boolean))];
}

async function findWikimediaImageUrl(item) {
  const queries = extractSearchTerms(item);

  for (const query of queries) {
    const url =
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
      `&gsrsearch=${encodeURIComponent(query)}` +
      "&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*";

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});
    const first = pages.find((page) => page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url);

    if (first) {
      return first.imageinfo?.[0]?.thumburl || first.imageinfo?.[0]?.url;
    }
  }

  return null;
}

async function uploadRemoteImage(item) {
  const imageUrl = (await findWikimediaImageUrl(item)) || resolveSourceUrl(item);
  const options = {
    folder: CLOUDINARY_FOLDER,
    public_id: `${slugify(item.name)}-${item._id}`,
    overwrite: true,
    resource_type: "image",
  };

  try {
    return await cloudinary.uploader.upload(imageUrl, options);
  } catch (error) {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      throw error;
    }

    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const dataUri = `data:${mimeType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
    return cloudinary.uploader.upload(dataUri, options);
  }
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  const force = process.argv.includes("--force");

  let query = Menu.find({}, "name image category").sort({ name: 1 });
  if (limit) query = query.limit(limit);
  const items = await query;

  console.log(`Mirroring ${items.length} menu items into Cloudinary...`);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const alreadyCloudinary = typeof item.image === "string" && item.image.includes("res.cloudinary.com");

    console.log(`[${index + 1}/${items.length}] ${item.name}`);

    if (alreadyCloudinary && !force) {
      console.log("  Skipped (already on Cloudinary)");
      continue;
    }

    try {
      const uploaded = await uploadRemoteImage(item);
      item.image = uploaded.secure_url;
      await item.save();
      console.log(`  Uploaded -> ${uploaded.secure_url}`);
    } catch (error) {
      console.error(`  Failed: ${error.message}`);
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
    // ignore disconnect failure
  }
  process.exit(1);
});
