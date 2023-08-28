class InfoLog {
  constructor() {
    this.info = [];
    this.aux = [];
  }

  log(string) {
    this.info.push(string);
  }

  calculosAuxiliares(string) {
    this.aux.push(string);
  }

  getLog() {
    return this.info;
  }

  getCalculos() {
    return this.aux;
  }

  clearLog() {
    this.info = [];
  }

  clearCalculos() {
    this.aux = [];
  }
}