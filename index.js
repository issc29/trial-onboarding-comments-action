const core = require('@actions/core');
const github = require('@actions/github');
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
    regionNotificationSettings = yaml.load(core.getInput('region-notifications'));
    //console.log(regionNotificationSettings)
  } catch(error) {
    console.log(error.message)
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

    const regionLabels = ['region-emea', 'region-corporate-emea', 'region-apac', 'region-corporate-apac',
      'region-east', 'region-west','region-central', 'region-corporate-amer', 'region-pubsec', 'region-semea', 'region-nemea', 'region-latam', 'region-canada']

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


    var contactUsers = getContactUsersString(core.getInput('default-contacts'))
    var regionUsers = ''
    if(region) {
      regionUsers = getContactUsersBasedOffRegion(region, regionNotificationSettings)
    }
    contactUsers = (regionUsers) ? regionUsers : contactUsers
    

    var comment = ''
    comment += `${contactUsers} awaiting GHAS POC access to be enabled\n\n`
    comment += (POCObjectLink) ? ':white_check_mark: POC Link Found\n' : ':x: POC Not Link Found\n'
    comment += (companyName) ? `:white_check_mark: Company Name:  **${companyName}**\n` : ':x: Company Name Not Found. Issue title must be formatted as: `[GHAS * Trial]: Company Name, Date`\n'
    comment += (type) ? `:white_check_mark: Type: **${type}**\n` : ':x: Type Not Found. Issue should have a `ghec` or `ghes` label.\n'
    comment += (type != 'Cloud') ? '' : ((githubOrg) ? `:white_check_mark: Organization(s) to be enabled: ${githubOrg}\n` : ':x: Could not find Organization(s) to be enabled\n')
    comment += (region) ? `:white_check_mark: Region Label: **${region}**\n` : ':x: Region Label Not Found\n'
    comment += (foundAllCriteria) ? `` : `\nFill in the required information by editing the issue body :point_up:`



    await functions.commentOnIssue(issueInfo.id, comment)
  } catch (e) {
    console.log(e)
  }

}

function convertStringToList(string){
  var list = string.split(",").map(function(item) {
    return item.trim();
  });
  return list
}

function getContactUsersString(users) {
  var UsersList = convertStringToList(users)
  var contactUsers = ''
    for (const user of UsersList) {
      contactUsers += `@${user} `
    }
    return contactUsers
}


function getContactUsersBasedOffRegion(region, regionNotificationSettings){
  try {
    var regionUsers = regionNotificationSettings[region]
    var contactUsers = getContactUsersString(regionUsers)
    return contactUsers
  } catch (e) {
    console.log(e)
    return ''
  }
}
