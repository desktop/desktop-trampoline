const { stat, access } = require("fs").promises;
const { constants } = require("fs");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { getAskPassTrampolinePath } = require("../index");

const trampolinePath = getAskPassTrampolinePath();
const run = promisify(execFile);

test("trampoline exists and is a regular file", async () =>
  expect((await stat(trampolinePath)).isFile()).toBe(true));

test("can be executed by current process", () =>
  access(trampolinePath, constants.X_OK));

test("fails when required environment variables are missing", () =>
  expect(run(trampolinePath, ["Username"])).rejects.toThrow());

test("smoke test", async () => {
  const echoPath =
    process.platform === "win32"
      ? "C:\\Program Files\\Git\\usr\\bin\\echo.exe"
      : "/bin/echo";

  const env = { DESKTOP_PATH: echoPath, DESKTOP_ASKPASS_SCRIPT: "scriptPath" };
  const opts = { env };

  expect(run(trampolinePath, ["Username"], opts)).resolves.toEqual({
    stdout: "scriptPath Username\n",
    stderr: "",
  });
});
