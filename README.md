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
  <a href="https://deepwiki.com/mayneyao/eidos"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</div>

</div>

![eidos](/static/assets/images/table-and-doc.webp)

> [!IMPORTANT]
> Eidos sets a big goal in mind, but it is still in its early stages, and there is a lot of work to be done. You can give it a try, but I do not recommend using it for production purposes. If you're interested in this project, I recommend staying updated on its development. If you have an Early Access key, you'll receive an email notification when Eidos is officially released.

## Features

- Out-of-the-box Notion-like documents and databases
- Offline Support: Everything runs inside your local machine. Access your data without an internet connection. Data is stored locally for blazing-fast performance.
- AI Features: Deeply integrated with LLM for AI-powered capabilities. Translate, summarize, and interact with your data within Eidos.
- Extensible: Simple and powerful extension system, make Eidos a malleable software, write extension code manually or use AI to generate extension code.

  - Micro block: UI components for customized data display and interaction.
  - Script: Create powerful data processing logic with TypeScript/JavaScript/Python.
  - UDF: Use JavaScript to create custom calculation functions for use in table Formula fields.

- Open Format: You get the raw data, everything in sqlite is open.

## How to use

Get the app from: https://preview.eidos.space/download

## How to develop

1. Clone the repository `git clone https://github.com/mayneyao/eidos.git`
2. Run `pnpm install` to install dependencies
3. Run `pnpm download-libsimple` to download libsimple (only for the first time)
4. Run `pnpm dev:desktop` (or `pnpm dev` for web app(PWA))

## How Eidos works

For more details, visit https://docs.eidos.space/

## Contributors

<a href="https://github.com/mayneyao/eidos/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mayneyao/eidos" />
</a>

## License

This project is licensed under the terms of the AGPL license.
