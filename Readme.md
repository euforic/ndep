
# ndep
Node as an module dependency. Useful in sandboxed environments.

## Ndep([opts])
Create new instance of `Ndep`

```js
var ndep = Ndep({
 /*
  version: Nodejs version. Defaults to current stable node
  arch: Defaults to `process.arch`
  platform: Defaults to `process.platform`
  distDir: dir to store node dists. Defaults to `path_to_ndep/dists/`
  */
});
```

## nDep.ls(callback)
## nDep.list(callback)
List all local, available, stable and unstable node versions

```js
nDep.ls(function () {
  // do something
});
```

## nDep.available(callback)
List all available node versions

```js
nDep.available(function () {
  // do something
});
```

## nDep.local(callback)
List all local node versions

```js
nDep.local(function () {
  // do something
});
```

## nDep.add(version, callback)
Add a new local node version

```js
nDep.add('0.10.14', function () {
  // do something
});
```

## nDep.rm(callback)
## nDep.remove(callback)
Remove a single, array or all local node version

```js
// remove one
nDep.rm('0.10.14', function () {
  // do something
});

// remove array of versions
nDep.rm(['0.10.14', 0.10.13], function () {
  // do something
});

// remove all versions from the distPath.
nDep.rm('*', function () {
  // do something
});
```

## nDep.set(version, callback)
Set the current node version to use. If it does not exist local it is fetched.

```js
nDep.set('0.11.0', function () {
  // do something
});
```

## nDep.fetch(version, callback)
Download and untar a node version.

```js
nDep.fetch('0.11.0', function () {
  // do something
});
```

## nDep.exec([opts], callback)
Call `child_process.exec` with the current node version or pass in the `version` with `opts`.
Returns `child_process.exec` instance

```js

// call on current node version
nDep.exec('-v', function () {
  // do something
}).stdout.pipe(process.stdout);

// call on different temp different node version
nDep.exec('-v', {version: '0.11.0'}, function () {
  // do something
}).stdout.pipe(process.stdout);
```

## nDep.spawn(args, [opts])
Call `child_process.spawn` with the current node version or pass in the `version` with `opts`.
Returns `child_process.spawn` instance

```js
// call on current node version
nDep.spawn(['-v']).stdout.pipe(process.stdout);

// call on different temp different node version
nDep.spawn(['-v'], {version: '0.11.0'}).stdout.pipe(process.stdout);
```

## License

MIT
