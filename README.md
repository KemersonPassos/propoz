# 📋 Propoz

**Propoz** é um aplicativo mobile para criação e gerenciamento de propostas comerciais de forma rápida, profissional e organizada.

## ✨ Funcionalidades

- 🔐 Autenticação de usuários (login/cadastro)
- 📝 Criação e edição de propostas comerciais
- 🗂️ Gerenciamento de serviços e categorias
- 📊 Acompanhamento de status das propostas (pendente, aprovada, recusada)
- 📁 Arquivamento de propostas
- 🎉 Animações de celebração ao aprovar propostas
- 👤 Perfil do usuário com personalização
- 📱 Interface moderna e responsiva

## 🛠️ Tecnologias

- **Framework:** [Expo](https://expo.dev/) (SDK 54)
- **Linguagem:** TypeScript
- **Navegação:** Expo Router + React Navigation
- **Backend:** [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **UI:** React Native com componentes customizados
- **Animações:** React Native Reanimated
- **Gestos:** React Native Gesture Handler

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) (no dispositivo móvel)

## 🚀 Como rodar

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/propoz-app.git
   cd propoz-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npx expo start
   ```

5. **Abra no dispositivo:**
   - Escaneie o QR code com o app **Expo Go** (Android) ou a câmera (iOS)

## 📁 Estrutura do Projeto

```
propoz-app/
├── app/                    # Telas e rotas (Expo Router)
│   ├── (tabs)/             # Navegação por abas
│   ├── edit-proposal/      # Edição de propostas
│   ├── edit-service/       # Edição de serviços
│   ├── onboarding/         # Fluxo de onboarding
│   ├── proposal/           # Detalhes da proposta
│   ├── public/             # Telas públicas
│   ├── home.tsx            # Tela principal
│   ├── index.tsx           # Tela de login
│   ├── new-proposal.tsx    # Nova proposta
│   ├── new-service.tsx     # Novo serviço
│   ├── services.tsx        # Lista de serviços
│   ├── proposals.tsx       # Lista de propostas
│   ├── profile.tsx         # Perfil do usuário
│   └── upgrade.tsx         # Tela de upgrade
├── assets/                 # Imagens e recursos estáticos
├── components/             # Componentes reutilizáveis
├── constants/              # Constantes e temas
├── hooks/                  # Custom hooks
├── lib/                    # Configurações (Supabase, etc.)
├── scripts/                # Scripts utilitários
├── app.json                # Configuração do Expo
├── package.json            # Dependências do projeto
└── tsconfig.json           # Configuração do TypeScript
```

## 📄 Licença

Este projeto é privado e de uso restrito.

---

Feito com 💙 por **Propoz**
