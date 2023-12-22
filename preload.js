let { contextBridge, ipcRenderer } = require("electron")


contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ["toMain"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, JSON.stringify(data));
            }
        },
        receive: (channel, func) => {
            let validChannels = ["fromMain", "log" , "updates"];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
)

