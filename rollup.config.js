import terser from "@rollup/plugin-terser";
import serve from "rollup-plugin-serve";
import typescript from "@rollup/plugin-typescript";
import { readFile } from "fs/promises";
const pa = JSON.parse(await readFile("./package.json", "utf-8"));
const dateTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};
const banner = `/*!
* ${pa.name} v${pa.version}
* Copyright ${new Date().getFullYear()} Pbstar (https://github.com/pbstar)
* Licensed under MIT (https://github.com/pbstar/${pa.name}/blob/main/LICENSE)
* ${dateTime()}
*/
`;
const isDev = process.env.NODE_ENV === "dev";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "lib/p-camera-h5.es.js",
      format: "es",
      banner,
    },
    {
      // CDN <script> 用（unpkg 对 .cjs 的 MIME 无保证，保留 .js）
      file: "lib/p-camera-h5.umd.js",
      format: "umd",
      name: "pCameraH5",
      exports: "named",
      banner,
    },
    {
      // Node require 用：包声明了 "type": "module"，CJS 产物必须用 .cjs 后缀
      file: "lib/p-camera-h5.umd.cjs",
      format: "umd",
      name: "pCameraH5",
      exports: "named",
      banner,
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
    }),
    terser(),
    isDev &&
      serve({
        open: true,
        openPage: "/test/index.html",
      }),
  ],
};
