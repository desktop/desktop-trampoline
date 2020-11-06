const Path = require('path')

function getAskPassTrampolinePath() {
  return Path.join(
    __dirname,
    'build',
    'Release',
    process.platform === 'win32'
      ? 'askpass-trampoline.exe'
      : 'askpass-trampoline'
  )
}

module.exports = {
  getAskPassTrampolinePath,
}
