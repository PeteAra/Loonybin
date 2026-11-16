import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "Cabin_Photos");
const target = path.join(root, "public", "photos");

const files = [
  ["DSC08944.jpg", "hero.jpg"],
  ["DSC08923.jpg", "porch.jpg"],
  ["DSC08933.jpg", "firepit.jpg"],
  ["DSC08965.jpg", "loft.jpg"],
  ["DSC08957.jpg", "bedroom.jpg"],
  ["DSC03971.jpg", "exterior.jpg"],
  ["DSC08927.jpg", "dining.jpg"],
  ["DSC08969.jpg", "kitchen.jpg"],
  ["DSC08949.jpg", "bath.jpg"],
  ["DSC08955.jpg", "bedroom-detail.jpg"],
  ["DSC09531.jpg", "morning.jpg"],
  ["DSC09580.jpg", "summer.jpg"],
  ["DSC03974.jpg", "porch-quiet.jpg"],
  ["IMG_6957.JPEG", "shore.jpg"],
  ["Winter.JPEG", "winter.jpg"],
  ["Cozy lakeside cabin at dusk.PNG", "dusk.jpg"],
  ["Autumn Cabin Among Fall Foliage.PNG", "autumn.jpg"],
];

await mkdir(target, { recursive: true });

for (const [input, output] of files) {
  const from = path.join(source, input);
  const to = path.join(target, output);
  const info = await sharp(from)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 76, mozjpeg: true })
    .toFile(to);
  console.log(`${output}\t${info.width}x${info.height}\t${Math.round(info.size / 1024)}KB`);
}
