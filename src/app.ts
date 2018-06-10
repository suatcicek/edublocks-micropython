import { dummyWs, micropythonWs } from './micropython-ws';
import { App } from './types';

export async function newApp(): Promise<App> {
  const ws = micropythonWs();
  // const ws = dummyWs();

  ws.connect(`ws://${getHost()}`);

  return {
    assignTerminal(terminal) {
      ws.on('data', (data) => terminal.write(data));

      terminal.onData(ws.sendData);
    },

    runCode(code) {
      return ws.runCode(code);
    },

    listFiles() {
      return ws.listFiles();
    },

    getFileAsText(file) {
      return ws.getFileAsText(file);
    },

    sendFileAsText(file, text) {
      return ws.sendFileAsText(file, text);
    },

    sendFile(f) {
      return ws.sendFile(f);
    },

    onOpen(handler: () => void) {
      ws.on('open', handler);
    },
  };
}

function getHost() {
  // Running of localhost means that we're debugging so connect to remote ESP
  if (location.hostname === 'localhost') {
    return '192.168.0.127:8266';
    // return '10.30.0.118:8266';
  }

  // Otherwise assume the IP of the websocket is the same as the UI
  return `${location.hostname}:8266`;
}
