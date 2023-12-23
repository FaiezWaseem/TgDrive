let { app, BrowserWindow, ipcMain } = require("electron")

const { dialog } = require('electron');
const { TelegramClient, NewMessage } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const crypto = require("crypto");
const fs = require('fs');


const apiId = 273729;
const api_hash = '0f7a4f1ed6c06469bf0ecf70ce92b49d';
const storeSession = new StoreSession("my_session");


const client = new TelegramClient(storeSession, apiId, api_hash, {
  connectionRetries: 5,
  proxy: {
    secret: 'd41d8cd98f00b204e9800998ecf8427e',
    port: 443,
    ip: 'proxy.digitalresistance.dog',
    MTProxy: true,
  }
});

(async () => {
  await client.connect()
  console.log('Connected!!')
})()


function createWindow() {
  let win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      preload: `${__dirname}/preload.js`,
    },
  })
  win.loadFile(__dirname + "/src/index.html")
  // win.webContents.openDevTools();


  ipcMain.on("toMain", async (event, args) => {

    const message = JSON.parse(args);
    log("Recieved An Event From Frontend : " + message.type)

    if (message.type === 'messages') {
      const db = './db/files.json';
      fs.access(db, fs.constants.F_OK, (err) => {
        if (err) {
          log('Loading From Server')
          client.getMessages("me").then(res => {
            fs.writeFileSync(db, JSON.stringify(res), 'utf8')
            win.webContents.send("fromMain", JSON.stringify({
              type: message.type,
              messages: res
            }));
          })
        } else {
          fs.readFile(db, 'utf8', (err, data) => {
            if (err) {
              log('Loading Failed')
              console.error('Error reading file:', err);
            } else {
              log('Loading From Cache')
              const content = JSON.parse(data)
              win.webContents.send("fromMain", JSON.stringify({
                type: message.type,
                messages: content
              }));
            }
          });
        }
      });
    }
    if(message.type === 'latest'){
      client.getMessages("me").then(res => {
        fs.writeFileSync(db,JSON.stringify(res), 'utf8')
        win.webContents.send("fromMain", JSON.stringify({
          type: message.type,
          messages: res
        }));
      })
    }
    if (message.type === 'download') {
      const result = await client.getMessages("me", {
        ids: Number(message.id)
      });
      const media = result[0].media;
      if (media) {
        log('File to Download Found | id = ' + message.id)
        const buffer = await client.downloadMedia(media, {
          workers: 4,
          progressCallback: (bytes, total) => {
            win.webContents.send("fromMain", JSON.stringify({
              type: message.type,
              download: false,
              progress: {
                bytes,
                total,
                progress: bytes / total,
                id: message.id
              }
            }));

          }
        });
        const savePath = downloadPath(result[0]);
        log('File Save Path | path = ' + savePath)
        fs.writeFile(savePath, buffer, (err) => {
          if (err) {
            log('File Save Error: ' + err.message + ' | path = ' + savePath)
            console.log(err)
          } else {
            log('File Saved | path = ' + savePath)
            console.log('file Saved')
            win.webContents.send("fromMain", JSON.stringify({
              type: message.type,
              download: true,
              id: message.id
            }));
          }
        });
      }
    }
    if (message.type === 'upload') {
      dialog.showOpenDialog({ properties: ['openFile'] }).then(async (result) => {
        const filePaths = result.filePaths;
        log('Upload Picker Picked Files')
        if (filePaths && filePaths.length > 0) {
          const randomId = generateRandomId();
          const filePath = filePaths[0];
          log('Upload Picked File : ' + filePath)
          console.log('selected-file', filePath);
          const file = await client.sendFile('me', {
            file: filePath,
            caption: '--SEND___FROM___ELECTRON_TG_CLIENT-----',
            workers: 5,
            progressCallback: (p) => {
              win.webContents.send("fromMain", JSON.stringify({ type: 'upload-progress', progress: p, filePath, id: randomId }))
              console.log('Progress : ' + p + ' %')
            }
          })

          log('Upload File : ' + filePath + ' files Id : ' + file.id)
          console.log(file.id)
          win.webContents.send("updates", JSON.stringify(file))

        }
      });
    }
    if (message.type === 'sendCode') {
      log('Invoked Code')
      await client.sendCode({
        apiId: apiId,
        apiHash: api_hash,
      }, message.phoneNumber)
    }
    if (message.type === 'code') {
      log('Invoked Code')
      await client.start({
        phoneNumber: message.phoneNumber, password: null, phoneCode: message.code, onError: () => {
          log('some Error While Authenticating')
        }
      })
      win.webContents.send("fromMain", JSON.stringify({ type: 'login', success: true }))
    }
  });

  function log(message) {
    win.webContents.send("log", message)
  }

}



app.on("ready", createWindow)

app.on("window-all-closed", () => {
  app.quit()
})


const downloadPath = (m) => {
  switch (m.media.className) {
    case 'MessageMediaPhoto':
      return "downloads/" + getRandom() + ".png"
    case 'MessageMediaDocument':
      return "downloads/" + getName(m)
  }
}
function generateRandomId() {
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var id = '';

  do {
    id = '';

    for (var i = 0; i < 6; i++) {
      var randomIndex = Math.floor(Math.random() * characters.length);
      var char = characters.charAt(randomIndex);
      id += char;
    }
  } while (/^\d/.test(id)); // Check if the ID starts with a number

  return id;
}
const getRandom = () => {
  return crypto.randomBytes(4).toString("hex");
}
const getName = (m) => {
  return m?.media?.document?.attributes.length == 2 ? m?.media?.document?.attributes?.[1]?.fileName : m?.media?.document?.attributes?.[0]?.fileName
}

function windows() {
  const registry = require('registry-js');
  let folder = `${process.env.USERPROFILE}\\Downloads`;
  const folders =
    registry.enumerateValues(
      registry.HKEY.HKEY_CURRENT_USER,
      'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders');
  for (const value of folders) {
    if (value.name === '{374DE290-123F-4565-9164-39C4925E467B}') {
      folder = value.data.replace('%USERPROFILE%', process.env.USERPROFILE);
      break;
    }
  }
  return folder;
}