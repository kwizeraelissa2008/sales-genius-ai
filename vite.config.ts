import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      tsconfigPaths: true, // This fixes the path warning safely inside Vite/Lovable
    },
  },
});