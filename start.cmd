@echo off
rem BudgetLLM GPUs — запуск на Windows двойным щелчком.
rem Нужен только Python 3 (python.org, галочка "Add python.exe to PATH").
setlocal
cd /d "%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY (
  where python >nul 2>nul && set "PY=python"
)

if not defined PY (
  echo.
  echo Python 3 не найден.
  echo.
  echo Вариант 1. Установите Python 3 с python.org (галочка "Add python.exe to PATH")
  echo            и запустите этот файл снова.
  echo.
  echo Вариант 2. Просто откройте index.html двойным щелчком - база работает
  echo            офлайн, без сервера и без установки чего-либо.
  echo.
  pause
  exit /b 1
)

%PY% serve.py --open %*
pause
