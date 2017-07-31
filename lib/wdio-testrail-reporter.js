let events = require('events');
let TestRail = require('./test-rail');
let titleToCaseIds = require('mocha-testrail-reporter/dist/lib/shared').titleToCaseIds;
let Status = require('mocha-testrail-reporter/dist/lib/testrail.interface').Status;

class WdioTestRailReporter extends events.EventEmitter {

    constructor(baseReporter, config) {
        super(baseReporter, config);
        const options = config.testRailsOptions;

        this._results = [];
        this._passes = 0;
        this._fails = 0;
        this._pending = 0;
        this._out = [];

        this._validate(options, 'domain');
        this._validate(options, 'username');
        this._validate(options, 'password');
        this._validate(options, 'projectId');
        this._validate(options, 'suiteId');

        this.on('test:pending', (test) => {
            this._pending++;
        this._out.push(test.title + ': pending');
    });

        this.on('test:pass', (test) => {
            this._passes++;
        this._out.push(test.title + ': pass');
        let caseIds = titleToCaseIds(test.title);
        if (caseIds.length > 0) {
            let results = caseIds.map(caseId => {
                return {
                    case_id: caseId,
                    status_id: Status.Passed,
                    comment: `${test.title}`
                };
        });
            this._results.push(...results);
        }
    });

        this.on('test:fail', (test) => {
            this._fails++;
        this._out.push(test.title + ': fail');
        let caseIds = titleToCaseIds(test.title);
        if (caseIds.length > 0) {
            let results = caseIds.map(caseId => {
                return {
                    case_id: caseId,
                    status_id: Status.Failed,
                    comment: `${test.title}
${test.err.message}
${test.err.stack}
`
                };
        });
            this._results.push(...results);
        }
    });

        this.on('suite:end', () => {
            if (this._results.length == 0) {
            console.warn("No testcases were matched. Ensure that your tests are declared correctly and matches TCxxx");
        }
        let executionDateTime = new Date();
        let total = this._passes + this._fails + this._pending;
        let name = `Automated test run ${executionDateTime}`;
        let description = `Automated test run executed on ${executionDateTime.toDateString()} ${executionDateTime.toTimeString()}
Execution summary:
Passes: ${this._passes}
Fails: ${this._fails}
Pending: ${this._pending}
Total: ${total}

Execution details:
${this._out.join('\n')}                     
`;
        new TestRail(options).publish(name, description, this._results);
    });
    }

    _validate(options, name) {
        if (options == null) {
            throw new Error("Missing testRailsOptions in wdio.conf");
        }
        if (options[name] == null) {
            throw new Error(`Missing ${name} value. Please update testRailsOptions in wdio.conf`);
        }
    }
}

module.exports = WdioTestRailReporter;