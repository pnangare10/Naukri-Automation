class SpinnerManager {
  constructor() {
    this.spinner = null;
    this.ora = null; // Will hold the ora import
  }

  async start(message = 'Loading...') {
    if (!this.ora) {
      this.ora = (await import('ora')).default;
    }
    
    if (this.spinner) {
      this.spinner.stop();
    }
    this.spinner = this.ora(message).start();
  }

  stop() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  succeed(message) {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  fail(message) {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  update(message) {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }
}

// Create a singleton instance
const spinnerManager = new SpinnerManager();

module.exports = spinnerManager;