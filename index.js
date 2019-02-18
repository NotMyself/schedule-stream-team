const phantom = require('phantom');
const cheerio = require('cheerio');
const chalk = require('chalk');
const util = require('util');

const teamPageUrl = 'https://www.twitch.tv/team/livecoders';

let instance, page;

function checkReadyState() {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      page.evaluate(function() {
        return document.readyState;
      })
      .then(readyState => {
        if(readyState === 'complete') {
          clearInterval(interval);
          page.evaluate(function() {
            return document.documentElement.outerHTML;
          })
          .then(resolve)
          .catch(reject);
        }
      });
    }, 500);
  });
}

phantom.create()
  .then(i => {
    instance = i;
    return instance.createPage();
  })
  .then(p => {
    page = p;
    page.on('onResourceRequested', req => {
      console.log(`Requested: ${chalk.green(req.url)}`);
    });
    page.on('error', err => {
      console.log(`Error: ${chalk.red(err.message)}`);
    });
    return page.open(teamPageUrl);
  })
  .then(checkReadyState)
  .then(parseTeamMembers)
  .then(events => {
    console.log(util.inspect(events, { depth: null }));
    page.close();
    instance.exit();
    process.exit(0);
  })
  .catch(err => {
    console.log(util.inspect(err, { depth: null }));
    page.close();
    instance.exit();
    process.exit(1);
  });

function parseTeamMembers(page) {
  const $ = cheerio.load(page);
  return $('div.member-list__scrollable-container')
    .html();
}
