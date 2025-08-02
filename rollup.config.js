import terser from "@rollup/plugin-terser";
import serve from "rollup-plugin-serve";
import json from "rollup-plugin-json";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import { readFile } from "fs/promises";
const pa = JSON.parse(await readFile("./package.json", "utf-8"));
const dateTime = () => {
  const now = new Date();
  const year = now.getFullYear(); // 年
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 月，注意getMonth()是从0开始的
  const day = String(now.getDate()).padStart(2, "0"); // 日
  const hours = String(now.getHours()).padStart(2, "0"); // 时
  const minutes = String(now.getMinutes()).padStart(2, "0"); // 分
  const seconds = String(now.getSeconds()).padStart(2, "0"); // 秒
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
const banner = `/*!
* p-camera-h5 v${pa.version}
* Copyright 2024 Pbstar (https://github.com/pbstar)
* Licensed under MIT (https://github.com/pbstar/p-camera-h5/blob/main/LICENSE)
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
      file: "lib/p-camera-h5.umd.js",
      format: "umd",
      name: "pCameraH5",
      banner,
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
    }),
    terser(),
    postcss(),
    json(),
    isDev &&
      serve({
        open: true,
        openPage: "/test/index.html",
      }),
  ],
};
