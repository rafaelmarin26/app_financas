@echo off
chcp 65001 >nul
title Saldo - Financas Pessoais
cd /d "%~dp0"

echo.
echo  ===============================================
echo   Saldo - Financas Pessoais
echo  ===============================================
echo.

if not exist node_modules (
  echo  Primeira execucao: instalando dependencias...
  echo  Isso pode levar alguns minutos.
  echo.
  call npm install
  echo.
)

if not exist .env.local (
  echo  ATENCAO: o arquivo .env.local nao foi encontrado.
  echo  Sem ele o app sobe, mas o login nao funciona.
  echo  Copie .env.local.example para .env.local e preencha as chaves do Supabase.
  echo.
)

echo  O app vai abrir no navegador em http://localhost:3000
echo.
echo  DEIXE ESTA JANELA ABERTA enquanto estiver usando o app.
echo  Para parar: feche a janela ou pressione Ctrl+C.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 8; Start-Process 'http://localhost:3000'"

call npm run dev

echo.
echo  O servidor foi encerrado.
pause
