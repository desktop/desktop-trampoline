# Releases

All releases are published using GitHub releases. Anyone with push access to the
repository can create a new release.

### Release Process

1. Create a branch named `releases/X.Y.Z`, where `X.Y.Z` is the version you want
   to release.
1. Update the `version` field in the `package.json` with the new version you're
   about to release.
1. Open a Pull Request for that branch.
1. Once the branch is approved, `git tag vX.Y.Z` the version you wish to
   publish. **Important:** the version in the tag name must be preceeded by a
   `v`.
1. `git push --follow-tags` to ensure all new commits (and the tag) are pushed
   to the remote. Pushing the tag will start the release process.
1. Wait a few minutes for the build to finish (look for the build in
   https://github.com/desktop/desktop-trampoline/actions)
1. Once the build is complete it will create a new release with all of the
   assets and suggested release notes.
1. Update the changelog to whatever makes sense for this release. It should be
   focused on user-facing changes.
1. Confirm all assets are uploaded for all the supported platforms.
