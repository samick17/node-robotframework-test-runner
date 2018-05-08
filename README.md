# node-robotframework-test-runner
Robotframework TestCase Runner Written in NodeJS

[![Build Status](https://travis-ci.org/samick17/node-robotframework-test-runner.svg?branch=master)](https://travis-ci.org/samick17/node-robotframework-test-runner)


## Usage - clone
1. Interactive CLI

    > npm start
    
    run cli

    > npm runtest
    
    run testcases

    > npm clean
    
    cleanup report

    > npm gentrendreport
    
    generate trend report by existing reports

## Usage - as a npm module

1. Installation

    > npm install node-robotframework-test-runner --save

2. How to use?

```
var TestRunner = require('node-robotframework-test-runner');
var pathOfSoftwareUnderTestingLibrary = './sut-lib.js';
var pathOfRobotframeworkTestCasesDirectory = './testcases-passed';
TestRunner.run(pathOfSoftwareUnderTestingLibrary, pathOfRobotframeworkTestCasesDirectory)
.then((data) => {
    console.log(data[0]);
    console.log('done!!!');
    process.exit();
}, (err) => {
    console.log(err);
    process.exit();
});
```

   Or Reference repository: [example-of-node-robotframework-test-project](https://github.com/samick17/example-of-node-robotframework-test-project) 

## References
1. https://github.com/comick/node-robotremoteserver

