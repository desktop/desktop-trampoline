#include <errno.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "socket.h"

#define BUFFER_LENGTH 4096

#define WRITE_STRING_OR_EXIT(dataName, dataString) \
if (writeSocket(socket, dataString, strlen(dataString) + 1) != 0) { \
  printSocketError("ERROR: Couldn't send " dataName); \
  return 1; \
}

int runTrampolineClient(SOCKET *outSocket, int argc, char **argv, char **envp) {
  char *desktopPortString;

  if (argc < 2) {
    fprintf(stderr, "USAGE: desktop-trampoline <arguments>\n");
    return 1;
  }

  desktopPortString = getenv("DESKTOP_PORT");

  if (desktopPortString == NULL) {
    fprintf(stderr, "ERROR: Missing DESKTOP_PORT environment variable\n");
    return 1;
  }

  unsigned short desktopPort = atoi(desktopPortString);

  SOCKET socket = openSocket();

  if (socket == INVALID_SOCKET) {
    printSocketError("ERROR: Couldn't create TCP socket");
    return 1;
  }

  *outSocket = socket;

  if (connectSocket(socket, desktopPort) != 0) {
    printSocketError("ERROR: Couldn't connect to 127.0.0.1:%d", desktopPort);
    return 1;
  }

  // Send the number of arguments
  char argcString[33];
  snprintf(argcString, 33, "%d", argc);
  WRITE_STRING_OR_EXIT("number of arguments", argcString);

  // Send each argument separated by \0
  for (int idx = 0; idx < argc; idx++) {
    WRITE_STRING_OR_EXIT("argument", argv[idx]);
  }

  // Get the number of environment variables
  int envc = 0;
  for (char **env = envp; *env != 0; env++) {
    envc++;  
  }

  // Send the number of environment variables
  char envcString[33];
  snprintf(envcString, 33, "%d", envc);
  WRITE_STRING_OR_EXIT("number of environment variables", envcString);

  // Send the environment variables
  for (char **env = envp; *env != 0; env++) {
    char *thisEnv = *env;
    WRITE_STRING_OR_EXIT("environment variable", thisEnv);
  }

  // TODO: send stdin stuff?

  char buffer[BUFFER_LENGTH];
  size_t totalBytesRead = 0;
  ssize_t bytesRead = 0;

  // Read output from server
  do {
    bytesRead = readSocket(socket, buffer + totalBytesRead, BUFFER_LENGTH - totalBytesRead);

    if (bytesRead == -1) {
      printSocketError("ERROR: Error reading from socket");
      return 1;
    }

    totalBytesRead += bytesRead;
  } while (bytesRead > 0);

  buffer[totalBytesRead] = '\0';

  // Write that output to stdout
  fprintf(stdout, "%s", buffer);

  return 0;
}

int main(int argc, char **argv, char **envp) {
  if (initializeNetwork() != 0) {
    return 1;
  }

  SOCKET socket = INVALID_SOCKET;
  int result = runTrampolineClient(&socket, argc, argv, envp);  

  if (socket != INVALID_SOCKET)
  {
    closeSocket(socket);
  }

  terminateNetwork();

  return result;
}
