import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

import reactRefresh from "eslint-plugin-react-refresh";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "react": react,
      "react-refresh": reactRefresh,
      "react-hooks": reactHooks,
    },
    rules: {
      // react -----------------------------------------------------------------
      ...react.configs.recommended.rules,

      // disable -> for an older version of react
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      // <></> should wrap 2+ items, or use null if empty
      "react/jsx-no-useless-fragment": ["warn", { allowExpressions: true }],

      // indent 2 - same as prettier
      "react/jsx-indent": ["warn", 2],
      "react/jsx-indent-props": ["warn", 2],

      // component functions must have a name for debugging
      "react/display-name": "error",

      // ensure real key is used
      "react/no-array-index-key": "error",

      // empty components should self-close
      "react/self-closing-comp": "warn",

      // prefer useCallback use for functions / moving them outside components
      "react/jsx-no-bind": "warn",

      // only allow .tsx files
      "react/jsx-filename-extension": ["error", { "extensions": [".tsx"] }],

      // explicit type required on buttons
      "react/button-has-type": "error",

      "react/jsx-sort-props": "off",
      "react/jsx-no-literals": "off",

      // react-refresh ---------------------------------------------------------
      "react-refresh/only-export-components": "warn",

      // react-hooks -----------------------------------------------------------
      ...reactHooks.configs.recommended.rules,

      // javascript ------------------------------------------------------------

      // disable -> can conflict with typescript's variant
      "no-unused-vars": "off",

      // typescript ------------------------------------------------------------

      // warn about unused vars - allow "_name"
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],

      // prevent placing plain objects in expressions
      "@typescript-eslint/strict-boolean-expressions": [
        "warn",
        {
          allowString: true,
          allowNumber: true,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: true,
          allowNullableEnum: true,
          allowAny: true,
          allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
        }
      ],
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
);
