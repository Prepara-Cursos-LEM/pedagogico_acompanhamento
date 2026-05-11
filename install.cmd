@echo off
setlocal enabledelayedexpansion
title Instalacao Node.js e Tarefa Agendada

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo [1/4] Instalando o NodeJS...
winget install OpenJS.NodeJS.LTS
pause

echo [1/4] Instalando as dependências do NPM...
npm install
pause

echo [2/4] Registrando tarefa agendada...
schtasks /Create /TN "serverstart" /XML "%~dp0serverstart.xml" /F

if %errorlevel% neq 0 (
    echo.
    echo Falha ao importar XML.
    echo Verifique se:
    echo - O arquivo serverstart.xml esta na mesma pasta
    echo - O usuario possui permissoes administrativas
    pause
    exit /b 1
)

echo.
echo [3/4] Tudo configurado com sucesso.
echo A tarefa sera executada automaticamente no proximo boot.

echo.
echo [4/4] Pressione qualquer tecla para reiniciar o sistema em 15 segundos...
pause >nul

shutdown /r /t 15 /c "Reinicializacao necessaria para iniciar o servidor automaticamente."