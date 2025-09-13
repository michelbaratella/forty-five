import { Octokit } from 'octokit';
import dotenv from 'dotenv';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function main() {
  // Exemplo: pegar infos do seu usuário
  const { data } = await octokit.request('GET /user');

  console.log('Usuário autenticado:', data.login);
}

main().catch(console.error);
