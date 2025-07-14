/* globals describe, it, expect */

var { exec } = require('child_process');
var path = require('path');

describe("TypeScript Definitions", function() {
  it("should compile without errors", function(done) {
    var tsFile = path.join(__dirname, '../types-test.ts');
    var cmd = 'npx tsc --noEmit ' + tsFile + ' --strict';
    
    exec(cmd, function(error, stdout, stderr) {
      if (error) {
        console.error('TypeScript compilation failed:', error);
        console.error('stdout:', stdout);
        console.error('stderr:', stderr);
        expect(error).toBeNull();
      } else {
        console.log('TypeScript compilation succeeded');
      }
      done();
    });
  });
});
