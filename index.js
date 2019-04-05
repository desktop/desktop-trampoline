const Path = require("path");

function getAskPassTrampolinePath() {
  return Path.join(
    __dirname,
    "build",
    "Release",
    process.platform === "win32"
      ? "ask-pass-trampoline.exe"
      : "ask-pass-trampoline"
  );
}

module.exports = {
  getAskPassTrampolinePath
};
