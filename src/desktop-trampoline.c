#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <errno.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int safeSend(int socket, const void *buffer, size_t length, int flags) {
  int bytesSent = send(socket, buffer, length, flags);

  return (bytesSent < length ? -1 : 0);
}

#define SEND_STRING_OR_EXIT(dataName, dataString) \
if (safeSend(fd, dataString, strlen(dataString) + 1, 0) != 0) { \
  fprintf(stderr, "ERROR: Couldn't send " dataName " (%d): %s", \
          errno, strerror(errno));\
  return 1;\
}

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

  if (fd == -1) {
    fprintf(stderr, "ERROR: Couldn't create TCP socket (%d): %s", errno, strerror(errno));
    return 1;
  }

  struct sockaddr_in remote = {0};
  remote.sin_addr.s_addr = inet_addr("127.0.0.1");
  remote.sin_family = AF_INET;
  remote.sin_port = htons(desktopPort);

  if (connect(fd, (struct sockaddr *)&remote, sizeof(struct sockaddr_in)) != 0) {
    fprintf(stderr, "ERROR: Couldn't connect to 127.0.0.1:%d (%d): %s",
            desktopPort, errno, strerror(errno));
    return 1;
  }

  // Send the number of arguments
  char argcString[33];
  snprintf(argcString, 33, "%d", argc);
  SEND_STRING_OR_EXIT("number of arguments", argcString);

  // Send each argument separated by \0
  for (int idx = 0; idx < argc; idx++) {
    SEND_STRING_OR_EXIT("argument", argv[idx]);
  }

  // Get the number of environment variables
  int envc = 0;
  for (char **env = envp; *env != 0; env++) {
    envc++;  
  }

  // Send the number of environment variables
  char envcString[33];
  snprintf(envcString, 33, "%d", envc);
  SEND_STRING_OR_EXIT("number of environment variables", envcString);

  // Send the environment variables
  for (char **env = envp; *env != 0; env++) {
    char *thisEnv = *env;
    SEND_STRING_OR_EXIT("environment variable", thisEnv);
  }

  // TODO: send stdin stuff?

  const int kBufferLength = 4096;
  char buffer[kBufferLength];
  size_t totalBytesRead = 0;
  size_t bytesRead = 0;

  do {
    bytesRead = recv(fd, buffer + totalBytesRead, kBufferLength - totalBytesRead, 0);

    if (bytesRead == -1) {
      fprintf(stderr, "ERROR: Error reading from socket (%d): %s",
              errno, strerror(errno));
      return 1;
    }

    totalBytesRead += bytesRead;
  } while (bytesRead > 0);

  buffer[totalBytesRead] = '\0';

  fprintf(stdout, "%s", buffer);
}
