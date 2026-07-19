const fs = require('fs');

function makeSafeSync(fn, fallback) {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        if (typeof fallback === 'function') {
          return fallback(...args);
        }
        return fallback;
      }
      throw err;
    }
  };
}

function makeSafeAsync(fn, fallback) {
  return function(...args) {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') {
      const newArgs = args.slice(0, -1);
      fn(...newArgs, (err, ...res) => {
        if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
          if (typeof fallback === 'function') {
            try {
              return callback(null, fallback(...newArgs));
            } catch (fallbackErr) {
              return callback(fallbackErr);
            }
          }
          return callback(null, fallback);
        }
        callback(err, ...res);
      });
    } else {
      return fn.apply(this, args);
    }
  };
}

function makeSafePromise(fn, fallback) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        if (typeof fallback === 'function') {
          return fallback(...args);
        }
        return fallback;
      }
      throw err;
    }
  };
}

const mockStats = {
  isDirectory: () => true,
  isFile: () => false,
  isSymbolicLink: () => false,
  size: 0,
  mtime: new Date(),
  atime: new Date(),
  ctime: new Date(),
  birthtime: new Date()
};

fs.realpathSync = makeSafeSync(fs.realpathSync, (p) => p);
fs.realpath = makeSafeAsync(fs.realpath, (p) => p);
fs.promises.realpath = makeSafePromise(fs.promises.realpath, (p) => p);

fs.lstatSync = makeSafeSync(fs.lstatSync, () => mockStats);
fs.lstat = makeSafeAsync(fs.lstat, () => mockStats);
fs.promises.lstat = makeSafePromise(fs.promises.lstat, () => mockStats);

fs.statSync = makeSafeSync(fs.statSync, () => mockStats);
fs.stat = makeSafeAsync(fs.stat, () => mockStats);
fs.promises.stat = makeSafePromise(fs.promises.stat, () => mockStats);
