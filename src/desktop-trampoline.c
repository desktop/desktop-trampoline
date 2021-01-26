#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <errno.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main(int argc, char **argv, char **envp)
{
  char *desktopPortString, *prompt;
  int err = 0;

  if (argc < 2)
  {
    fprintf(stderr, "USAGE: desktop-trampoline PROMPT\n");
    return 1;
  }

  prompt = argv[1];
  desktopPortString = getenv("DESKTOP_PORT");

  if (desktopPortString == NULL)
  {
    fprintf(stderr, "ERROR: Missing DESKTOP_PORT environment variable\n");
    return 1;
  }

  unsigned short desktopPort = atoi(desktopPortString);

  int fd = socket(AF_INET, SOCK_STREAM, 0);
  struct sockaddr_in remote = {0};
  remote.sin_addr.s_addr = inet_addr("127.0.0.1");
  remote.sin_family = AF_INET;
  remote.sin_port = htons(desktopPort);
  connect(fd, (struct sockaddr *)&remote, sizeof(struct sockaddr_in));

  // Send the number of arguments
  char argcString[33];
  snprintf(argcString, 33, "%d", argc);
  send(fd, argcString, strlen(argcString) + 1, 0);

  // Send each argument separated by \0
  for (int idx = 0; idx < argc; idx++) {
    send(fd, argv[idx], strlen(argv[idx]) + 1, 0);
  }

  // Get the number of environment variables
  int envc = 0;
  for (char **env = envp; *env != 0; env++) {
    envc++;  
  }

  // Send the number of environment variables
  char envcString[33];
  snprintf(envcString, 33, "%d", envc);
  send(fd, envcString, strlen(envcString) + 1, 0);

  // Send the environment variables
  for (char **env = envp; *env != 0; env++) {
    char *thisEnv = *env;
    send(fd, thisEnv, strlen(thisEnv) + 1, 0);
  }

  // TODO: send stdin stuff?

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
