const request = require('request');
const fs = require('fs');
const options = {
  url: 'https://api.github.com/repos/marlonbernardes/awesome-berlin/stats/contributors',
  headers: {
    'User-Agent': 'request'
  }
};

request(options, (error, response, body) => {
  if (error || response.statusCode >= 400) {
    handleHttpError(error, response, body);
  }

  const contributors = JSON.parse(body);
  const filteredContributors = contributors
    .sort(additionsComparator)
    .filter(meetsMinimumContributionCriteria);

    filteredContributors.forEach(c => console.log(`[${c.author.login}] ${computeContributorAdditions(c)}`))
    const markdown = generateMarkdownTable(filteredContributors);
    replaceContributorsBlock('./README.md', markdown);
});

function handleHttpError(error, response, body) {
  throw `[${response && response.statusCode}] Error while performing http request: ${error}\n${body}`;
}

function meetsMinimumContributionCriteria(contributor, index) {
  return computeContributorAdditions(contributor) > 2;
}

function computeContributorAdditions(contributor) {
  return contributor.weeks.reduce((acc, w) => acc + w.a, 0);
}

function additionsComparator(c1, c2) {
  return computeContributorAdditions(c2) - computeContributorAdditions(c1);
}

function generateMarkdownTable(contributors) {
  const perRow = 5;
  let currentRow;
  let markdown = [];
  for (let i = 0, j = contributors.length; i < j; i += perRow) {
    currentRow = contributors.slice(i, i + perRow);
    markdown.push(currentRow.map(c => (
        ` | [<img src="${c.author.avatar_url}" width="100px" /><br /><sub>${c.author.login}</sub>](https://github.com/${c.author.login})`
    )).join(''));
  }
  return [
    markdown[0],
    '|' + range(perRow).map(() => '---').join('|') + '|',
    ...markdown.slice(1)
  ].join('\n');
}

function range(size) {
  return Array.apply(null, Array(size));
}

function replaceContributorsBlock(filePath, content) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const newContents = contents.replace(/(?:(<!-- contributors:start -->))([^]+?)(?:(<!-- contributors:end -->))/, '$1\n' + content + '\n$3');

  fs.writeFileSync(filePath, newContents);
}

