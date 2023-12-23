
class Util {
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

  allfiles = null;
  constructor() {
    this.get('#upload').addEventListener('click', () => {
      this.upload()
    })
    this.get('#refresh').addEventListener('click', () => {
      window.api.send("toMain", { type: 'latest' });
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
  addUploadProgressBar(upload) {
    const container = this.get('#uploading-status');
    const progressBox = this.get(`#${upload.id}`);
    if (progressBox) {
      const temp = this.get(`.progress-${upload.id}`)
      temp.style.width = `${upload.progress * 100}%`;

      if (upload.progress === 1) {
        progressBox.remove()
      }

    } else {
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
    this.allfiles = messages;
    const rowMessages = this.get('#files');
    console.log(rowMessages)
    rowMessages.innerHTML = '';
    messages.forEach(message => {
      if (message.media) {
        rowMessages.innerHTML += this.messageBoxHTML(message);
      }
    });
    this.addSearchListner()
  }
  messageBoxHTML(message) {
    const fileName = this.messageGetFileName(message);
    
    const ext = fileName ? fileName.split(".")[1] : 'unkown';
    return `
            <div class="col-lg-3 col-xl-2" id="id-${message.id}">
            <div class="file-man-box">
            <a  class="file-close"><i class="fa fa-times-circle"></i></a>
                <div class="file-img-box">
                <img src="${this.getIcon(ext)}" alt="icon">
                </div>
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
  updateMessage(message) {
    const rowMessages = this.get('#files');
    rowMessages.innerHTML = this.messageBoxHTML(message) + rowMessages.innerHTML;
  }
  loadTempMessage() {
    fetch('../db/files.json')
      .then(res => res.json())
      .then(res => this.loadMessages(res))
      .catch(err => console.log(err))
  }
  addSearchListner(){
    const divs = document.querySelectorAll('.col-lg-3');

    document.querySelectorAll('.form-control')[0].addEventListener('input', (e) => {
      const inputValue = event.target.value.toLowerCase();

      // Loop through the divs and check for matching text
      for (let i = 0; i < divs.length; i++) {
        const divText = divs[i].textContent.toLowerCase();
        if (divText.includes(inputValue)) {
          divs[i].style.display = 'block';
        } else {
          divs[i].style.display = 'none';
        }
      }
    })
  }
  getIcon(ext){
     switch(ext){
      case "rar" :
        return './svgs/rar.svg'
      case "zip" :
        return './svgs/zip.svg'
      case "pdf" :
        return './svgs/pdf.svg'
      case "sql" :
        return './svgs/sql.svg'
      case "apk" :
        return './svgs/apk.svg'
      case "mp4" :
      case "mov" :
      case "webm" :
      case "flv" :
      case "ogg" :
      case "ogv" :
      case "avi" :
      case "amv" :
      case "m4v" :
      case "3gp" :
        return './svgs/video.svg'
      case "mp3" :
        return './svgs/mp3.svg'
      case "js" :
        return './svgs/js.svg'
      case "css" :
        return './svgs/css.svg'
      case "html" :
        return './svgs/html.svg'
      case "csv" :
      case "xlsx" :
      case "xls" :
      case "xltx" :
      case "xltm" :
        return './svgs/excel.svg'
      case "doc" :
      case "docx" :
        return './svgs/docx.svg'
      case "png" :
      case "gif" :
      case "jpg" :
      case "jpeg" :
      case "PNG" :
        return './svgs/image.svg'
      default :
        return './svgs/file.svg'

     }
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
