# 🔐 NTC Wallet - Deploy Seguro no Netlify

## ✨ O que mudou?

Anteriormente, o **GitHub Token era armazenado no `localStorage`**, o que era inseguro. Agora, usamos **Netlify Serverless Functions** para manter as credenciais seguras em variáveis de ambiente do servidor.

### ❌ ANTES (Inseguro)
```javascript
// Token exposto no navegador
const token = localStorage.getItem('ntc_gh_token');
const res = await fetch('https://api.github.com/repos/...', {
  headers: { "Authorization": `token ${token}` }
});
```

### ✅ AGORA (Seguro)
```javascript
// Frontend apenas faz requisição para a função serverless
const res = await fetch('/.netlify/functions/github-sync', {
  method: 'POST',
  body: JSON.stringify({ action: 'push', payload: data })
});

// A função serverless tem acesso ao token via GITHUB_TOKEN (env var)
// Token NUNCA é exposto no navegador! 🔒
```

---

## 🚀 Instruções de Deploy

### **1. Conecte seu repositório ao Netlify**

a) Vá para [netlify.com](https://netlify.com) e faça login
b) Clique em **"New site from Git"**
c) Selecione seu provedor Git (GitHub, GitLab, Bitbucket)
d) Escolha o repositório `NTC-wallet`
e) Clique em **"Deploy site"**

### **2. Configure as variáveis de ambiente**

a) Vá em **Site settings** → **Build & deploy** → **Environment**
b) Clique em **"Edit variables"** ou **"Add a variable"**
c) Adicione as seguintes variáveis:

| Variável | Valor | Exemplo |
|----------|-------|---------|
| `GITHUB_TOKEN` | Seu Personal Access Token | `ghp_xxxxxxxxxxxx...` |
| `GITHUB_OWNER` | Seu username no GitHub | `aceleradox` |
| `GITHUB_REPO` | Nome do repositório | `NTC-wallet` |
| `GITHUB_PATH` | Caminho do arquivo de dados | `database.json` |

### **3. Gere seu GitHub Personal Access Token (PAT)**

a) Vá para [github.com/settings/tokens](https://github.com/settings/tokens)
b) Clique em **"Generate new token"** → **"Generate new token (classic)"**
c) Dê um nome descritivo (ex: "NTC Wallet Netlify")
d) **Marque apenas estas permissões:**
   - ✅ `repo` (acesso completo a repositórios privados)
   - ✅ `contents:write` (permissão para escrever em conteúdos)
e) Clique em **"Generate token"**
f) **Copie e guarde o token** (aparece só uma vez!)

### **4. Adicione o token no Netlify**

a) Copie o token gerado no passo anterior
b) Volte ao Netlify e cole no campo `GITHUB_TOKEN`
c) Clique em **"Create variable"** ou **"Save"**

### **5. Deploy automático**

Quando você fazer um `git push` para a branch padrão:
1. Netlify detec ta a mudança automaticamente
2. Faz o build (neste caso, apenas copia os arquivos)
3. Deploy fica online em segundos
4. As Serverless Functions já estão prontas para usar!

---

## 📂 Estrutura de arquivos

```
NTC wallet html/
├── index (4).html           ← Aplicação principal (sem tokens expostos)
├── netlify.toml            ← Configuração do Netlify
├── netlify/
│   └── functions/
│       └── github-sync.js   ← Função serverless (acesso ao token via env vars)
└── database.json           ← Gerado automaticamente após primeiro push
```

---

## 🔧 Como funciona a sincronização?

### **PUSH (Escrita no GitHub)**
```
User interacts (transfer, spin, etc)
     ↓
IndexedDB é atualizado localmente
     ↓
pushToGitHub() é chamada
     ↓
Requisição POST para /.netlify/functions/github-sync
     ↓
Função serverless lê GITHUB_TOKEN (env var - seguro!)
     ↓
Faz PUT no GitHub API para atualizar database.json
     ↓
Todo synced! ✨
```

### **PULL (Leitura do GitHub)**
```
App carrega
     ↓
pullFromGitHub() tenta buscar ./database.json
     ↓
Se encontrar, carrega dados globais no IndexedDB
     ↓
Sincroniza automaticamente entre usuários! 🔄
```

---

## 🛡️ Segurança

✅ **Token protegido em variáveis de ambiente** (servidor Netlify)
✅ **Nunca exposto no localStorage ou DevTools**
✅ **Requisições HTTPS entre frontend e serverless**
✅ **Variáveis de ambiente não aparecem em logs públicos**
✅ **Token pode ser rotacionado a qualquer hora**

---

## ⚠️ Troubleshooting

### **"Erro ao sincronizar. Verifique as variáveis de ambiente"**

1. Verifique se todas as 4 variáveis foram adicionadas no Netlify
2. Certifique-se que o token é válido (gerado recentemente)
3. Confirme que o token tem permissão `contents:write`
4. Verifique o console do navegador (F12) para mais detalhes

### **"Arquivo não encontrado no repositório"**

Isso é normal na primeira sincronização! 
- O arquivo `database.json` é criado automaticamente após o primeiro push bem-sucedido
- Continue usando o app e faça uma transação (ex: spin na roleta)
- O arquivo será criado no repositório

### **Token expirou ou foi revogado**

1. Gere um novo token no [github.com/settings/tokens](https://github.com/settings/tokens)
2. Atualize a variável `GITHUB_TOKEN` no Netlify
3. Tudo voltará a funcionar!

---

## 📝 Notas importantes

- ⚡ As Netlify Functions têm **limite de invocações grátis** (125k/mês)
- 🔄 Cada transação faz um push = 1 invocação
- 💾 Os dados continuam salvos no **IndexedDB local** mesmo se o GitHub falhar
- 🌍 O site funciona offline com dados locais
- 🔗 Sincronização com GitHub é **bonus**, não obrigatória

---

## 🎉 Pronto!

Sua aplicação NTC Wallet agora está **100% segura** com credenciais protegidas no servidor Netlify. Aproveite! 🚀
