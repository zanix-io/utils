# Zanix - Utils

[![Version](https://img.shields.io/jsr/v/@zanix/utils?color=blue&label=jsr)](https://jsr.io/@zanix/utils/versions)

[![Release](https://img.shields.io/github/v/release/zanix-io/utils?color=blue&label=git)](https://github.com/zanix-io/utils/releases)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

1. [Description](#description)
2. [Features](#features)
3. [Installation](#installation)
4. [Basic Usage](#basic-usage)
5. [Documentation](#documentation)
6. [Contributing](#contributing)
7. [License](#license)
8. [Resources](#resources)

## Description

Zanix Utils is a library within the **Zanix** ecosystem, a collection of tools designed for _micro-application_ development. This library provides a set of linting rules and utilities that streamline development and enhance code quality in projects using the **Zanix** framework.

## Features

- Plugins for linter:
  - deno-fmt-plugin: For formatting.
  - deno-test-plugin: For testing.
  - deno-std-plugin: For standard linting.
  - deno-zanix-plugin: For Zanix framework-specific tasks.
- Utility functions including:
  - Regular expressions.
  - Constants.
  - General-purpose helpers.
- Workers utilities.
- Http Errors.
- Logger.

## Installation

To install **Zanix Utils** in your project, use [Deno](https://deno.com/) with the following imports:

```ts
import * as utils from 'jsr:@zanix/utils@[version]'
```

You can also import specific plugins or utilities as needed:

```ts
// Zanix linter plugin
import zanixPlugin from 'jsr:@zanix/utils@[version]/linter/deno-zanix-plugin'

// Format linter plugin
import fmtPlugin from 'jsr:@zanix/utils@[version]/linter/deno-fmt-plugin'

// Standard linter plugin
import standardPlugin from 'jsr:@zanix/utils@[version]/linter/deno-standard-plugin'

// Testing linter plugin
import testPlugin from 'jsr:@zanix/utils@[version]/linter/deno-test-plugin'

// Available constants
import zanixConstants, {/*SOME_CONSTANT*/} from 'jsr:@zanix/utils@[version]/constants'

// Regular expressions
import zanixRegex, {/*SOME_REGEXP*/} from 'jsr:@zanix/utils@[version]/regex'

// Logger
import zanixLogger, { Logger } from 'jsr:@zanix/utils@[version]/logger'

// Helpers
import * as zanixHelpers from 'jsr:@zanix/utils@[version]/helpers'

// Testing utilities
import * as zanixTesting from 'jsr:@zanix/utils@[version]/testing'

// Workers
import * as zanixWorkers from 'jsr:@zanix/utils@[version]/workers'

// Errors
import * as zanixErrors from 'jsr:@zanix/utils@[version]/errors'

// Typing
import * as zanixTypes from 'jsr:@zanix/utils@[version]/types'
```

This provides clear instructions for installing and using the library, including importing specific plugins. Replace `[version]` with the actual version number when needed.

---

**Important:**

1. **Install Deno**: Ensure Deno is installed on your system. If not, follow the [official installation guide](https://docs.deno.com/runtime/getting_started/installation).

2. **Install VSCode Extension**: If using Visual Studio Code, install the **Deno extension** for syntax highlighting, IntelliSense, and linting. Get it from the [VSCode marketplace](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).

3. **Add Deno to PATH**: Ensure Deno is in your system’s `PATH` so the plugin works correctly:
   - **macOS/Linux**: Add to `.bashrc`, `.zshrc`, or other shell config files:
     ```bash
     export PATH="$PATH:/path/to/deno"
     ```
   - **Windows**: Add the Deno folder to your system’s `PATH` via Environment Variables.

---

## Basic Usage

Here’s a basic example of how to use the library:

```typescript
import { compileAndObfuscate } from 'jsr:@zanix/utils@[version]'

// Some helpers
await compileAndObfuscate() // esbuild
```

## Documentation

For full documentation, check out the [official Zanix website](https://github.com/zanix-io) for detailed usage, advanced examples, and more.

## Contributing

If you'd like to contribute to this library, please follow these steps:

1. Report Issues: If you encounter any bugs or have suggestions for improvement, please open an issue on the GitHub repository. Be sure to provide detailed information to help us understand the problem.

2. Fork the Repository: Create your own fork of the repository to make changes.

3. Create a New Branch: Create a descriptive branch name for your feature or bug fix.

4. Make Your Changes: Implement the feature or fix the bug, ensuring you follow the project's coding style and guidelines.

5. Write Tests: If applicable, write tests to verify that your changes work as expected.

6. Submit a Pull Request: Once you're satisfied with your changes, submit a pull request with a clear description of the changes you’ve made.

## Changelog

For a detailed list of changes, please refer to the [CHANGELOG](./docs/CHANGELOG.md) file.

## License

This library is licensed under the MIT License. See the [LICENSE](./docs/LICENSE) file for more details.

## Resources

- [Deno Documentation](https://docs.deno.com/)
- [Zanix Framework Documentation](https://github.com/zanix-io)

---

_Developed with ❤️ by Ismael Calle | [@iscam2216](https://github.com/iscam2216)_
