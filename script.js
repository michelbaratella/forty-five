// script-local.js
import { Octokit } from 'octokit';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Erro: você precisa definir GITHUB_TOKEN');
  process.exit(1);
}

const octokit = new Octokit({
  auth: token,
});

async function getChangedFiles({ owner, repo, pullNumber }) {
  let filesChanged = [];

  try {
    const iterator = octokit.paginate.iterator(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
      {
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100,
        headers: {
          'x-github-api-version': '2022-11-28',
        },
      }
    );

    for await (const { data } of iterator) {
      filesChanged = filesChanged.concat(data.map((f) => f.filename));
    }
  } catch (error) {
    console.error('Erro ao obter arquivos alterados:', error);
  }

  return filesChanged;
}

async function commentIfDataFilesChanged({
  owner,
  repo,
  pullNumber,
  issueNumber,
}) {
  const changedFiles = await getChangedFiles({ owner, repo, pullNumber });
  const filePathRegex = /\/data\//i;
  if (!changedFiles.some((f) => filePathRegex.test(f))) {
    console.log('Nenhum arquivo /data/ foi alterado. Nada a comentar.');
    return;
  }
  try {
    const { data: comment } = await octokit.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        owner,
        repo,
        issue_number: issueNumber,
        body: `It looks like you changed a data file. These files are auto-generated. \n\nYou must revert any changes to data files before your pull request will be reviewed.`,
        headers: {
          'x-github-api-version': '2022-11-28',
        },
      }
    );
    console.log('Comentário criado:', comment.html_url);
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
  }
}

(async () => {
  await commentIfDataFilesChanged({
    owner: process.env.owner,
    repo: process.env.repo,
    pullNumber: 1,
    issueNumber: 1,
  });
})();
