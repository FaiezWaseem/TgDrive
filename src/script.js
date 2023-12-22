class Util {
  static getMediaType(message) {
    // Photo compressed
    if (message.media?._ === 'messageMediaPhoto') {
      return '📷 Photo';
    }

    if (message.media?._ === 'messageMediaDocument') {
      const attr = message.media?.document.attributes;

      // Sticker
      if (attr?.[1]?._ === 'documentAttributeSticker') {
        return attr?.[1]?.alt + ' Sticker';
      }

      // Photo uncompressed
      if (attr?.[0]?._ === 'documentAttributeImageSize') {
        return '📸 Image';
      }

      // GIF
      if (attr?.[2]?._ === 'documentAttributeAnimated') {
        return '📺 GIF';
      }

      // Audio
      if (attr?.[0]?._ === 'documentAttributeAudio') {
        if (attr?.[0].voice) {
          return '🎤 Voice message';
        }

        return '🔊 Audio file';
      }

      // Video
      if (attr?.[0]?._ === 'documentAttributeVideo') {
        if (attr?.[0].round_message) {
          return '🤳 Video message';
        }

        return '🎥 Video';
      }

      // File
      if (attr?.[0]?._ === 'documentAttributeFilename') {
        return '📁 File';
      }
    }

    return null;
  }
  /**
   *
   * @param {Number} a - Bytes
   * @param {Number} b - Value after point default = 2
   * @returns - Outputs HumanReadable File Size , ex : 4Mib 10Gib
   */
  static formatBytes(a, b = 2) {
    if (!+a) return '0 Bytes';
    const c = 0 > b ? 0 : b,
      d = Math.floor(Math.log(a) / Math.log(1024));
    return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'][d]
      }`;
  }
}

class Render {

  constructor() {
    this.get('#upload').addEventListener('click', () => {
      this.upload()
    })

  }
  init(receive) {
    console.log(receive)
    if (receive.type === 'messages') {
      this.loadMessages(receive.messages)
    }
    if (receive.type === 'download') {
      this.FiledownloadStatus(receive)
    }
    if (receive.type === 'upload-progress') {
      console.log(JSON.stringify(receive))
      this.addUploadProgressBar(receive)
    }
  }
  addUploadProgressBar(upload){
    const container = this.get('#uploading-status');
    const progressBox = this.get(`#${upload.id}`);
    if(progressBox){
      const temp = this.get(`.progress-${upload.id}`)
       temp.style.width = `${upload.progress*100}%`;

       if(upload.progress === 1){
        progressBox.remove()
       }

    }else{
      container.innerHTML += `
      <div class="col-3" id="${upload.id}">
      <label for="">${upload.filePath}</label>  
      <div class="progress mt-2" >
          <div class="progress-bar progress-bar-striped progress-bar-animated progress-${upload.id}" role="progressbar" style="width: 0%" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
     </div>

      `;
    }

  }
  get(s) {
    return document.querySelector(s)
  }
  loadMessages(messages) {
    const rowMessages = this.get('#files');
    console.log(rowMessages)
    rowMessages.innerHTML = '';
    messages.forEach(message => {
      rowMessages.innerHTML += this.messageBoxHTML(message);
    });
  }
  messageBoxHTML(message) {
    return `
            <div class="col-lg-3 col-xl-2" id="id-${message.id}">
            <div class="file-man-box">
            <a href="" class="file-close"><i class="fa fa-times-circle"></i></a>
                <div class="file-img-box">
                <img src="https://coderthemes.com/highdmin/layouts/assets/images/file_icons/pdf.svg" alt="icon"></div>
                <a  class="file-download" onclick='main.download(${message.id})' ><i class="fa fa-download"></i></a>
                <div class="file-man-title">
                    <h5 class="mb-0 text-overflow">${this.messageGetFileName(message)}</h5>
                    <p class="mb-0"><small>${Util.formatBytes(message?.media?.document?.size)}</small></p>
                        </div>
                        <div class="progress progress-${message.id}" style='display:none;'>
                          <div  class="progress-bar progress-bar-striped" id="progress-${message.id}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                         </div>
                    </div>
                   
                </div>
       `;
  }
  messageGetFileName(m) {
    const getName = (m) => {
      return m?.media?.document?.attributes.length == 2 ? m?.media?.document?.attributes?.[1]?.fileName : m?.media?.document?.attributes?.[0]?.fileName
    }
    switch (m?.media?.className) {
      case 'MessageMediaPhoto':
        return "FileImage.png"
      case 'MessageMediaDocument':
        return getName(m)
    }
  }
  download(id) {
    console.log(id)
    window.api.send("toMain", { type: 'download', id });
  }
  FiledownloadStatus(receive) {
    console.log(receive)
    if (receive.download) {
      const prog = this.get(`#progress-${receive.id}`)
      const progParent = this.get(`.progress-${receive.id}`)
      prog.style.width = '0%'
      progParent.style.display = 'none'
      console.log(prog)
      alert('File Downloaded')
    } else {
      const prog = this.get(`#progress-${receive.progress.id}`)
      const progParent = this.get(`.progress-${receive.progress.id}`)
      progParent.style = '';
      prog.style.width = `${receive.progress.progress * 100}%`
      console.log(prog)
    }
  }
  upload() {
    window.api.send("toMain", { type: 'upload' });
  }
  updateMessage(message){
    const rowMessages = this.get('#files');
    rowMessages.innerHTML += this.messageBoxHTML(message);
  }
}



const main = new Render();

window.api.receive("fromMain", (data) => {
  main.init(JSON.parse(data))
});
window.api.receive("log", (data) => {
  console.log(data)
});
window.api.receive("updates", (data) => {
  main.updateMessage(JSON.parse(data))
});
window.api.send("toMain", { type: 'messages' });
