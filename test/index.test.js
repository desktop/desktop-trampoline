const { stat, access } = require('fs').promises
const { constants } = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { getAskPassTrampolinePath } = require('../index')

const trampolinePath = getAskPassTrampolinePath()
const run = promisify(execFile)

describe('ask-pass-trampoline', () => {
  it('exists and is a regular file', async () =>
    expect((await stat(trampolinePath)).isFile()).toBe(true))

  it('can be executed by current process', () =>
    access(trampolinePath, constants.X_OK))

  it('fails when required environment variables are missing', () =>
    expect(run(trampolinePath, ['Username'])).rejects.toThrow())

  it('forwards arguments correctly', async () => {
    const echoPath =
      process.platform === 'win32'
        ? 'C:\\Program Files\\Git\\usr\\bin\\echo.exe'
        : '/bin/echo'

    const env = {
      DESKTOP_PATH: echoPath,
      DESKTOP_ASKPASS_SCRIPT: 'foo bar',
    }
    const opts = { env }

    expect(run(trampolinePath, ['baz'], opts)).resolves.toEqual({
      stdout: 'foo bar baz\n',
      stderr: '',
    })
  })
})
