
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

  static isImage(ext){
   const  images= ['png','jpg','gif','PNG','JPEG','jpeg','webm'];
    return images.includes(ext)
  }
}

class Render {

  allfiles = [];
  offsetId = null;
  isTerminalOpen = true;
 
  constructor() {
    this.setLoader();
    this.get('#upload').addEventListener('click', () => {
      this.upload()
    })
    this.get('#refresh').addEventListener('click', () => {
      window.api.send("toMain", { type: 'latest' });
    })
    this.get('#loadMore').addEventListener('click', () => {
      this.loadMore()
    })
    this.get('#terminalIcon').addEventListener('click', () => {
      if (this.isTerminalOpen) {
         this.showTerminal(this.isTerminalOpen)
         this.isTerminalOpen = !this.isTerminalOpen
        } else {
        this.showTerminal(this.isTerminalOpen)
        this.isTerminalOpen = !this.isTerminalOpen
  
      }
    })
    document.addEventListener('keydown', function(event) {
      if (event.ctrlKey && event.key === 'j') {
        if (main.isTerminalOpen) {
          main.showTerminal(main.isTerminalOpen)
          main.isTerminalOpen = !main.isTerminalOpen
         } else {
         main.showTerminal(main.isTerminalOpen)
         main.isTerminalOpen = !main.isTerminalOpen
   
       }
      }
    });
  }
  init(receive) {
    main.addTerminalLog(receive)
    if (receive.type === 'messages') {
      this.offsetId = receive.offsetId;
      this.setLoader(true)
      this.loadMessages(receive.messages)
    }
    if (receive.type === 'messages_LOADMORE') {
      this.setLoader(true)
      this.offsetId = receive.offsetId;
      this.loadMessages(receive.messages)
    }
    if (receive.type === 'download') {
      this.FiledownloadStatus(receive)
    }
    if (receive.type === 'upload-progress') {
      main.addTerminalLog(JSON.stringify(receive))
      this.addUploadProgressBar(receive)
    }
    if (receive.type === 'Auth') {
      if (!receive.login) {
        alert('User Not Authorize')
        window.location.href = 'login.html'
      }
    }
    if(receive.type === 'isfileDownloaded'){
      this.get(`#${receive.elementId}`).src = receive.filepath
    }
    if (receive.type === 'loading') {
      // this.setLoader(!receive.loaded)
    }
  }
  addUploadProgressBar(upload) {
    const container = this.get('#uploading-status');
    const progressBox = this.get(`#${upload.id}`);
    if (progressBox) {
      const progress = (upload.progress * 100).toFixed(2);
      const temp = this.get(`.progress-${upload.id}`)
      const label = this.get(`#label-${upload.id}`)
      temp.style.width = `${progress}%`;
      label.innerText = `${progress}%`;

      if (upload.progress === 1) {
        progressBox.remove()
      }

    } else {
      container.innerHTML += `
      <div class="col-3" id="${upload.id}">
      <label >${upload.filePath}</label>  
      <div class="progress mt-2" >
      <div class="progress-bar progress-bar-striped progress-bar-animated progress-${upload.id}" role="progressbar" style="width: 0%" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
      <label id="label-${upload.id}">0%</label>  
        </div>
     </div>

      `;
    }

  }
  get(s) {
    return document.querySelector(s)
  }
  loadMessages(messages) {
    this.allfiles = [...this.allfiles, ...messages];
    const rowMessages = this.get('#files');
    messages.forEach(message => {
      if (message.media) {
        rowMessages.innerHTML += this.messageBoxHTML(message);
      }
    });
    this.setLoader(false)
    this.addSearchListner()
  }
  messageBoxHTML(message) {
    const fileName = this.messageGetFileName(message);
    const ext = fileName ? fileName.split(".")[1] : 'unkown';
    if(Util.isImage(ext)){
      window.api.send("toMain", { type: 'isfileDownloaded' , fileName , elementId : `img-${message.id}`});
    }

    return `
            <div class="col-lg-3 col-xl-2" id="id-${message.id}"   >
            <div class="file-man-box">
            <a  class="file-close"><i class="fa fa-times-circle"></i></a>
                <div class="file-img-box">
                <img src="${this.getIcon(ext)}" alt="icon" id="img-${message.id}" data-bs-toggle="modal" data-bs-target="#staticBackdrop"  onclick='main.showImage("#img-${message.id}")' >
                </div>
                <a  class="file-download" onclick='main.download(${message.id})' ><i class="fa fa-download"></i></a>
                <div class="file-man-title">
                    <h5 class="mb-0 text-overflow" id="fileName-${message.id}">${fileName}</h5>
                    <p class="mb-0"><small>${Util.formatBytes(message?.media?.document?.size)}</small></p>
                        </div>
                        <div class="progress progress-${message.id}" style='display:none;'>
                          <div  class="progress-bar progress-bar-striped" id="progress-${message.id}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                         </div>
                    </div>
                   
                </div>
       `;
  }
  showImage(id){
    this.get('#modal-img-preview').src =  this.get(id).src
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
    main.addTerminalLog(id)
    window.api.send("toMain", { type: 'download', id });
  }
  FiledownloadStatus(receive) {
    main.addTerminalLog(receive)
    if (receive.download) {
      const prog = this.get(`#progress-${receive.id}`)
      const progParent = this.get(`.progress-${receive.id}`)
      prog.style.width = '0%'
      progParent.style.display = 'none'
      main.addTerminalLog(prog)
      const fileName = this.get(`#fileName-${receive.id}`).innerText
      alert(fileName + '   Downloaded')
      window.api.send("toMain", { type: 'isfileDownloaded' , fileName , elementId : `img-${receive.id}`});
    } else {
      const prog = this.get(`#progress-${receive.progress.id}`)
      const progParent = this.get(`.progress-${receive.progress.id}`)
      progParent.style = '';
      prog.style.width = `${receive.progress.progress * 100}%`
      main.addTerminalLog(prog)
    }
  }
  upload() {
    window.api.send("toMain", { type: 'upload' });
  }
  loadMore() {
    window.api.send("toMain", { type: 'messages_LOADMORE', offsetId: this.offsetId });
    this.setLoader()
  }
  updateMessage(message) {
    const rowMessages = this.get('#files');
    rowMessages.innerHTML = this.messageBoxHTML(message) + rowMessages.innerHTML;
  }
  loadTempMessage() {
    fetch('../messages.json')
      .then(res => res.json())
      .then(res => this.loadMessages(res))
      .catch(err => main.addTerminalLog(err))
  }
  addSearchListner() {
    const divs = document.querySelectorAll('#files .col-lg-3');

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
  getIcon(ext) {
    switch (ext) {
      case "rar":
        return './svgs/rar.svg'
      case "zip":
        return './svgs/zip.svg'
      case "pdf":
        return './svgs/pdf.svg'
      case "sql":
        return './svgs/sql.svg'
      case "apk":
        return './svgs/apk.svg'
      case "mp4":
      case "mov":
      case "webm":
      case "flv":
      case "ogg":
      case "ogv":
      case "avi":
      case "amv":
      case "m4v":
      case "3gp":
        return './svgs/video.svg'
      case "mp3":
        return './svgs/mp3.svg'
      case "js":
        return './svgs/js.svg'
      case "css":
        return './svgs/css.svg'
      case "html":
        return './svgs/html.svg'
      case "csv":
      case "xlsx":
      case "xls":
      case "xltx":
      case "xltm":
        return './svgs/excel.svg'
      case "doc":
      case "docx":
        return './svgs/docx.svg'
      case "png":
      case "gif":
      case "jpg":
      case "jpeg":
      case "PNG":
        return './svgs/image.svg'
      default:
        return './svgs/file.svg'

    }
  }
  setLoader(state = true) {
    var loader = document.getElementById("loader");
    if (state) {
      loader.classList.remove("hide");
    } else {
      loader.classList.add("hide");
    }
  }
  showTerminal(state = true){
    var loader = document.getElementById("terminal");
    if (state) {
      loader.classList.remove("hide");
    } else {
      loader.classList.add("hide");
    }
   
  }
  addTerminalLog(message){
    if(typeof message === 'object'){
      this.get('#terminal').innerHTML += ` <p>[OBJECT][OBJECT] ~ See the following Object in Console</p>`;
      console.log(message)
    }else{
      this.get('#terminal').innerHTML += ` <p>${JSON.stringify(message)}</p>`
    }
  }
}




const main = new Render();

window.api.receive("fromMain", (data) => {
  main.init(JSON.parse(data))
});
window.api.receive("log", (data) => {
  main.addTerminalLog(data)
  main.addTerminalLog(data)
});
window.api.receive("updates", (data) => {
  main.updateMessage(JSON.parse(data))
});
window.api.send("toMain", { type: 'messages' });
