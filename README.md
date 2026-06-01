# Pokémon Base Stat Quiz

**Live at <https://pokemon-bst-training.vercel.app/>**

A small app for learning Pokémon **base stats** and quizzing yourself on them, built on
[PokéAPI](https://pokeapi.co/). Two modes:

- **Browse & Lists:** page through generations I–IX, sort by Pokédex #, name, BST, or any single
  base stat (both directions), filter by type / BST / individual stats, and search by name
  (contains, or "starts with"). Selecting a Pokémon shows its stat spread in the sidebar, with
  prev/next navigation so the bars animate as you move through the list. Organize Pokémon into your
  own custom lists, persisted in `localStorage`.
- **Quiz:** name-the-Pokémon from its base-stat graph. A random Pokémon is drawn from the filtered
  pool; you get **5 attempts**, picking names from a searchable dropdown (no repeats). Reveal
  options control difficulty (image hide/blur/show, plus height, weight, type, ability), and you can
  restrict the pool to **final evolutions only**. The result screen records the settings + filters
  used and can be shared as a link that recreates the exact challenge for someone else.

React Query handles all PokéAPI fetching (one cached query per generation via `useQueries`, a detail
query per Pokémon, and a one-time evolution-chain fetch behind the "final evolutions" toggle); base
stats are immutable, so queries are cached indefinitely. Custom lists are plain `localStorage` state
with no network layer.

> Generation 10 isn't in PokéAPI yet (national-dex ids stop at 1025). The generation table in
> `src/constants/pokemon.ts` is structured so a future gen drops in with no other changes.

---

## Credits & data

Pokémon data, sprites, and cries are fetched at runtime from [PokéAPI](https://pokeapi.co/), with
sprites served from the [PokéAPI/sprites](https://github.com/PokeAPI/sprites) repository. Thanks to
the PokéAPI maintainers and contributors.

## Disclaimer

This is an **unofficial, non-commercial fan project** made for educational purposes. It is **not
affiliated with, endorsed, sponsored, or approved by** Nintendo, Game Freak, Creatures Inc., or The
Pokémon Company.

Pokémon and all related names, characters, sprites, audio, and imagery are trademarks and copyright
of their respective owners. All such assets are the property of those owners and are referenced here
for illustrative and educational purposes only. No ownership of any Pokémon intellectual property is
claimed. The software is provided "as is", without warranty of any kind.

## License

The **original source code** in this repository is licensed under the
[PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)
© 2026 Yale Yang — see [LICENSE](LICENSE). In short: you may use, modify, and share the code for any
**noncommercial** purpose (personal, hobby, educational, research, or non-profit use), keeping the
required copyright notice; **commercial use is not permitted**.

This license applies **only to the original code**; it does **not** grant any rights to Pokémon names,
data, sprites, audio, or trademarks, which remain the property of their respective owners (see the
disclaimer above).

---

## Tooling (Vite template notes)

This project was scaffolded from the React + TypeScript + Vite template, which provides a minimal
setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
