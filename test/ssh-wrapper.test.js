const { stat, access } = require('fs').promises
const { constants } = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { getSSHWrapperPath } = require('../index')

const sshWrapperPath = getSSHWrapperPath()
const run = promisify(execFile)

describe('ssh-wrapper', () => {
  it('exists and is a regular file', async () =>
    expect((await stat(sshWrapperPath)).isFile()).toBe(true))

  // On Windows, the binary generated is just useless, so no point to test it.
  // Also, this won't be used on Linux (for now at least), so don't bother to
  // run the tests there.
  if (process.platform !== 'darwin') {
    return
  }

  it('can be executed by current process', () =>
    access(sshWrapperPath, constants.X_OK))

  it('attempts to use ssh-askpass program', async () => {
    // Try to connect to github.com with a non-existent known_hosts file to force
    // ssh to prompt the user and use askpass.
    const result = await run(
      sshWrapperPath,
      ['-o', 'UserKnownHostsFile=/path/to/fake/known_hosts', 'git@github.com'],
      {
        env: {
          SSH_ASKPASS: '/path/to/fake/ssh-askpass',
          DISPLAY: '.',
        },
      }
    )

    expect(result.stderr).toMatch(
      /ssh_askpass: exec\(\/path\/to\/fake\/ssh-askpass\): No such file or directory/
    )
  })
})
