// Arcádia IA — app para Windows (Electron)
// O app abre a plataforma publicada no GitHub Pages, então jogos novos aparecem
// sozinhos. O próprio app se atualiza pelo GitHub Releases (electron-updater).
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const SITE = 'https://heitorcoser.github.io/arcadia-ia/';
let janela;

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); } });

function criarJanela() {
  janela = new BrowserWindow({
    width: 1366, height: 820, minWidth: 900, minHeight: 600,
    backgroundColor: '#0a0a0f', title: 'Arcádia IA', show: false,
    icon: path.join(__dirname, 'icone.png'),
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  const wc = janela.webContents;
  wc.setUserAgent(wc.getUserAgent() + ' ArcadiaApp/Windows/' + app.getVersion());
  janela.once('ready-to-show', () => janela.show());
  janela.loadURL(SITE);

  wc.on('did-fail-load', (_e, code, _desc, _url, principal) => {
    if (principal && code !== -3) janela.loadFile(path.join(__dirname, 'offline.html'));
  });
  wc.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  wc.on('will-navigate', (e, url) => {
    if (!url.startsWith(SITE) && !url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); }
  });
  wc.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { janela.setFullScreen(!janela.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F5') { wc.reloadIgnoringCache(); e.preventDefault(); }
  });
}

function verificarAtualizacao() {
  autoUpdater.autoDownload = true;
  autoUpdater.on('update-downloaded', info => {
    dialog.showMessageBox(janela, {
      type: 'info', buttons: ['Reiniciar agora', 'Depois'], defaultId: 0, cancelId: 1,
      title: 'Atualização pronta',
      message: `A versão ${info.version} do Arcádia IA foi baixada.`,
      detail: 'Reinicie para instalar. Se escolher "Depois", ela é instalada quando você fechar o app.'
    }).then(r => { if (r.response === 0) autoUpdater.quitAndInstall(); });
  });
  autoUpdater.on('error', () => {});
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 1000 * 60 * 60 * 3);
}

app.whenReady().then(() => {
  criarJanela();
  if (app.isPackaged) verificarAtualizacao();
});
app.on('window-all-closed', () => app.quit());
