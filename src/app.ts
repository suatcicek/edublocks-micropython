import { dummyWs, micropythonWs } from './micropython-ws';
import { App } from './types';

export async function newApp(): Promise<App> {
  const host = getHost();

  const ws = host ? micropythonWs() : dummyWs();

  ws.connect(`ws://${host}`);

  return {
    assignTerminal(terminal) {
      ws.on('data', (data) => terminal.write(data));

      terminal.onData(ws.sendData);
    },

    runCode(code) {
      ws.runCode(code);
    },

    runLine(code) {
      ws.runLine(code);
    },

    async listFiles(cwd: string) {
      const files = await ws.listFiles(cwd);

      return files
        .filter(({ filename, isdir }) => isdir || filename.slice(-4) === '.xml' || filename.slice(-3) === '.py')
        .filter(({ filename }) => filename !== 'boot.py');
    },

    async getFileAsText(file) {
      const text = await ws.getFileAsText(file);

      return text;
    },

    async sendFileAsText(file, text) {
      await ws.sendFileAsText(file, text);
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
    const ip = prompt('Enter IP address of ESP32:', localStorage.getItem('esp32-address') || '');

    if (ip === null || ip.trim() === '') {
      // throw new Error('Must enter an IP address of ESP32');
      return null;
    }

    localStorage.setItem('esp32-address', ip);

    return `${ip}:8266`;
  }

  // Otherwise assume the IP of the websocket is the same as the UI
  return `${location.hostname}:8266`;
}
