const { stat, access } = require("fs").promises;
const { constants } = require("fs");
const { spawn, exec } = require("child_process");
const { getAskPassTrampolinePath } = require("../index");

const trampolinePath = getAskPassTrampolinePath();

function run(args, options) {
  return new Promise((resolve, reject) => {
    const cp = spawn(trampolinePath, args, options);

    let stdout = "";
    let stderr = "";

    cp.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    cp.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));

    cp.on("exit", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

test("trampoline exists and is a regular file", async () => {
  const s = await stat(trampolinePath);
  expect(s.isFile()).toBe(true);
});

test("can be executed by current process", () =>
  access(trampolinePath, constants.X_OK));

test("fails when required environment variables are missing", async () => {
  const { code } = await run(["Username"]);
  expect(code).not.toBe(0);
});

test("smoke test", async () => {
  const echoPath =
    process.platform === "win32"
      ? "C:\\Program Files\\Git\\usr\\bin\\echo.exe"
      : "/bin/echo";

  const { code, stdout } = await run(["Username"], {
    env: { DESKTOP_PATH: echoPath, DESKTOP_ASKPASS_SCRIPT: "scriptPath" },
  });
  expect(code).toBe(0);
  expect(stdout).toEqual("scriptPath Username\n");
});
