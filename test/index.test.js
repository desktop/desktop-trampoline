const { stat, access } = require('fs').promises
const { constants } = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { getDesktopTrampolinePath } = require('../index')
const split2 = require('split2')
const { createServer } = require('net')

const trampolinePath = getDesktopTrampolinePath()
const run = promisify(execFile)

async function startTrampolineServer(output, stdout = '', stderr = '') {
  const server = createServer(socket => {
    socket.pipe(split2(/\0/)).on('data', data => {
      output.push(data.toString('utf8'))
    })

    const buffer = Buffer.alloc(2, 0)

    // Send stdout
    buffer.writeUInt16LE(stdout.length, 0)
    socket.write(buffer)
    socket.write(stdout)

    // Send stderr
    buffer.writeUInt16LE(stderr.length, 0)
    socket.write(buffer)
    socket.write(stderr)

    // Close the socket
    socket.end()
  })
  server.unref()

  const startServer = async () => {
    return new Promise((resolve, reject) => {
      server.on('error', e => reject(e))
      server.listen(0, '127.0.0.1', () => {
        resolve(server.address().port)
      })
    })
  }

  return {
    server,
    port: await startServer(),
  }
}

describe('desktop-trampoline', () => {
  it('exists and is a regular file', async () =>
    expect((await stat(trampolinePath)).isFile()).toBe(true))

  it('can be executed by current process', () =>
    access(trampolinePath, constants.X_OK))

  it('fails when required environment variables are missing', () =>
    expect(run(trampolinePath, ['Username'])).rejects.toThrow())

  describe('with a trampoline server', () => {
    let server = null
    let output = []
    let baseEnv = {}

    async function configureTrampolineServer(stdout = '', stderr = '') {
      output = []
      const serverInfo = await startTrampolineServer(output, stdout, stderr)
      server = serverInfo.server
      baseEnv = {
        DESKTOP_PORT: serverInfo.port,
      }
    }

    afterEach(() => {
      server.close()
    })

    it('forwards arguments and valid environment variables correctly without stdin', async () => {
      await configureTrampolineServer()

      const env = {
        ...baseEnv,
        DESKTOP_TRAMPOLINE_IDENTIFIER: '123456',
        DESKTOP_USERNAME: 'sergiou87',
        DESKTOP_USERNAME_FAKE: 'fake-user',
        INVALID_VARIABLE: 'foo bar',
      }
      const opts = { env }

      await run(trampolinePath, ['baz'], opts)

      const outputArguments = output.slice(1, 2)
      expect(outputArguments).toStrictEqual(['baz'])
      // output[2] is the number of env variables
      const outputEnv = output.slice(3, output.length - 1)
      expect(outputEnv).toHaveLength(2)
      expect(outputEnv).toContain('DESKTOP_TRAMPOLINE_IDENTIFIER=123456')
      expect(outputEnv).toContain(`DESKTOP_USERNAME=sergiou87`)

      expect(output[output.length - 1]).toStrictEqual('')
    })

    it('forwards arguments, environment variables and stdin correctly', async () => {
      await configureTrampolineServer()

      const env = {
        ...baseEnv,
        DESKTOP_TRAMPOLINE_IDENTIFIER: '123456',
        DESKTOP_USERNAME: 'sergiou87',
      }
      const opts = {
        env,
        stdin: 'This is a test\nWith a multiline\nStandard input text',
      }

      const run = new Promise((resolve, reject) => {
        const process = execFile(trampolinePath, ['baz'], opts, function (
          err,
          stdout,
          stderr
        ) {
          if (!err) {
            resolve({ stdout, stderr, exitCode: 0 })
            return
          }

          reject(err)
        })

        process.stdin.end(
          'This is a test\nWith a multiline\nStandard input text',
          'utf-8'
        )
      })
      await run

      const outputArguments = output.slice(1, 2)
      expect(outputArguments).toStrictEqual(['baz'])
      // output[2] is the number of env variables
      const outputEnv = output.slice(3, output.length - 1)
      expect(outputEnv).toHaveLength(2)
      expect(outputEnv).toContain('DESKTOP_TRAMPOLINE_IDENTIFIER=123456')
      expect(outputEnv).toContain(`DESKTOP_USERNAME=sergiou87`)

      expect(output[output.length - 1]).toBe(
        'This is a test\nWith a multiline\nStandard input text'
      )
    })

    it('outputs the same stdout received from the server, when no stderr is specified', async () => {
      await configureTrampolineServer('This is the command stdout', '')

      const opts = { env: baseEnv }
      const result = await run(trampolinePath, ['baz'], opts)

      expect(result.stdout).toStrictEqual('This is the command stdout')
      expect(result.stderr).toStrictEqual('')
    })

    it('outputs the same stderr received from the server, when no stdout is specified', async () => {
      await configureTrampolineServer('', 'This is the command stderr')

      const opts = { env: baseEnv }
      const result = await run(trampolinePath, ['baz'], opts)

      expect(result.stdout).toStrictEqual('')
      expect(result.stderr).toStrictEqual('This is the command stderr')
    })

    it('outputs the same stdout and stderr received from the server, when both are specified', async () => {
      await configureTrampolineServer(
        'This is the command stdout',
        'This is the command stderr'
      )

      const opts = { env: baseEnv }
      const result = await run(trampolinePath, ['baz'], opts)

      expect(result.stdout).toStrictEqual('This is the command stdout')
      expect(result.stderr).toStrictEqual('This is the command stderr')
    })
  })
})
