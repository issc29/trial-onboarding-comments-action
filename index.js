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
  const title = issueInfo.title
  const author = issueInfo.author.login
  const body = issueInfo.body
  const labels = issueInfo.labels.nodes
  console.log(issueID)
  
  const isPocLinkFound = /.*(https:\/\/github\.lightning\.force\.com.*Proof_of_Concept.*view).*/.test(body)
  const isGitHubOrgFound = /.*GitHub Organization\(s\)\*\* - `(.*)`.*/.test(body)

  const regionLabels = ['region-emea', 'corporate-se-emea', 'region-apac', 'corporate-se-apac',
    'region-east', 'region-west','region-central', 'corporate-se-amer', 'region-pubsec']
  var type = ''
  var region = ''
  for(label of labels) {
    if(label.name == 'ghec') {
      type = "Cloud"
    }
    if(label.name == 'ghes') {
      type = "Server"
    }

    if(regionLabels.includes(label.name)) {
      region = label.name
    }
  }

  var comment = ''
  comment += (isPocLinkFound) ? ':white_check_mark: POC Link Found\n' : ':x: POC Not Link Found\n'
  comment += (isGitHubOrgFound) ? ':white_check_mark: Organization Found\n' : ':x: Organization Not Found\n'
  comment += (!type == '') ? `:white_check_mark: Type: ${type}\n` : ':x: Type Not Found\n'
  comment += (!region == '') ? `:white_check_mark: Region Label ${region}\n` : ':x: Region Label Not Found\n'



  await functions.commentOnIssue(issueInfo.id, comment)

}


