var Ndep = require('..');

var nDep = Ndep({
  version: '0.10.3'
});

nDep.list(function (v){
  console.log(v);
});

nDep.add('0.10.8', function (){
  console.log('Added to dists 0.10.8');
});

nDep.add('0.11.0', function (){
  console.log('Added to dists 0.10.8');
});

nDep.available(function (v) {
  console.log(v);
});

nDep.local(function (v){
  console.log(v);
});

setTimeout(function(){

  nDep.rm(['0.10.8', '0.10.17'], function(v){
    console.log(v);
  });

},15000);

setTimeout(function (){

  nDep.set('0.11.1', function (){
    nDep.exec('-v').stdout.pipe(process.stdout);
  });

  nDep.set('0.10.3', function (){
    nDep.spawn(['-v']).stdout.pipe(process.stdout);
  });

// call on current node version
nDep.spawn(['-v']).stdout.pipe(process.stdout);

// call on different temp different node version
nDep.spawn(['-v'], {version: '0.11.0'}).stdout.pipe(process.stdout);

// call on current node version
nDep.exec('-v', function () {
  // do something
}).stdout.pipe(process.stdout);

// call on different temp different node version
nDep.exec('-v', {version: '0.11.0'}, function () {
  // do something
}).stdout.pipe(process.stdout);

}, 15000);
