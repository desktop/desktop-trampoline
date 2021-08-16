const Path = require('path')

function getDesktopTrampolinePath() {
  return Path.join(
    __dirname,
    'build',
    'Release',
    getDesktopTrampolineFilename()
  )
}

function getDesktopTrampolineFilename() {
  return process.platform === 'win32'
    ? 'desktop-trampoline.exe'
    : 'desktop-trampoline'
}

function getSSHWrapperPath() {
  return Path.join(
    __dirname,
    'build',
    'Release',
    getSSHWrapperFilename()
  )
}

function getSSHWrapperFilename() {
  return process.platform === 'win32'
    ? 'ssh-wrapper.exe'
    : 'ssh-wrapper'
}

module.exports = {
  getDesktopTrampolinePath,
  getDesktopTrampolineFilename,
  getSSHWrapperPath,
  getSSHWrapperFilename,
}
