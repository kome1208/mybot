import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { 
    files: [ "**/*.{js,mjs,cjs}" ],
    ignores: [ "./tests/*" ],
    plugins: { js },
    extends: [ "js/recommended" ],
    languageOptions: { globals: globals.node },
    rules: {
      "eqeqeq": "warn",
      "curly": [ "warn", "multi-or-nest" ],
      "quotes": [ "warn", "double" ],
      "array-bracket-spacing": [ "warn", "always" ],
      "object-curly-spacing": [ "warn", "always" ],
      "key-spacing": [ "warn", { "beforeColon": false, "afterColon": true } ],
      "semi": [ "warn", "always" ],
      "comma-spacing": [ "warn", { "before": false, "after": true } ],
      "comma-dangle": [ "error", "never" ]
    }
  }
]);
