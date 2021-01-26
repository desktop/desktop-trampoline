const Path = require('path')

function getDesktopTrampolinePath() {
  return Path.join(
    __dirname,
    'build',
    'Release',
    process.platform === 'win32'
      ? 'desktop-trampoline.exe'
      : 'desktop-trampoline'
  )
}

module.exports = {
  getDesktopTrampolinePath,
}
