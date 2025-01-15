# vscode-diff-bundle

Bundle for diff utility used in the Visual Studio Code source.

## Description

This package provides a bundled version of the diff utility extracted from Visual Studio Code's source code, optimized for standalone use.

## Installation

```bash
npm install vscode-diff-bundle
```

## Scripts
- download: Downloads required source files using tsx
- optimize: Runs optimization script using tsx
- build: Bundles the package using pkgroll
- test: Runs tests with nyc coverage and generates HTML report
