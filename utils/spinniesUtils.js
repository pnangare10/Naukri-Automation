const Spinnies = require('spinnies');

class SpinnerManager {
  constructor() {
    this.spinnies = new Spinnies();
    this.currentSpinner = null;
  }

  start(message = 'Loading...', id = 'default') {
    if (this.currentSpinner) {
      this.stop();
    }
    this.currentSpinner = id;
    this.spinnies.add(id, { text: message });
  }

  succeed(message = 'Done!') {
    if (this.currentSpinner) {
      this.spinnies.succeed(this.currentSpinner, { text: message });
      this.currentSpinner = null;
    }
  }

  fail(message = 'Failed!') {
    if (this.currentSpinner) {
      this.spinnies.fail(this.currentSpinner, { text: message });
      this.currentSpinner = null;
    }
  }

  stop() {
    if (this.currentSpinner) {
      this.spinnies.remove(this.currentSpinner);
      this.currentSpinner = null;
    }
  }

  update(message) {
    if (this.currentSpinner) {
      this.spinnies.update(this.currentSpinner, { text: message });
    }
  }
}

const spinner = new SpinnerManager();
module.exports = spinner;
