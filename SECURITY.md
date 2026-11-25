# Security policy

## Supported versions

Security fixes land in the latest release of `@cherry-design-system/react` (currently 2.x). Upgrade to the newest version to receive them.

## Reporting a vulnerability

Please report vulnerabilities privately, not in a public issue or pull request:

1. Open the repository's [Security tab](https://github.com/cherry-design-system/react/security).
2. Choose **Report a vulnerability** and describe the issue, the affected versions and, if you can, the steps to reproduce it.

You will get an answer within a few days. Once a fix is released, the advisory is published with credit to the reporter, unless you prefer to stay anonymous.

## Scope

cherry ships React components and static CSS. Reports that matter most here: cross-site scripting through component props, unsafe handling of user-supplied colors in `createBrand()`, the inline `themeInitScript`, and anything in the published npm package or the release workflow that could let someone publish or alter a release.
