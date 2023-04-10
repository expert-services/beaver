const stream = require('stream')
const stepRegex = /(.*)\/(.*)/g;
const nameRegex = /(.*)\_([a-zA-Z -]*).*\.txt/g;
const logLineRegex = /(\d+-\d+-\d+T\S+)\s(\S+.*)/gm;
const yaml = require('js-yaml');

module.exports = class WorklowLogsParser {
    constructor() {
        super()
    }

    parseLogs(str) {

        let m;
        let inGroup = false;
        let groupName = '';
        let groupData = [];
        const job = {};
        const steps = [];
        let isStep = false;
        let step = {};

        while ((m = logLineRegex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === logLineRegex.lastIndex) {
                logLineRegex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                console.log(`Found match, group ${groupIndex}: ${match}`);

                // First field is the date time
                if (groupIndex === 1) {
                    //console.log(`Datetime = ${match}`);
                    if (isStep) {
                        if (!step.startedAt) {
                            step.startedAt = match;
                        }
                        step.completedAt = match;
                    } else {
                        if (job.startedAt) {
                            job.startedAt = match;
                        }
                        job.completedAt = match;
                    }
                }
                // Rest of the fields in the log lines
                if (groupIndex === 2) {
                    // console.log(`${this.eventData.relativePath} logline = ${match}`);
                    if (isStep) {
                        if (match.startsWith('##[endgroup]')) {
                            if (groupName.includes('Run')) {
                                this.eventData.step.run = groupData.join('\n\r');
                                this.eventData.step.action = null;
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
                        };
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
                        }    
                    }
                }
            });
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
            this.eventData.job.jobName = matches[1];
            const parsedName = this.parseName(matches[2]);
            this.eventData.step.sequence = parsedName.sequence;
            this.eventData.step.stepName = parsedName.value;
            this.eventData.step.action = parsedName.value;
        } else {
            const parsedName = this.parseName(this.eventData.relativePath);
            this.eventData.job.sequence = parsedName.sequence;
            this.eventData.job.jobName = parsedName.value;
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
}
