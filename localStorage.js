const memoryStorage = {};

const localStorageMock = {
  setItem: (key, value) => {
    memoryStorage[key] = value;
  },
  getItem: (key) => memoryStorage[key] || null,
  removeItem: (key) => {
    delete memoryStorage[key];
  },
  clear: () => {
    Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);
  },
};

module.exports = localStorageMock;