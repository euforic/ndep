
/**
 *  module deps
 */

var Stream = require('stream')
  , request = require('superagent')
  , fs = require('fs')
  , path = require('path')
  , join = path.join
  , zlib = require('zlib')
  , tar = require('tar')
  , cp = require('child_process')
  , spawn = cp.spawn
  , exec = cp.exec
  , rmrf = require('rmrf')
  , debug = require('debug')('nadep');


var DIST_URL = 'http://nodejs.org/dist/';
var DIST_DIR = join(__dirname, '..', 'dists');
var noop = function noop() {};

if (!fs.existsSync(DIST_DIR)) fs.mkdir(DIST_DIR);

/**
 * expose `nDep`
 */

module.exports = Ndep;

/**
 * Ndep constuctor
 *
 * @param {Object} opts
 */

function Ndep(opts) {
  if (!(this instanceof Ndep)) return new Ndep(opts);

  Stream.call(this);
  opts = opts || {}

  var self = this;

  this.arch = opts.arch || process.arch;
  this.platform = opts.platform = process.platform;
  this.distDir = opts.distDir || DIST_DIR;
  this._versions = {};

  if (opts.version ) return this.set(opts.version);

  this.available(function (vers){
    // probably a better way to do this.
    var stable = vers.join().match(/[0-9]+\.[0-9]*[02468]\.[0-9]+/g).pop();
    debug('No version set default to current stable', stable);
    self.set(stable);
  });
}

/**
 * inherit from `Stream`
 */

Ndep.prototype.__proto__ = Stream.prototype;

/**
 * list all available and local node version
 * @return {Object}
 */

Ndep.prototype.ls =
Ndep.prototype.list = function (fn) {
  var self = this;

  self.available(function (avail){
    self.local(function (local) {
      var vString = avail.join();
      var stable = vString.match(/[0-9]+\.[0-9]*[02468]\.[0-9]+/g).pop();
      var unstable = vString.match(/[0-9]+\.[0-9]*[13579]\.[0-9]+/g).pop();

      fn({stable: stable, unstable: unstable, available:avail, local: local});
    });
  });
}

/**
 * [ description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */

Ndep.prototype.available = function(fn) {
  if (this._versions.available) return fn(this._versions.available);

  var self = this;
  var vers = [];

  request
    .get(DIST_URL + 'npm-versions.txt')
    .end(function(err, res){
      if (err) throw new Error(err);
      res.text.split('\n').forEach(function(v){
        var _vers = v.replace('v', '').split(' ');
        vers.push(_vers[0]);
      });

      vers.shift();
      vers.pop();

      self._versions.available = vers;
      fn(vers);
    });
};

/**
 * [ description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */

Ndep.prototype.local = function (fn) {
  if (this._versions.local) return fn(this._versions.local);

  var self = this;

  fs.readdir(self.distDir, function(err, vers){

    self._versions.local = vers || [];
    fn(self._versions.local);
  });
};

/**
 * [ description]
 * @return {[type]} [description]
 */

Ndep.prototype.add = function (version, fn) {
  var callback = fn || noop;
  var self = this;

  self.local(function (versions){
    debug(versions);
    if (!~versions.indexOf(version)) {
      debug('fetching node version', version)
      self.fetch({version: version}, function (err) {
        callback(err);
      });

    } else {
      callback();
    }
  });
};

/**
 * remove one
 * @return {[type]} [description]
 */

Ndep.prototype.rm =
Ndep.prototype.remove = function (versions, fn) {
  var self = this;
  var callback = fn || noop;

  if (versions === '*') {
    debug('Removing all node dist');
    return self.local(function(vers){
      debug(vers);
      vers.forEach(function (v) {
        debug('Removing node dist', self.distDir, v);
        var vPath = join(self.distDir ,v);
        rmrf(vPath, function (err) {
        });
      });
      callback();
    });
  }

  versions = ('string' === typeof versions)
    ? [versions]
    : versions;

  versions.forEach(function (v) {
    debug('Removing node dist', self.distDir, v);
    var vPath = join(self.distDir ,v);
    rmrf(vPath, function (err) {
      return callback(err);
    });
  });
  callback();
};

/**
 * [ description]
 * @return {[type]} [description]
 */

Ndep.prototype.set = function (version, fn) {
  var self = this;
  var callback = fn || noop;

  self.add(version, function (err){
    self._version = version;
    self.nodePath = join(self.distDir, version, 'bin', 'node');
    callback(err);
  });
};

/**
 * fetch and untar node bin
 *
 *  example: `nDep(0.10.15)`
 *
 * @param  {String} version
 * @return  {Null}
 */

Ndep.prototype.fetch = function (opts, fn) {
  var callback = fn || noop;
  if (!opts.version) throw new Error('version must be specified');
  var version = opts.version;
  var platform = opts.platform || this.platform;
  var arch = opts.arch || this.arch;
  var distDir = opts.distDir || this.distDir

  if (fs.existsSync(join(distDir, version))) return;

  var nFoloder = 'node-v' + version + '-' + platform + '-' + arch;
  var tarURL = 'v' + version + '/' + nFoloder + '.tar.gz';

  debug('Fetching node ' + version + ' from ' + DIST_URL + tarURL);

  request
    .get(DIST_URL + tarURL)
    .on('error', function (err) { return callback(err); })
    .pipe(zlib.createGunzip())
      .pipe(tar.Extract({ path: distDir }))
        .on('end', function(err){
          try {
            fs.renameSync(join(distDir, nFoloder), join(distDir, version));
          } catch(e) {
            rmrf(nFoloder + 'tar.gz');
          }
          callback();
        });
};

/**
 * [ description]
 * @param  {[type]}   opts [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */

Ndep.prototype.exec = function (command, opts, fn) {
  var options = opts || {};
  var version = options.version || this._version;
  var nPath = join(this.distDir, version, 'bin', 'node');
  var cmd =   nPath + ' ' + command || '';

  return exec(cmd, opts, fn);
};

/**
 * [ description]
 * @param  {[type]}   opts [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */

Ndep.prototype.spawn = function (args, opts) {
  var options = opts || {};
  var version = options.version || this._version;
  var cmd = join(this.distDir, version, 'bin', 'node');

  debug('Spawning command', cmd, args, options);

  return spawn(cmd, args, opts);
};
