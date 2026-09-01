# VerdePay Demo

Protótipo visual em Expo/React Native. Todas as operações financeiras são simuladas.

## O que já está pronto

- Saldo editável tocando no saldo ou no ícone de lápis.
- Saldo persistente com AsyncStorage.
- Pull-to-refresh puxando a tela para baixo.
- Animação de atualização.
- Pix simulado com validação de saldo.
- Extrato persistente.
- Comprovante sempre marcado como SIMULAÇÃO / SEM VALOR FINANCEIRO.
- Splash de release configurada apenas com a cor verde e uma imagem transparente.
- GitHub Actions que gera um APK instalável como artifact.

## Rodar localmente

```bash
npm install
npx expo start
```

## Gerar APK pelo GitHub

1. Crie um repositório no GitHub.
2. Envie todos os arquivos deste projeto para a branch `main`.
3. Abra a aba **Actions**.
4. Escolha **Build Android APK**.
5. Clique em **Run workflow**.
6. Ao terminar, abra o job e baixe o artifact **VerdePay-Demo-APK**.

O workflow executa `expo prebuild`, compila `assembleRelease` e publica o APK como artifact.

## Sobre a tela branca/ícone mostrada no Expo Go

O Expo Go pode exibir a própria tela de carregamento/ícone durante a abertura. Isso não é a mesma tela do APK final. A build standalone usa a configuração do `expo-splash-screen` deste projeto. Android sempre possui uma janela de lançamento nativa por alguns instantes; neste projeto ela fica verde e sem imagem visível.

## Identidade

O projeto usa a marca fictícia VerdePay. Os ícones funcionais são equivalentes aos elementos genéricos da referência, via `@expo/vector-icons`.
