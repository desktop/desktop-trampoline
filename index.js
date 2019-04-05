const Path = require("path");

export function getAskPassTrampolinePath() {
  return Path.join(
    __dirname,
    "build",
    "Release",
    process.platform === "win32"
      ? "ask-pass-trampoline.exe"
      : "ask-pass-trampoline"
  );
}
