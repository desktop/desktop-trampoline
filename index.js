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

function getDesktopCredentialHelperTrampolinePath() {
  return Path.join(
    __dirname,
    'build',
    'Release',
    getDesktopCredentialHelperTrampolineFilename()
  )
}

function getDesktopCredentialHelperTrampolineFilename() {
  return process.platform === 'win32'
    ? 'desktop-credential-helper-trampoline.exe'
    : 'desktop-credential-helper-trampoline'
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
  getDesktopCredentialHelperTrampolinePath,
  getDesktopCredentialHelperTrampolineFilename,
  getSSHWrapperPath,
  getSSHWrapperFilename,
}
