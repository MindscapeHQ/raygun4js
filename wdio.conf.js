var RUN_LOCAL = process.env.LOCAL === "true";

exports.config = {
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    //

    // Maintainers: this is a good way to specify single tests when debugging, alongside setting
    // maxInstances to 1 below
    specs: [
        './tests/specs/**/*.js'
    ],
    // Patterns to exclude.
    exclude: [
        // 'path/to/excluded/files'
    ],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: 4,
    capabilities: RUN_LOCAL ? [{
        browserName: 'chrome',
        chromeOptions: {
            args: ['headless', 'disable-gpu', 'no-sandbox']
        },
        maxInstances: 2,
    }] : [
        {
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '9',
            exclude: [
                // IE9 does not support window.performance.getEntries
                // This means it does not support the full RUM functionality
                'tests/specs/v2/rumXhrStatusTracking.js'
                'tests/specs/v2/rumXhrStatusTracking.js',
                'tests/specs/v2/rumXhrPerformanceTimings.js'
            ]
        },
        {
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '10',
        },
        {
            browserName: 'internet explorer',
            platform: 'Windows 8.1',
            version: '11',
        },
        {
            browserName: 'MicrosoftEdge',
            platform: 'Windows 10',
            version: 'latest',
        },
        {
            browserName: 'MicrosoftEdge',
            platform: 'Windows 10',
            version: 'latest-1',
        },
        {
            browserName: 'MicrosoftEdge',
            platform: 'Windows 10',
            version: 'latest-2',
        },
        {
            browserName: 'chrome',
            platform: 'Windows 10',
            version: 'latest',
        },
        {
            browserName: 'chrome',
            platform: 'Windows 10',
            version: 'latest-1',
        },
        {
            browserName: 'chrome',
            platform: 'Windows 10',
            version: 'latest-2',
        },
        {
            browserName: 'chrome',
            platform: 'Windows 10',
            version: 'latest-3',
        },
        {
            browserName: 'firefox',
            platform: 'Windows 10',
            version: 'latest',
        },
        {
            browserName: 'firefox',
            platform: 'Windows 10',
            version: 'latest-1',
        },
        {
            browserName: 'firefox',
            platform: 'Windows 10',
            version: 'latest-2',
        },
        // Safari 12 will not load localhost without an error
        // need to figure out a solution
        // {
        //     browserName: 'safari',
        //     platform: 'macOS 10.14',
        //     version: '12.0',
        // },
        {
            browserName: 'safari',
            platform: 'macOS 10.13',
            version: '11.1',
        },
        {
            browserName: 'safari',
            platform: 'macOS 10.12',
            version: '10.1',
            exclude: [
                // Safari 10 does not support window.performance.getEntries
                // This means it does not support the full RUM functionality
                'tests/specs/v2/rumXhrStatusTracking.js'
                'tests/specs/v2/rumXhrStatusTracking.js',
                'tests/specs/v2/rumXhrPerformanceTimings.js'
            ]
        },
    ],

    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // By default WebdriverIO commands are executed in a synchronous way using
    // the wdio-sync package. If you still want to run your tests in an async way
    // e.g. using promises you can set the sync option to false.
    sync: true,
    //
    // Level of logging verbosity: silent | verbose | command | data | result | error
    logLevel: 'verbose',
    //
    // Enables colors for log output.
    coloredLogs: true,
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Saves a screenshot to a given path if a command fails.
    screenshotPath: false,
    //
    // Set a base URL in order to shorten url command calls. If your url parameter starts
    // with "/", then the base url gets prepended.
    baseUrl: 'http://localhost',

    host: 'localhost',

    port: RUN_LOCAL ? 9515 : 4445,
    path: RUN_LOCAL ? '/' : '/wd/hub',
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 10000,
    //
    // Default timeout in milliseconds for request
    // if Selenium Grid doesn't send response
    connectionRetryTimeout: 90000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    //
    // Initialize the browser instance with a WebdriverIO plugin. The object should have the
    // plugin name as key and the desired plugin options as properties. Make sure you have
    // the plugin installed before running any tests. The following plugins are currently
    // available:
    // WebdriverCSS: https://github.com/webdriverio/webdrivercss
    // WebdriverRTC: https://github.com/webdriverio/webdriverrtc
    // Browserevent: https://github.com/webdriverio/browserevent
    // plugins: {
    //     webdrivercss: {
    //         screenshotRoot: 'my-shots',
    //         failedComparisonsRoot: 'diffs',
    //         misMatchTolerance: 0.05,
    //         screenWidth: [320,480,640,1024]
    //     },
    //     webdriverrtc: {},
    //     browserevent: {}
    // },
    //
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.

    plugins: {
    },

    services: [RUN_LOCAL ? 'chromedriver' : 'sauce', 'static-server'],
    chromeDriverArgs: ['--headless', '--disable-gpu'],
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    sauceConnect: true,

    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: http://webdriver.io/guide/testrunner/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'jasmine',
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: http://webdriver.io/guide/testrunner/reporters.html
    reporters: ['dot'],
    
    //
    // Options to be passed to Jasmine.
    jasmineNodeOpts: {
        //
        // Jasmine default timeout
        defaultTimeoutInterval: 1000000,
        //
        // The Jasmine framework allows interception of each assertion in order to log the state of the application
        // or website depending on the result. For example, it is pretty handy to take a screenshot every time
        // an assertion fails.
        expectationResultHandler: function(passed, assertion) {
            // do something
        }
    },

    staticServerFolders: [
        { mount: '/fixtures', path: './tests/fixtures' },
        { mount: '/dist', path: './dist' }
    ],

    staticServerPort: 4567,

    debug: true,
    
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
    // it and to build services around it. You can either apply a single function or an array of
    // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    //
    // Gets executed once before all workers get launched.
    onPrepare: function (config, capabilities) {
        if (process.env.TRAVIS) {
            for (var i = 0;i < capabilities.length; i++) {
                capabilities[i]['tunnel-identifier'] = process.env.TRAVIS_JOB_NUMBER;
                capabilities[i].build = process.env.TRAVIS_BUILD_NUMBER;
            }
        }
    },
    //
    // Gets executed just before initialising the webdriver session and test framework. It allows you
    // to manipulate configurations depending on the capability or spec.
    // beforeSession: function (config, capabilities, specs) {
    // },
    //
    // Gets executed before test execution begins. At this point you can access all global
    // variables, such as `browser`. It is the perfect place to define custom commands.
    before: function (capabilities, specs) {
    },
    //
    // Hook that gets executed before the suite starts
    // beforeSuite: function (suite) {
    // },
    //
    // Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
    // beforeEach in Mocha)
    // beforeHook: function () {
    // },
    //
    // Hook that gets executed _after_ a hook within the suite starts (e.g. runs after calling
    // afterEach in Mocha)
    // afterHook: function () {
    // },
    //
    // Function to be executed before a test (in Mocha/Jasmine) or a step (in Cucumber) starts.
    // beforeTest: function (test) {
    // },
    //
    // Runs before a WebdriverIO command gets executed.
    // beforeCommand: function (commandName, args) {
    // },
    //
    // Runs after a WebdriverIO command gets executed
    // afterCommand: function (commandName, args, result, error) {
    // },
    //
    // Function to be executed after a test (in Mocha/Jasmine) or a step (in Cucumber) starts.
    // afterTest: function (test) {
    // },
    //
    // Hook that gets executed after the suite has ended
    // afterSuite: function (suite) {
    // },
    //
    // Gets executed after all tests are done. You still have access to all global variables from
    // the test.
    // after: function (result, capabilities, specs) {
    // },
    //
    // Gets executed right after terminating the webdriver session.
    // afterSession: function (config, capabilities, specs) {
    // },
    //
    // Gets executed after all workers got shut down and the process is about to exit. It is not
    // possible to defer the end of the process using a promise.
    // onComplete: function(exitCode) {
    // }
}
