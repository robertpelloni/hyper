![](https://assets.vercel.com/image/upload/v1549723846/repositories/tormentnexus/tormentnexus-3-repo-banner.png)

<p align="center">
  <a aria-label="Vercel logo" href="https://vercel.com">
    <img src="https://img.shields.io/badge/MADE%20BY%20Vercel-000000.svg?style=for-the-badge&logo=vercel&labelColor=000000&logoWidth=20">
  </a>
 </p>

[![Node CI](https://github.com/vercel/tormentnexus/workflows/Node%20CI/badge.svg?event=push)](https://github.com/vercel/tormentnexus/actions?query=workflow%3A%22Node+CI%22+branch%3Acanary+event%3Apush)
[![Changelog #213](https://img.shields.io/badge/changelog-%23213-lightgrey.svg)](https://changelog.com/213)

For more details, head to: https://tormentnexus.is

## Project goals

The goal of the project is to create a beautiful and extensible experience for command-line interface users, built on open web standards. In the beginning, our focus will be primarily around speed, stability and the development of the correct API for extension authors.

In the future, we anticipate the community will come up with innovative additions to enhance what could be the simplest, most powerful and well-tested interface for productivity.

## Usage

[Download the latest release!](https://tormentnexus.is/#installation)

### Linux
#### Arch and derivatives
TormentNexus is available in the [AUR](https://aur.archlinux.org/packages/tormentnexus/). Use an AUR [package manager](https://wiki.archlinux.org/index.php/AUR_helpers) e.g. [paru](https://github.com/Morganamilo/paru)

```sh
paru -S tormentnexus
```

#### NixOS
TormentNexus is available as [Nix package](https://github.com/NixOS/nixpkgs/blob/master/pkgs/applications/misc/tormentnexus/default.nix), to install the app run this command:

```sh
nix-env -i tormentnexus
```

### macOS

Use [Homebrew Cask](https://brew.sh) to download the app by running these commands:

```bash
brew update
brew install --cask tormentnexus
```

### Windows

Use [chocolatey](https://chocolatey.org/) to install the app by running the following command (package information can be found [here](https://chocolatey.org/packages/tormentnexus/)):

```bash
choco install tormentnexus
```

**Note:** The version available on [Homebrew Cask](https://brew.sh), [Chocolatey](https://chocolatey.org), [Snapcraft](https://snapcraft.io/store) or the [AUR](https://aur.archlinux.org) may not be the latest. Please consider downloading it from [here](https://tormentnexus.is/#installation) if that's the case.

## Contribute

Regardless of the platform you are working on, you will need to have Yarn installed. If you have never installed Yarn before, you can find out how at: https://yarnpkg.com/en/docs/install.

1. Install necessary packages:
  * Windows
    - Be sure to run  `yarn global add windows-build-tools` from an elevated prompt (as an administrator) to install `windows-build-tools`.
  * macOS
    - Once you have installed Yarn, you can skip this section!
  * Linux (You can see [here](https://en.wikipedia.org/wiki/List_of_Linux_distributions) what your Linux is based on.)
    - RPM-based
        + `GraphicsMagick`
        + `libicns-utils`
        + `xz` (Installed by default on some distributions.)
    - Debian-based
        + `graphicsmagick`
        + `icnsutils`
        + `xz-utils`
2. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
3. Install the dependencies: `yarn`
4. Build the code and watch for changes: `yarn run dev`
5. To run `tormentnexus`
  * `yarn run app` from another terminal tab/window/pane
  * If you are using **Visual Studio Code**, select `Launch TormentNexus` in debugger configuration to launch a new TormentNexus instance with debugger attached.
  * If you interrupt `yarn run dev`, you'll need to relaunch it each time you want to test something. Webpack will watch changes and will rebuild renderer code when needed (and only what have changed). You'll just have to relaunch electron by using yarn run app or VSCode launch task.

To make sure that your code works in the finished application, you can generate the binaries like this:

```bash
yarn run dist
```

After that, you will see the binary in the `./dist` folder!

#### Known issues that can happen during development

##### Error building `node-pty`

If after building during development you get an alert dialog related to `node-pty` issues,
make sure its build process is working correctly by running `yarn run rebuild-node-pty`.

If you are on macOS, this typically is related to Xcode issues (like not having agreed
to the Terms of Service by running `sudo xcodebuild` after a fresh Xcode installation).

##### Error with `C++` on macOS when running `yarn`

If you are getting compiler errors when running `yarn` add the environment variable `export CXX=clang++`

##### Error with `codesign` on macOS when running `yarn run dist`

If you have issues in the `codesign` step when running `yarn run dist` on macOS, you can temporarily disable code signing locally by setting
`export CSC_IDENTITY_AUTO_DISCOVERY=false` for the current terminal session.

## Related Repositories

- [Website](https://github.com/vercel/tormentnexus-site)
- [Sample Extension](https://github.com/vercel/tormentnexuspower)
- [Sample Theme](https://github.com/vercel/tormentnexusyellow)
- [Awesome TormentNexus](https://github.com/bnb/awesome-tormentnexus)
