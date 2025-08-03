import path from "path";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";
console.log(process.env.NODE_ENV, isProd);

// On Render: store in mounted disk at /mnt/data
// Locally: use ./uploads folder

// const STORAGE_ROOT = isProd
//   ? "/mnt/data/public"
//   : path.join(__dirname, "../../public");

const STORAGE_ROOT = path.join(__dirname, "../../public");

export function getDeliveryFolder(deliveryId: string): string {
  const dir = path.join(STORAGE_ROOT, "delivery", deliveryId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// For generating public-accessible paths (for emails or frontend)
export function getPublicPath(deliveryId: string, fileName: string): string {
  return `/public/delivery/${deliveryId}/${fileName}`;
}

export const getAbsoluteFilePath = (publicUrlPath: string): string => {
  const isProd = process.env.NODE_ENV === "production";
  // const basePath = isProd ? "/mnt/data" : path.join(__dirname, "../../");
  const basePath = path.join(__dirname, "../../");
  return path.join(basePath, publicUrlPath);
};
