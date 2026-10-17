import { copyFileSync, existsSync } from "node:fs";

const target = ".env.variant-quick-order.development";
const source = `${target}.example`;
if (existsSync(target)) throw new Error(`${target} already exists.`);
copyFileSync(source, target);
console.log(`Created ${target} from ${source}.`);
