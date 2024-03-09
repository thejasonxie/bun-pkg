# bun-pkg

[![npm version](https://badge.fury.io/js/bun-pkg.svg)](https://badge.fury.io/js/bun-pkg)
[![npm](https://img.shields.io/npm/dt/bun-pkg.svg)](https://www.npmjs.com/package/bun-pkg)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/brunobasto/bun-pkg/master/LICENSE)

A monorepo manager for the bun workspaces.

This is an attempt to replicate pnpm recursive command in bun workspaces. If there are any issues with the package, feel free to open an issue or a pull request. Or just modify the bun-pkg.ts file in the scripts folder within your own project to your liking.

## Usage

```bash
bun pkg --help
bun pkg -a build # build all packages using bun build
bun pkg -a run build # run build script in all packages
bun pkg package-a build # build package-a using bun build
bun pkg package-a run build # run build script in package-a
bun pkg -n package-a init # init package-a using bun init
bun pkg -n package-a create vite # create vite app in package-a
bun pkg -n package-a init --use-config # modify package-a's package.json using bun-pkg.json, see configuration section

```

## Installation

### Using the CLI

```bash
bunx bun-pkg
```

### Manually

Run the following command to download the script:

```bash
mkdir -p "scripts"
curl "https://raw.githubusercontent.com/thejasonxie/bun-pkg/main/scripts/bun-pkg.ts" > "scripts/bun-pkg.ts"
```

Add the following to your `package.json`'s scripts:

```json
 "scripts": {
   "pkg": "bun scripts/bun-pkg.ts"
  }
```

## Configuration

In root of the monorepo, create a `bun-pkg.json` file to configure the package.json of a new package when --use-config flag is used.
`bun-pkg.json` basically mirror the package.json you want to be created for new packages.
`${PACKAGE}` will be replaced with the package name.

```json
{
  "name": "@organization/${PACKAGE}",
  "version": "0.0.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "repository": {
    "type": "git",
    "url": "https://github.com/organization/${PACKAGE}"
  },
  "scripts": {
    "build": "bun build",
    "test": "bun test"
  }
}
```
