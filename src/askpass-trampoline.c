#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <errno.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

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

int main(int argc, char **argv)
{
  char *desktopPortString, *desktopAction, *prompt;
  int err = 0;

  if (argc < 2)
  {
    fprintf(stderr, "USAGE: askpass-trampoline PROMPT\n");
    return 1;
  }

  prompt = argv[1];
  desktopPortString = getenv("DESKTOP_PORT");
  desktopAction = getenv("DESKTOP_ACTION");

  if (desktopPortString == NULL || desktopAction == NULL)
  {
    fprintf(stderr, "ERROR: Missing DESKTOP_PORT or DESKTOP_ACTION environment variables\n");
    return 1;
  }

  unsigned short desktopPort = atoi(desktopPortString);

  int fd = socket(AF_INET, SOCK_STREAM, 0);
  struct sockaddr_in remote = {0};
  remote.sin_addr.s_addr = inet_addr("127.0.0.1");
  remote.sin_family = AF_INET;
  remote.sin_port = htons(desktopPort);
  connect(fd, (struct sockaddr *)&remote, sizeof(struct sockaddr_in));

  // Send the action first
  send(fd, desktopAction, strlen(desktopAction) + 1, 0);

  // Send each argument separated by \0
  for (int idx = 1; idx < argc; idx++) {
    send(fd, argv[idx], strlen(argv[idx]) + 1, 0);
  }

  // Send a final '\0' to indicate end of arguments
  send(fd, "\0", 1, 0);

  const int kBufferLength = 4096;
  char buffer[kBufferLength];
  size_t totalBytesRead = 0;
  size_t bytesRead = 0;

  while ((bytesRead = recv(fd, buffer + totalBytesRead, kBufferLength - totalBytesRead, 0))) {
    totalBytesRead += bytesRead;
  }

  buffer[totalBytesRead] = '\0';

  fprintf(stdout, "%s", buffer);
}
