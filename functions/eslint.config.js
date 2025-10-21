import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module", // ES modülleri için "module" olarak ayarla
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      // Eğer Google'ın özel bir ESLint eklentisi varsa buraya eklenmeli
      // Şu an için @eslint/js'in önerilen kurallarını kullanıyoruz
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      // Google'ın kurallarını manuel olarak ekleyebiliriz veya bir eklenti bulabiliriz
      // Örnek Google kuralları:
      "no-restricted-globals": "off",
      "prefer-arrow-callback": "error",
      "quotes": ["error", "double", { "allowTemplateLiterals": true }],
      "linebreak-style": ["off"], // Otomatik biçimlendirme sorunları nedeniyle devre dışı bırakıldı
      "max-len": ["off"],
      "indent": ["off"], // Otomatik biçimlendirme sorunları nedeniyle devre dışı bırakıldı
      "object-curly-spacing": ["error", "always"],
      // Firebase Functions için özel kurallar
      "valid-jsdoc": "off", // JSDoc zorunluluğunu kapat
      "require-jsdoc": "off", // JSDoc zorunluluğunu kapat
    },
  },
  {
    files: ["**/*.spec.*"],
    languageOptions: {
      globals: globals.mocha,
    },
    rules: {},
  },
];
