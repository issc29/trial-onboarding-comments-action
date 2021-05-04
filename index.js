const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const yaml = require('js-yaml');
const myToken = core.getInput('github-token');
const octokit = github.getOctokit(myToken)
const payload = github.context.payload
const cardID = payload.project_card.node_id




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

  var regionNotificationSettings
  try {
    let settingsContents = fs.readFileSync('./.github/settings/trial-onboarding-comments-settings.yml');
    let settings = yaml.safeLoad(settingsContents);
    console.log(settings)
    regionNotificationSettings = settings['region-notifications']
    console.log(regionNotificationSettings)
  } catch(error) {
  }

  try {

    var POCObjectLink = ''
    try {
      POCObjectLink = functions.getPOCObjectLink(body)
    } catch(error) {
    }

    var githubOrg = ''
    try {
      githubOrg = functions.getGitHubOrgs(body)
    } catch(error) {
    }

    const regionLabels = ['region-emea', 'corporate-se-emea', 'region-apac', 'corporate-se-apac',
      'region-east', 'region-west','region-central', 'corporate-se-amer', 'region-pubsec']

    var type = ''
    try {
      type = functions.getType(labels)
    } catch(error) {
    }

    var region = ''
    try {
      region = functions.getRegion(labels, regionLabels)
    } catch(error) {
    }

    var companyName = ''
    try {
      companyName = functions.getCompanyName(title)
    } catch(error) {
    }

    var foundAllCriteria = false
    if(POCObjectLink && companyName && githubOrg && type && region) {
      foundAllCriteria = true
    }


    var contactUsers = core.getInput('contact-users');
    if(region) {
      contactUsers = getContactUsersString(region, regionNotificationSettings, contactUsers)
    }
    

    var comment = ''
    comment += `${contactUsers} awaiting GHAS POC access to be enabled\n\n`
    comment += (POCObjectLink) ? ':white_check_mark: POC Link Found\n' : ':x: POC Not Link Found\n'
    comment += (companyName) ? `:white_check_mark: Company Name:  **${companyName}**\n` : ':x: Company Name Not Found. Issue title must be formatted as: `[GHAS * Trial]: Company Name, Date`\n'
    comment += (githubOrg) ? `:white_check_mark: Organization(s) to be enabled: ${githubOrg}\n` : ':x: Could not find Organization(s) to be enabled\n'
    comment += (type) ? `:white_check_mark: Type: **${type}**\n` : ':x: Type Not Found. Issue should have a `ghec` or `ghes` label.\n'
    comment += (region) ? `:white_check_mark: Region Label: **${region}**\n` : ':x: Region Label Not Found\n'
    comment += (foundAllCriteria) ? `` : `\nFill in the required information by editing the issue body :point_up:`



    await functions.commentOnIssue(issueInfo.id, comment)
  } catch (e) {
    console.log(e)
  }

}


function getContactUsersString(region, regionNotificationSettings, defaultContact){
  try {
    var regionUsers = regionNotificationSettings[region]
    var regionUsersList = regionUsers.split(",").map(function(item) {
      return item.trim();
    });

    contactUsers = ''
    for (const regionUser of regionUsersList){
      contactUsers += `@${regionUser} `
    }
    return contactUsers
  } catch (e) {
    console.log(e)
    return defaultContact
  }
}