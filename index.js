const Path = require('path')

function getDesktopAskpassTrampolinePath() {
  return Path.join(
    __dirname,
    'build',
    'Release',
    getDesktopAskpassTrampolineFilename()
  )
}

function getDesktopAskpassTrampolineFilename() {
  return process.platform === 'win32'
    ? 'desktop-askpass-trampoline.exe'
    : 'desktop-askpass-trampoline'
}

function getSSHWrapperPath() {
  return Path.join(__dirname, 'build', 'Release', getSSHWrapperFilename())
}

function getSSHWrapperFilename() {
  return process.platform === 'win32' ? 'ssh-wrapper.exe' : 'ssh-wrapper'
}

module.exports = {
  getDesktopAskpassTrampolinePath,
  getDesktopAskpassTrampolineFilename,
  getSSHWrapperPath,
  getSSHWrapperFilename,
}
