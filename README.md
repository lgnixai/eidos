<div align="center">
  <h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="static/assets/images/eidos-logo-horizontal-dark.webp">
    <img alt="eidos logo" height="150" src="static/assets/images/eidos-logo-horizontal-light.webp">
  </picture>
  </h1>
<h3>
   An extensible framework for Personal Data Management.
</h3>
<div align="center">
  <a target="_blank" href="https://eidos.space/download"><img src="https://img.shields.io/badge/download-eidos-cyan.svg?style=flat-square&sanitize=true" /></a>
  <a target="_blank" href="https://discord.gg/cGQqjeFpZq"><img src="https://img.shields.io/badge/chat-on%20discord-7289da.svg?style=flat-square&sanitize=true" /></a>
  <a aria-label="Top language of Eidos" href="https://github.com/mayneyao/eidos/search?l=typescript">
    <img alt="Top language of Eidos" src="https://img.shields.io/github/languages/top/mayneyao/eidos?style=flat-square&labelColor=000&color=blue">
  </a>
  <a target="_blank" href="https://github.com/mayneyao/eidos/blob/dev/LICENSE"><img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square&sanitize=true" /></a>
</div>

</div>

![eidos](/static/assets/images/table-and-doc.webp)

> [!IMPORTANT]
> Eidos sets a big goal in mind, but it is still in its early stages, and there is a lot of work to be done. You can give it a try, but I do not recommend using it for production purposes. If you're interested in this project, I recommend staying updated on its development. If you have an Early Access key, you'll receive an email notification when Eidos is officially released.

## Features

- Out-of-the-box Notion-like documents and databases
- Offline Support: Everything runs inside your local machine. Access your data without an internet connection. Data is stored locally for blazing-fast performance.
- AI Features: Deeply integrated with LLM for AI-powered capabilities. Translate, summarize, and interact with your data within Eidos.
- Extensible: Customize Eidos to suit your needs. Write extension code manually or use AI to generate extension code

  - Micro block: UI components for customized data display and interaction. Can be referenced in documents, covers, and right panels
  - Doc Plugin: Customize document editor behavior
  - Script: Create powerful data processing logic with TypeScript/JavaScript/Python.
  - UDF: Use JavaScript to create custom calculation functions for use in table Formula fields.

- Developer Friendly:

  - API & SDK
  - Sqlite Standardization: Every table in Eidos is a SQLite table.

## How to use

> [!WARNING]
> Web app is deprecated, use desktop app instead.

There are two versions of Eidos:

- Web app[tech preview]: Accessible via browser, it's a pure PWA with no web server. But it has some limitations, see [web-vs-desktop](./docs/web-vs-desktop.md)
- Desktop app[recommended]: Offline support, full features.

Get the app from: https://eidos.space/download

## How to develop

### desktop app

1. Clone the repository `git clone https://github.com/mayneyao/eidos.git`
2. Run `pnpm install` to install dependencies
3. Run `pnpm download-libsimple` to download libsimple (only for the first time)
4. Run `pnpm dev:desktop`

### web app

1. Clone the repository `git clone https://github.com/mayneyao/eidos.git`
2. Run `pnpm install` to install dependencies
3. Run `pnpm dev`
4. You can now access the app in your browser at http://localhost:5173

## Roadmap

Eidos is built around several core modules that are iteratively developed. Document, Table, File, Extension, and AI form the foundation of Eidos.

- Short-term goals
  - [ ] [Upcoming changes before the end of Q1](https://github.com/mayneyao/eidos/issues/208)
- Long-term goals
  - [ ] Publish Service: Publish your data to the web.
  - [ ] P2p sync based on CRDT: local-first, not local-only. Sync your data across devices.

Check [changelogs](./docs/changelogs/index.md) for more details.

## Contributors

<a href="https://github.com/mayneyao/eidos/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mayneyao/eidos" />
</a>

## Credits

Eidos based on the following open-source projects:

- [sqlite-wasm](https://github.com/sqlite/sqlite-wasm) - Run SQLite in the browser
- [shadcn-ui](https://github.com/shadcn-ui/ui) - UI components
- [glide-data-grid](https://github.com/glideapps/glide-data-grid) - High performance table
- [lexical](https://github.com/facebook/lexical) - Document editor
- [teable](https://github.com/teableio/teable) & [apitable](https://github.com/apitable/apitable) - Teach me how to build an Airtable-like table.
- [electron](https://github.com/electron/electron) - Build cross-platform desktop apps
- [libsimple](https://github.com/wangfenjin/simple) - a sqlite extension for full-text search for CJK languages

## License

This project is licensed under the terms of the AGPL license.
