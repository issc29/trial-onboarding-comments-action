const core = require('@actions/core');
const github = require('@actions/github');
const dedent = require('dedent');
const myToken = core.getInput('github-token');
const octokit = github.getOctokit(myToken)
const payload = github.context.payload
const cardID = payload.project_card.node_id
const onboardingComment = core.getInput('onboarding-comment');


const functionsLib = require('actions-api-functions');
var functions = new functionsLib(octokit, core)

run();

async function run() {

  const cardInfo = await functions.getIssueInfoFromProjectCard(cardID)
  const issueInfo = cardInfo.content

  const issueID = issueInfo.id
  const reponame = issueInfo.repository.name
  const orgname = issueInfo.repository.owner.login
  const number = issueInfo.number
  const title = issueInfo.title
  const author = issueInfo.author.login
  const body = issueInfo.body
  console.log(issueID)
  console.log(reponame)
  console.log(orgname)
  console.log(number)
  console.log(title)
  console.log(author)
  console.log(body)
  //await functions.commentOnIssue(issueInfo.id, onboardingComment

}


