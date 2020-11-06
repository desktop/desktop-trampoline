# Desktop GIT_ASKPASS Trampoline

A cross-platform no-dependency C executable trampoline which lets GitHub Desktop
invoke itself in order to provide Git with credentials through GIT_ASKPASS.

The intention is to support the same platforms that
[Electron supports](https://www.electronjs.org/docs/tutorial/support#supported-platforms).

## Building

This project is written as a Node project with the C-portions beign compiled by
node-gyp. Installing dependencies and building requires Node.js, and yarn. With
those prerequisites the initial setup should be as easy as running `yarn` and
subsequent builds can be done using `yarn build`. There are some tests available
by running `yarn test`.

## Purpose

When doing any Git operation that requires authentication in Desktop, the
application needs a way to provide those credentials to Git. There are several
options available:

- rely on the user's `credential.helper` config setting
- implement our own
  [credential storage](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage)
  that supports the full credential surface
- implement a program that handles the Git AskPass protocol

The first option is unsatisfactory because it can be challenging to setup
correctly, or may be changed under us.

The second option is excessive - the account details are already managed in
GitHub Desktop, and we only need to provide the credentials to Git when
required.

The third option is what we have currently settled on. An added benefit of this
is it can be configured to ignore any fallback options when authenticating -
reducing the potential for problems integrating with an existing Git setup.

## What's a Trampoline?

There are many different descriptions for "trampoline" in computing but in this
situation the trampoline is a component to pass inputs and outputs between
programs that are otherwise challenging to integrate.

On one side, we have Git, which has a number of ways it can authenticate the
user against a HTTPS remote.

On the other side, we have GitHub Desktop - an Electron app that is primarily
running as a GUI. Electron also supports
[environment variables](https://electronjs.org/docs/api/environment-variables)
that allow us to run it like a command-line program.

To set an AskPass program for Git, we set the `GIT_ASKPASS` environment variable
to our executable on disk. This is done by Desktop whenever it needs to spawn a
Git operation that might require authentication.

The equivalent Bash shell code looks like this:

```sh
# environment variable
GIT_ASKPASS="C:/some/path/to/askpass-trampoline.exe" \
  # ensure Git doesn't block the process waiting for the user to provide input
  GIT_TERMINAL_PROMPT=0 \
  git \
  # unset the credential.helper defined in config
  -c credential.helper= \
  clone https://github.com/shiftkey/my-private-repo.git
```

Desktop also sets these environment variables when spawning Git, as it's the
only way to pass information down to the authentication process:

- `DESKTOP_PATH` - the path to the GitHub Desktop executable to launch
- `DESKTOP_ASKPASS_SCRIPT` - the script to execute and perform the
  authentication lookup
- `DESKTOP_USERNAME` - the account associated with the current repository
- `DESKTOP_ENDPOINT` - the endpoint associated with the account

## Why Need An Executable?

This was originally written as a batch file, which looked like this:

```sh
@echo off
setlocal

set ELECTRON_RUN_AS_NODE=1
set ELECTRON_NO_ATTACH_CONSOLE=1

"%DESKTOP_PATH%" "%DESKTOP_ASKPASS_SCRIPT%" %*

endlocal
```

While this is much more succinct than this C version, it has some technical
limitations that we cannot work around:

- batch files on Windows are launched using `cmd /c {path}` and there are a
  number of known limitations with Unicode characters in file paths
- the Golang runtime - which Git LFS is built upon - also has problems launching
  batch files with spaces -
  [golang/go#17149](https://github.com/golang/go/issues/17149)

Because some of our Desktop users don't have control over the account name on
their machine - think students on a machine managed by their university IT
staff, for example. We need to support these users in Desktop.

There are also some things missing from this script that are not easy to
implement in batch files, such as adding logging to help diagnose environmental
issues.

Thankfully if you set an executable for your `GIT_ASKPASS` environment variable,
it avoids all these problems as Windows can just execute the program.
