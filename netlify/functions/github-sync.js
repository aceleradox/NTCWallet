/**
 * NETLIFY FUNCTION: github-sync.js
 * ================================
 * Sincroniza dados do banco de dados NTC com repositório GitHub
 * SEGURO: O token é armazenado em variáveis de ambiente (não exposto no frontend)
 */

exports.handler = async (event) => {
  // Permite apenas POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Parse do corpo da requisição
    const { payload, action } = JSON.parse(event.body);

    // Lê o token das variáveis de ambiente (NUNCA do client-side)
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER || 'aceleradox';
    const githubRepo = process.env.GITHUB_REPO || 'NTC-wallet';
    const githubPath = process.env.GITHUB_PATH || 'database.json';

    if (!githubToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Token do GitHub não configurado nas variáveis de ambiente'
        })
      };
    }

    if (action === 'push') {
      return await handlePush(payload, githubToken, githubOwner, githubRepo, githubPath);
    } else if (action === 'pull') {
      return await handlePull(githubOwner, githubRepo, githubPath);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ação inválida (use "push" ou "pull")' })
      };
    }

  } catch (error) {
    console.error('Erro na função github-sync:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Falha ao sincronizar com GitHub',
        details: error.message
      })
    };
  }
};

/**
 * PUSH: Faz upload dos dados para o GitHub
 */
async function handlePush(payload, token, owner, repo, path) {
  try {
    const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    let sha = '';

    // 1. Tenta buscar o SHA do arquivo existente
    const getRes = await fetch(getFileUrl, {
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Codifica o payload em base64
    const content = Buffer.from(
      JSON.stringify(payload, null, 2)
    ).toString('base64');

    // 3. Prepara o corpo da requisição
    const putBody = {
      message: `NTC Ledger Auto-Sync Update [${new Date().toLocaleTimeString()}]`,
      content: content
    };

    if (sha) {
      putBody.sha = sha;
    }

    // 4. Faz o PUT para atualizar/criar o arquivo
    const putRes = await fetch(getFileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const error = await putRes.json();
      throw new Error(`GitHub API Error: ${error.message}`);
    }

    const result = await putRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Banco de dados sincronizado com GitHub',
        commit: result.commit?.message || 'Sincronizado'
      })
    };

  } catch (error) {
    console.error('Erro ao fazer push:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Falha ao sincronizar push com GitHub',
        details: error.message
      })
    };
  }
}

/**
 * PULL: Busca os dados do GitHub (opcional, pode ser feito direto do repositório público)
 */
async function handlePull(owner, repo, path) {
  try {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;

    const res = await fetch(rawUrl);

    if (!res.ok) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Arquivo não encontrado no repositório' })
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: data
      })
    };

  } catch (error) {
    console.error('Erro ao fazer pull:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Falha ao sincronizar pull com GitHub',
        details: error.message
      })
    };
  }
}
