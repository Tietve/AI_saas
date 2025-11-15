import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"]
  },
  {
    languageOptions: {
      globals: globals.node
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["**/shared/events", "../shared/events", "./shared/events"],
            "message": "Use @saas/shared/dist/events instead of local shared/events"
          },
          {
            "group": ["**/config/sentry", "../config/sentry", "./config/sentry"],
            "message": "Use @saas/shared/dist/config for Sentry instead of local config/sentry"
          },
          {
            "group": ["**/tracing/jaeger", "../tracing/jaeger", "./tracing/jaeger"],
            "message": "Use @saas/shared/dist/tracing/jaeger instead of local tracing/jaeger"
          }
        ]
      }]
    }
  }
];
