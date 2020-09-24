const { stat, access } = require("fs").promises;
const { constants } = require("fs");
const { spawn, exec } = require("child_process");
const { getAskPassTrampolinePath } = require("../index");
const { AssertionError } = require("assert");

const trampolinePath = getAskPassTrampolinePath();
let anyFailures = false;

process.on("beforeExit", () => {
  if (anyFailures) {
    process.exit(1);
  }
});

function assert(condition, message) {
  if (!condition) {
    anyFailures = true;
    throw new AssertionError({ message, expected: true, actual: condition });
  }
}

function assert_equal(actual, expected, message) {
  if (actual !== expected) {
    anyFailures = true;
    throw new AssertionError({
      message: message || `expected ${actual} to equal ${expected}`,
      expected,
      actual,
      operator: "===",
    });
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
  } catch (e) {
    anyFailures = true;
    console.error(e);
    console.error(`[FAIL] ${name}`);
  }
}

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

test("trampoline binary exists", async () => {
  const s = await stat(trampolinePath);
  assert(s.isFile(), `trampoline exists and is a regular file`);
});

test("can be executed by current process", () =>
  access(trampolinePath, constants.X_OK));

test("fails when required environment variables are missing", async () => {
  const { code } = await run(["Username"]);
  assert_equal(code, 1, `expected trampoline to fail without env vars`);
});

test("smoke test", async () => {
  const echoPath =
    process.platform === "win32"
      ? "C:\\Program Files\\Git\\usr\\bin\\echo.exe"
      : "/bin/echo";

  const { code, stdout } = await run(["Username"], {
    env: { DESKTOP_PATH: echoPath, DESKTOP_ASKPASS_SCRIPT: "scriptPath" },
  });
  assert_equal(code, 0, "expected trampoline to succeed with env vars");
  assert_equal(stdout, "scriptPath Ussername\n");
});
