#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <errno.h>

#ifdef WINDOWS
  #include <process.h>

  // Use the POSIX helper function on Windows
  // https://docs.microsoft.com/en-us/cpp/c-runtime-library/reference/execv-wexecv
  #define execv _execv

  // Setenv doesn't exist straight off on Windows, this is a compatibility shim
  // from https://stackoverflow.com/a/23616164/2114
  int setenv(const char *name, const char *value, int overwrite)
  {
      int errcode = 0;
      if(!overwrite) {
          size_t envsize = 0;
          errcode = getenv_s(&envsize, NULL, 0, name);
          if(errcode || envsize) return errcode;
      }
      return _putenv_s(name, value);
  }
#else
  // execv and friends on POSIX
  #include <unistd.h>
#endif

// https://stackoverflow.com/a/4771038/2114
bool startsWith(char *pre, char *str)
{
  size_t lenpre = strlen(pre),
         lenstr = strlen(str);
  return lenstr < lenpre ? false : strncmp(pre, str, lenpre) == 0;
}

int main(int argc, char **argv)
{
  char *desktopUsername;
  char *desktopPath;
  char *desktopAskPassScriptPath;
  char *execArgs[4];

  if (argc < 2)
  {
    fprintf(stderr, "USAGE: ask-pass-trampoline PROMPT\n");
    return 1;
  }

  if (startsWith("Username", argv[1]))
  {
    desktopUsername = getenv("DESKTOP_USERNAME");
    if (desktopUsername == NULL) {
      fprintf(stderr, "ERROR: Missing DESKTOP_USERNAME environment variable\n");
      return 1;
    }
    printf("%s", desktopUsername);
    return 0;
  }

  desktopPath = getenv("DESKTOP_PATH");
  desktopAskPassScriptPath = getenv("DESKTOP_ASKPASS_SCRIPT");

  if (desktopPath == NULL || desktopAskPassScriptPath == NULL)
  {
    fprintf(stderr, "ERROR: Missing DESKTOP_PATH or DESKTOP_ASKPASS_SCRIPT environment variables\n");
    return 1;
  }

  setenv("ELECTRON_RUN_AS_NODE", "1", 1);
  setenv("ELECTRON_NO_ATTACH_CONSOLE", "1", 1);

  execArgs[0] = desktopPath;
  execArgs[1] = desktopAskPassScriptPath;
  execArgs[2] = argv[1];
  execArgs[3] = NULL;

  if (execv(execArgs[0], execArgs) != 0) {
    fprintf(stderr, "ERROR: Failed to launch \"%s\": %s\n", execArgs[0], strerror(errno));
    return 1;
  }
}
