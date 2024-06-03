const { stat, access } = require('fs').promises
const { constants } = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { getDesktopTrampolinePath } = require('../index')
const split2 = require('split2')
const { createServer } = require('net')

const trampolinePath = getDesktopTrampolinePath()
const run = promisify(execFile)

describe('desktop-trampoline', () => {
  it('exists and is a regular file', async () =>
    expect((await stat(trampolinePath)).isFile()).toBe(true))

  it('can be executed by current process', () =>
    access(trampolinePath, constants.X_OK))

  it('fails when required environment variables are missing', () =>
    expect(run(trampolinePath, ['Username'])).rejects.toThrow())

  it('forwards arguments and valid environment variables correctly', async () => {
    const output = []
    const server = createServer(socket => {
      socket.pipe(split2(/\0/)).on('data', data => {
        output.push(data.toString('utf8'))
      })

      // Don't send anything and just close the socket after the trampoline is
      // done forwarding data.
      socket.end()
    })
    server.unref()

    const startTrampolineServer = async () => {
      return new Promise((resolve, reject) => {
        server.on('error', e => reject(e))
        server.listen(0, '127.0.0.1', () => {
          resolve(server.address().port)
        })
      })
    }

    const port = await startTrampolineServer()
    const env = {
      DESKTOP_TRAMPOLINE_IDENTIFIER: '123456',
      DESKTOP_PORT: port,
      INVALID_VARIABLE: 'foo bar',
    }
    const opts = { env }

    await run(trampolinePath, ['baz'], opts)

    const outputArguments = output.slice(1, 2)
    expect(outputArguments).toStrictEqual(['baz'])
    // output[2] is the number of env variables
    const outputEnv = output.slice(3)
    expect(outputEnv).toHaveLength(1)
    expect(outputEnv).toContain('DESKTOP_TRAMPOLINE_IDENTIFIER=123456')

    server.close()
  })
})
