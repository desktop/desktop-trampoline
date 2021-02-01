#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <errno.h>

#ifdef WINDOWS

#include <winsock.h>

#define ssize_t long

#else 

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

#define SOCKET int
#define INVALID_SOCKET -1

#endif

#define BUFFER_LENGTH 4096

int safeSend(SOCKET socket, const void *buffer, size_t length, int flags) {
  return (send(socket, buffer, length, flags) < (ssize_t)length ? -1 : 0);
}

void closeSocket(SOCKET socket) {
#ifdef WINDOWS
  closesocket(socket);
#else
  close(socket);
#endif
}

void printSocketError(char *fmt, ...) 
{    
  char formatted_string[4096];

  va_list argptr;
  va_start(argptr, fmt);
  vsprintf(formatted_string, fmt, argptr);
  va_end(argptr);

#ifdef WINDOWS
  fprintf(stderr, "%s: %ld\n", formatted_string, WSAGetLastError());
#else
  fprintf(stderr, "%s (%d): %s\n", formatted_string, errno, strerror(errno));
#endif
}

#define SEND_STRING_OR_EXIT(socket, dataName, dataString) \
if (safeSend(socket, dataString, strlen(dataString) + 1, 0) != 0) { \
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

  SOCKET s = socket(AF_INET, SOCK_STREAM, 0);

  if (s == INVALID_SOCKET) {
    printSocketError("ERROR: Couldn't create TCP socket");
    return 1;
  }

  *outSocket = s;

  struct sockaddr_in remote = {0};
  remote.sin_addr.s_addr = inet_addr("127.0.0.1");
  remote.sin_family = AF_INET;
  remote.sin_port = htons(desktopPort);

  if (connect(s, (struct sockaddr *)&remote, sizeof(struct sockaddr_in)) != 0) {
    printSocketError("ERROR: Couldn't connect to 127.0.0.1:%d", desktopPort);
    return 1;
  }

  // Send the number of arguments
  char argcString[33];
  snprintf(argcString, 33, "%d", argc);
  SEND_STRING_OR_EXIT(s, "number of arguments", argcString);

  // Send each argument separated by \0
  for (int idx = 0; idx < argc; idx++) {
    SEND_STRING_OR_EXIT(s, "argument", argv[idx]);
  }

  // Get the number of environment variables
  int envc = 0;
  for (char **env = envp; *env != 0; env++) {
    envc++;  
  }

  // Send the number of environment variables
  char envcString[33];
  snprintf(envcString, 33, "%d", envc);
  SEND_STRING_OR_EXIT(s, "number of environment variables", envcString);

  // Send the environment variables
  for (char **env = envp; *env != 0; env++) {
    char *thisEnv = *env;
    SEND_STRING_OR_EXIT(s, "environment variable", thisEnv);
  }

  // TODO: send stdin stuff?

  char buffer[BUFFER_LENGTH];
  size_t totalBytesRead = 0;
  ssize_t bytesRead = 0;

  // Read output from server
  do {
    bytesRead = recv(s, buffer + totalBytesRead, BUFFER_LENGTH - totalBytesRead, 0);

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
#ifdef WINDOWS
  // Initialize Winsock
  WSADATA wsaData;
  int iResult = WSAStartup(MAKEWORD(2,2), &wsaData);
  if (iResult != NO_ERROR) {
    fprintf(stderr, "ERROR: WSAStartup failed: %d\n", iResult);
    return 1;
  }
#endif

  SOCKET socket = INVALID_SOCKET;
  int result = runTrampolineClient(&socket, argc, argv, envp);  

  if (socket != INVALID_SOCKET)
  {
    closeSocket(socket);
  }

#ifdef WINDOWS
    WSACleanup();
#endif

  return result;
}
