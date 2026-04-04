import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/plugin.ts",
  output: {
    file: "ch.swissdeck.plugin.sdPlugin/bin/plugin.js",
    format: "esm",
    sourcemap: false,
  },
  external: ["@elgato/streamdeck"],
  plugins: [
    resolve(),
    typescript({
      tsconfig: "./tsconfig.json",
      compilerOptions: {
        module: "ESNext",
        moduleResolution: "bundler",
        outDir: undefined,
        declaration: false,
      },
    }),
  ],
};
