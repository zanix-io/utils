# Zanix - Utils

[![Version](https://img.shields.io/badge/version-v1.0.0-blue.svg)](https://github.com/yourusername/zanix-[library_name]/releases)\
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

## Installation

To install **Zanix Utils** in your project, use [Deno](https://deno.land/) with the following import:

```ts
import * from 'jsr:@zanix/utils@[version]/mod.ts'
```

You can also import specific plugins or utilities as needed:

- For the **zanix plugin**:
  ```ts
  import zanixPlugin from 'jsr:@zanix/utils@[version]'
  ```

- For the **fmt plugin**:
  ```ts
  import fmtPlugin from 'jsr:@zanix/utils@[version]/linter/deno-fmt-plugin'
  ```

- For the **standard plugin**:
  ```ts
  import standardPlugin from 'jsr:@zanix/utils@[version]/linter/deno-standard-plugin'
  ```

- For the **test plugin**:
  ```ts
  import testPlugin from 'jsr:@zanix/utils@[version]/linter/deno-test-plugin'
  ```

This provides clear instructions for installing and using the library, including importing specific plugins. Replace `[version]` with the actual version number when needed.

---

**Important:**

1. **Install Deno**: Ensure Deno is installed on your system. If not, follow the [official installation guide](https://deno.land/manual/getting_started/installation).

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
import { helpers } from 'jsr:@zanix/utils@[version]/mod.ts'

// Some helpers
await helpers.compileAndObfuscate() // esbuild
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

For a detailed list of changes, please refer to the [CHANGELOG](./CHANGELOG.md) file.

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Resources

- [Deno Documentation](https://deno.land/manual)
- [Zanix Framework Documentation](https://github.com/zanix-io)

---

_Developed with ❤️ by Ismael Calle | [@iscam2216](https://github.com/iscam2216)_
