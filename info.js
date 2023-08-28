class InfoLog {
  constructor() {
    this.info = [[]];
    this.currentLog = 0;
  }

  newPage() {
    this.info.push([]);
    this.currentLog++;
  }

  log(string) {
    this.info[this.currentLog].push(string);
  }

  getLog() {
    return this.info[this.currentLog];
  }

  clearLog() {
    this.info = [[]];
    this.currentLog = 0;
  }
}