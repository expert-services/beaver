const stream = require('stream')
const stepRegex = /(.*)\/(.*)/g;
const nameRegex = /(.*)\_([a-zA-Z -]*).*\.txt/g;
const actionsRegex = /Download action repository '(.*)' \((.*)\)/g;
const logLineRegex = /(\d+-\d+-\d+T\S+)\s(\S+.*)/gm;
const yaml = require('js-yaml');

module.exports = class StringOutputStream extends stream.Writable {

    static createInstance = (eventData) => {
        const instance = new StringOutputStream();
        if (eventData.relativePath) {
            instance.setWorkflowEventData(eventData);
        } else {
            instance.setJobEventData(eventData);
        }
        return instance;
    }

    constructor(options) {
        super(options)
        this.data = ''
        this.isStep = false;
    }

    _write(chunk, encoding, callback) {
        this.data += chunk
        // if (this.isStep) {
        //     this.eventData.step.logs += chunk;
        // } else {
        //     this.eventData.job.logs += chunk;
        // }
        this.parseLogs();
        callback()
    }

    processLogsAsString(str) {
        this.data = str;
        this.parseLogs();
    }

    parseLogs() {
        let m;
        let inGroup = false;
        let groupName = '';
        let groupData = [];
        let prevLine = '';
        while ((m = logLineRegex.exec(this.data)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === logLineRegex.lastIndex) {
                logLineRegex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                //console.log(`Found match, group ${groupIndex}: ${match}`);
                if (groupIndex === 1) {
                    //console.log(`Datetime = ${match}`);
                    if (this.isStep) {
                        if (!this.eventData.step.startedAt) {
                            this.eventData.step.startedAt = match;
                        }
                        this.eventData.step.completedAt = match;
                    } else {
                        if (!this.eventData.job.startedAt) {
                            this.eventData.job.startedAt = match;
                        }
                        this.eventData.job.completedAt = match;
                    }
                }
                if (groupIndex === 2) {
                    console.log(`${this.eventData.relativePath} logline = ${match}`);
                    if (this.isStep) {
                        if (match.startsWith('##[endgroup]')) {
                            // This is not correct, but leave it for now
                            if (groupName.startsWith('Run')) {
                                if (!this.eventData.step.action || this.eventData.step.action === '') {
                                    this.eventData.step.run = groupData.join('\n\r').replace(/\u001b\[36;1m/g,'\r\n');
                                }
                            }
                            inGroup = false;
                            groupName = ''
                            groupData = [];
                        } else
                        if (inGroup) {
                            groupData.push(match);
                        }
                        if (match.startsWith('##[group]')) {
                            inGroup = true;
                            groupName = match.replace('##[group]', '');
                        } else if (match.startsWith('##[error]')) {
                            this.eventData.step.error = match.replace('##[error]', '');
                            this.eventData.job.conclusion = 'failure';
                        } else if (match.startsWith('##[warning]')) {
                            this.eventData.job.warning = match.replace('##[warning]', '');
                        } else if (match.startsWith('with:')) {  
                            const action = prevLine.replace('##[group]Run ', '');
                            this.eventData.step.action = action;
                            this.eventData.step.run = "";
                        }
                    } else {
                        if (match.startsWith('##[endgroup]')) {
                            if (groupName === 'Operating System') {
                                this.eventData.job.runnerOS = groupData.join(' ');
                            } else if (groupName === 'Runner Image') {
                                this.eventData.job.runnerImage = groupData.join(' ');
                            } else if (groupName === 'Runner Image Provisioner') {
                                this.eventData.job.runnerImageProvisioner = groupData.join(' ');
                            } else if (groupName === 'GITHUB_TOKEN Permissions') {
                                this.eventData.job.permissions = yaml.load(groupData.join('\r\n'));
                            }
                            inGroup = false;
                            groupName = ''
                            groupData = [];
                        } else
                        if (inGroup) {
                            groupData.push(match);
                        }
                        if (match.startsWith('##[group]')) {
                            inGroup = true;
                            groupName = match.replace('##[group]', '');
                        } else if (match.startsWith('##[error]')) {
                            this.eventData.job.error = match.replace('##[error]', '');
                            this.eventData.job.conclusion = 'failure';
                        } else if (match.startsWith('##[warning]')) {
                            this.eventData.job.warning = match.replace('##[warning]', '');
                        } else if (match.startsWith('##[command]')) {
                        } else if (match.startsWith('Requested labels:')) {
                            this.eventData.job.labelsRequested = match.replace('Requested labels: ', '');
                        } else if (match.startsWith('Requested runner group:')) {
                            this.eventData.job.runnerGroupRequested = match.replace('Requested runner group:', '');
                        } else if (match.startsWith('Runner group matched:')) {
                            this.eventData.job.runnerGroupMatched = match.replace('Runner group matched:', '');
                        } else if (match.startsWith('Download action repository')) {
                            const actionInfo = this.parseActions(match)
                            this.eventData.job.actions[actionInfo.name] = actionInfo;
                        }
                    }
                }
            });
            prevLine = m[2];

        }
    }

    toString() {
        return JSON.stringify(this.eventData, null, 2);
        // return this.data
    }

    logs() {
        if (this.isStep) {
            return this.eventData.step.logs;
        } else {
            return this.eventData.job.logs;
        }
    }

    setWorkflowEventData(eventData) {
        this.eventData = eventData;
        this.parse();
    }

    setJobEventData(eventData) {
        this.eventData = eventData;
    }

    parse() {
        let m;

        if (this.eventData.relativePath.search(stepRegex) !== -1) {
            const matches = stepRegex.exec(this.eventData.relativePath);
            const x = this.eventData.relativePath.match(stepRegex);
            this.isStep = true;
            this.eventData.job.jobName = matches[1].trim();
            const parsedName = this.parseName(matches[2]);
            this.eventData.step.sequence = parsedName.sequence;
            this.eventData.step.stepName = parsedName.value.trim();
            this.eventData.step.action = '';
        } else {
            const parsedName = this.parseName(this.eventData.relativePath);
            this.eventData.job.sequence = parsedName.sequence;
            this.eventData.job.jobName = parsedName.value.trim();
        }
    }

    parseName(str) {
        const parsedName = {
            sequence: 0,
            value: ''
        };
        const matches = nameRegex.exec(str);
        const x = str.match(nameRegex);
        parsedName.sequence = parseInt(matches[1]);
        parsedName.value = matches[2];
        return parsedName;
    }

    parseActions(str) {
        const parsedAction = {
            name: '',
            sha: ''
        };
        const matches = actionsRegex.exec(str);
        const x = str.match(actionsRegex);
        parsedAction.name = matches[1];
        parsedAction.sha = matches[2];
        return parsedAction;
    }
}
