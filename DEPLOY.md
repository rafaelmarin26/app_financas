# Deploy na Vercel — passo a passo

Tempo estimado: 10 minutos. Siga na ordem; o passo 5 é o que costuma ser
esquecido e quebra o login.

---

## Antes de começar

Tenha em mãos os três valores do seu `.env.local` (o arquivo não vai para o
GitHub, então você precisa copiá-los de lá):

| Variável | Onde encontrar |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → Data API → **Project URL** |
| `SUPABASE_ANON_KEY` | Mesma tela → **Publishable key** (ou *anon public*) |
| `SITE_URL` | Você só vai saber depois do passo 3 — volte aqui |

> **Nunca** use a *service_role* / *secret key* em nenhuma dessas variáveis.
> Ela ignora o Row Level Security e daria acesso a todos os dados de todos os
> usuários. Este projeto não precisa dela em lugar nenhum.

---

## 1. Importar o projeto

1. Acesse [vercel.com/new](https://vercel.com/new) e entre com a conta do GitHub.
2. Escolha o repositório **`rafaelmarin26/app_financas`**.
3. A Vercel detecta o preset **Next.js** sozinho. Não mude Build Command,
   Output Directory nem Install Command.

## 2. Cadastrar as variáveis de ambiente

Ainda na tela de importação, abra **Environment Variables** e adicione as três.
Marque os três ambientes (*Production*, *Preview* e *Development*) em cada uma:

```
SUPABASE_URL       = https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY  = sb_publishable_...
SITE_URL           = https://SEU-APP.vercel.app
```

Para `SITE_URL`, se você ainda não sabe o domínio, coloque qualquer valor agora
e corrija no passo 4 — só os links de confirmação de e-mail dependem dele.

> Nenhuma delas usa o prefixo `NEXT_PUBLIC_`, e isso é intencional: sem o
> prefixo o Next **não** injeta o valor no JavaScript que vai para o navegador.

## 3. Publicar

Clique em **Deploy** e espere o build. Ao final, a Vercel mostra o domínio, algo
como `app-financas-xxxx.vercel.app`. Anote.

## 4. Corrigir o `SITE_URL`

Em **Settings → Environment Variables**, ajuste `SITE_URL` para o domínio real
do passo 3. Depois vá em **Deployments**, abra o mais recente e use
**Redeploy** — variáveis de ambiente só entram em vigor em um build novo.

## 5. Liberar o domínio no Supabase ⚠️

Sem isso, o cadastro envia o e-mail mas o link de confirmação não funciona.

Em **Authentication → URL Configuration**:

- **Site URL**: `https://SEU-APP.vercel.app`
- **Redirect URLs**: adicione as duas linhas

  ```
  https://SEU-APP.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

  (a segunda mantém o desenvolvimento local funcionando)

## 6. Rodar a migração da recorrência

Em **SQL Editor**, cole e execute
[`supabase/migrations/0001_recorrencia.sql`](supabase/migrations/0001_recorrencia.sql).

A ordem não importa: o app tolera o schema antigo, mostrando um aviso e
funcionando sem recorrência até o SQL rodar. Ele reconsulta o schema a cada
minuto, então o aviso some sozinho.

---

## 7. Conferir se ficou tudo certo

Abra o domínio da Vercel e verifique:

- [ ] A landing page carrega e o botão de aparência (claro/escuro) funciona
- [ ] `/dashboard` redireciona para `/login` quando você não está logado
- [ ] O cadastro envia o e-mail e o link de confirmação leva de volta ao app
- [ ] Depois de logado, criar uma transação funciona
- [ ] O aviso amarelo de migração **não** aparece
- [ ] Criar um lançamento com "Repetir → Mensal" gera a série inteira
- [ ] O botão "Exportar CSV" baixa o arquivo

E o teste de isolamento, que é o mais importante:

- [ ] Crie uma **segunda conta** e confirme que ela **não** vê os lançamentos da
      primeira. É a Row Level Security funcionando.

---

## Como as chaves estão protegidas

| Camada | O que garante |
|---|---|
| Sem `NEXT_PUBLIC_` | O Next não embute os valores no bundle do navegador |
| `import "server-only"` em `config.ts` | Importar as credenciais de um Client Component quebra o build, em vez de vazar em silêncio |
| Nenhum client de navegador | Não existe `createBrowserClient` no projeto: só o servidor fala com o Supabase |
| `.gitignore` | `.env*` é ignorado, com exceção do `.env.local.example`, que só tem placeholders |
| Row Level Security | Mesmo que a chave vazasse, ela só enxerga as linhas do usuário autenticado |
| Cabeçalhos HTTP | HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`, definidos em `next.config.ts` |

Para conferir a qualquer momento se algum segredo escapou para o navegador:

```bash
npm run build
grep -r "SUA-CHAVE" .next/static/   # não deve retornar nada
```

### O que ainda não está feito

Não há **Content-Security-Policy**. Uma CSP que preste exige *nonce* por
requisição para os scripts inline do Next (hidratação) e para o script de tema,
o que pede plumbing no proxy. Uma CSP com `'unsafe-inline'` daria falsa sensação
de segurança, então preferi não colocar. É o próximo passo natural de
endurecimento.
