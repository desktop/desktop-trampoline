#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <errno.h>

#ifdef WINDOWS
  #include <process.h>
  #include <windows.h>
  #include <shlwapi.h>

  // Use POSIX helpers function on Windows
  // https://docs.microsoft.com/en-us/cpp/c-runtime-library/reference/putenv-wputenv?view=vs-2019
  #define putenv _putenv
#else
  // execv and friends on POSIX
  #include <unistd.h>
#endif

#ifdef WINDOWS
/*
 * See "Parsing C++ Command-Line Arguments" at Microsoft's Docs:
 * https://docs.microsoft.com/en-us/cpp/cpp/parsing-cpp-command-line-arguments
 */
static char *quote(char *string)
{
  const char *p;
  int needs_quotes = !*string; /* an empty string always needs to be quoted */
  size_t len = 0;

  for (p = string; *p; p++, len++) {
    if (*p == '"')
      len++;
    else if (strchr(" \t\r\n*?{'", *p))
      needs_quotes = 1;
    else if (*p == '\\') {
      const char *end = p;
      while (end[1] == '\\')
	end++;
      len += end - p;
      if (end[1] == '"')
	len += end - p + 1;
      p = end;
    }
  }

  if (!needs_quotes && len == p - string)
    return string;

  char *result = malloc((len + 3) * sizeof(WCHAR)), *q = result;
  *(q++) = '"';
  for (p = string; *p; p++) {
    if (*p == '"')
      *(q++) = '\\';
    else if (*p == '\\') {
      const char *end = p;
      while (end[1] == '\\')
	end++;
      if (end != p) {
	memcpy(q, p, end - p);
	q += end - p;
      }
      if (end[1] == '"') {
	memcpy(q, p, end - p + 1);
	q += end - p + 1;
      }
      p = end;
    }
    *(q++) = *p;
  }
  *(q++) = '\"';
  *q = '\0';

  return result;
}

/*
 * The `_spawnv()` function does not quote the arguments properly. So let's do this manually.
 */
static int windows_execl(const char *path, ...)
{
  va_list params;
  int i = 0, nr;
#define MAX_ARGS 64
  char *argv[MAX_ARGS + 1], *quoted[MAX_ARGS + 1];

  va_start(params, path);
  while (i < MAX_ARGS && (argv[i] = va_arg(params, char *)))
    quoted[i] = quote(argv[i++]);
  nr = i;
  quoted[nr] = NULL;

  int err = _spawnv(_P_WAIT, path, quoted);

  for (i = 0; i < nr; i++)
    if (argv[i] != quoted[i])
      free(quoted[i]);

  return err;
}
#define execl windows_execl
#endif

int main(int argc, char **argv)
{
  char *desktopPath, *desktopAskPassScriptPath, *prompt;
  int err = 0;

  if (argc < 2)
  {
    fprintf(stderr, "USAGE: ask-pass-trampoline PROMPT\n");
    return 1;
  }

  prompt = argv[1];
  desktopPath = getenv("DESKTOP_PATH");
  desktopAskPassScriptPath = getenv("DESKTOP_ASKPASS_SCRIPT");

  if (desktopPath == NULL || desktopAskPassScriptPath == NULL)
  {
    fprintf(stderr, "ERROR: Missing DESKTOP_PATH or DESKTOP_ASKPASS_SCRIPT environment variables\n");
    return 1;
  }

  // Happy path. If we've got access to a username and we're asked for
  // one there's really no need to spin up a Desktop process just to
  // echo it back to us.
  if (strncmp(prompt, "Username", strlen(prompt)) == 0) {
    if (getenv("DESKTOP_USERNAME") != NULL) {
      fprintf(stdout, "%s", getenv("DESKTOP_USERNAME"));
      return 0;
    }
  }

  putenv("ELECTRON_RUN_AS_NODE=1");
  putenv("ELECTRON_NO_ATTACH_CONSOLE=1");

  err = execl(desktopPath, desktopPath, desktopAskPassScriptPath, prompt, NULL);

  if (err != 0) {
    fprintf(stderr, "ERROR: Failed to launch \"%s\": %s\n", desktopPath, strerror(errno));
    return 1;
  }
}
