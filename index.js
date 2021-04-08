const core = require('@actions/core');
const github = require('@actions/github');
const dedent = require('dedent');
const myToken = core.getInput('github-token');
const octokit = github.getOctokit(myToken)
const payload = github.context.payload
const issueID = payload.project_card.node_id
const onboardingComment = core.getInput('onboarding-comment');


const functionsLib = require('actions-api-functions');
var functions = new functionsLib(octokit, core)

run();

async function run() {

  await functions.commentOnIssue(issueID, onboardingComment)



}


