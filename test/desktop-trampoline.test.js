const { stat, access } = require('fs').promises
const { constants } = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')
const {
  getDesktopAskpassTrampolinePath,
  getDesktopCredentialHelperTrampolinePath,
} = require('../index')
const split2 = require('split2')
const { createServer } = require('net')

const askPassTrampolinePath = getDesktopAskpassTrampolinePath()
const helperTrampolinePath = getDesktopCredentialHelperTrampolinePath()
const run = promisify(execFile)

describe('desktop-trampoline', () => {
  it('exists and is a regular file', async () =>
    expect((await stat(askPassTrampolinePath)).isFile()).toBe(true))

  it('can be executed by current process', () =>
    access(askPassTrampolinePath, constants.X_OK))

  it('fails when required environment variables are missing', () =>
    expect(run(askPassTrampolinePath, ['Username'])).rejects.toThrow())

  const captureSession = () => {
    const output = []
    let resolveOutput = null

    const outputPromise = new Promise(resolve => {
      resolveOutput = resolve
    })

    const server = createServer(socket => {
      let timeoutId = null
      socket.pipe(split2(/\0/)).on('data', data => {
        output.push(data.toString('utf8'))

        // Hack: consider the session finished after 100ms of inactivity.
        // In a real-world scenario, you'd have to parse the data to know when
        // the session is finished.
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        timeoutId = setTimeout(() => {
          resolveOutput(output)
          socket.end()
          server.close()
        }, 100)
      })
    })

    const serverPortPromise = new Promise((resolve, reject) => {
      server.on('error', e => reject(e))
      server.listen(0, '127.0.0.1', () => {
        resolve(server.address().port)
      })
    })

    return [serverPortPromise, outputPromise]
  }

  it('forwards arguments and valid environment variables correctly', async () => {
    const [portPromise, outputPromise] = captureSession()
    const port = await portPromise

    const env = {
      DESKTOP_TRAMPOLINE_TOKEN: '123456',
      DESKTOP_PORT: port,
      INVALID_VARIABLE: 'foo bar',
    }
    const opts = { env }

    await run(askPassTrampolinePath, ['baz'], opts)

    const output = await outputPromise
    const outputArguments = output.slice(1, 2)
    expect(outputArguments).toStrictEqual(['baz'])
    // output[2] is the number of env variables
    const envc = parseInt(output[2])
    const outputEnv = output.slice(3, 3 + envc)
    expect(outputEnv).toHaveLength(2)
    expect(outputEnv).toContain('DESKTOP_TRAMPOLINE_TOKEN=123456')
    expect(outputEnv).toContain('DESKTOP_TRAMPOLINE_IDENTIFIER=ASKPASS')
  })

  it('forwards stdin when running in credential-helper mode', async () => {
    const [portPromise, outputPromise] = captureSession()
    const port = await portPromise

    const cp = run(helperTrampolinePath, ['get'], {
      env: { DESKTOP_PORT: port },
    })
    cp.child.stdin.end('oh hai\n')

    await cp

    const output = await outputPromise
    expect(output.at(-1)).toBe('oh hai\n')
  })

  it("doesn't forward stdin when running in askpass mode", async () => {
    const [portPromise, outputPromise] = captureSession()
    const port = await portPromise

    const cp = run(askPassTrampolinePath, ['get'], {
      env: { DESKTOP_PORT: port },
    })
    cp.child.stdin.end('oh hai\n')

    await cp

    const output = await outputPromise
    expect(output.at(-1)).toBe('')
  })

  it('askpass handler ignores the DESKTOP_TRAMPOLINE_IDENTIFIER env var', async () => {
    const [portPromise, outputPromise] = captureSession()
    const port = await portPromise

    const cp = run(askPassTrampolinePath, ['get'], {
      env: { DESKTOP_PORT: port, DESKTOP_TRAMPOLINE_IDENTIFIER: 'foo' },
    })
    cp.child.stdin.end('oh hai\n')

    await cp

    const output = await outputPromise
    const envc = parseInt(output[2])
    const outputEnv = output.slice(3, 3 + envc)
    expect(outputEnv).toContain('DESKTOP_TRAMPOLINE_IDENTIFIER=ASKPASS')
  })

  it('credential handler ignores the DESKTOP_TRAMPOLINE_IDENTIFIER env var', async () => {
    const [portPromise, outputPromise] = captureSession()
    const port = await portPromise

    const cp = run(helperTrampolinePath, ['get'], {
      env: { DESKTOP_PORT: port, DESKTOP_TRAMPOLINE_IDENTIFIER: 'foo' },
    })
    cp.child.stdin.end('oh hai\n')

    await cp

    const output = await outputPromise
    const envc = parseInt(output[2])
    const outputEnv = output.slice(3, 3 + envc)
    expect(outputEnv).toContain(
      'DESKTOP_TRAMPOLINE_IDENTIFIER=CREDENTIALHELPER'
    )
  })
})
