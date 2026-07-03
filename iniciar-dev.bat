@echo off
setlocal

cd /d "%~dp0"

set "BUNDLED_PNPM=C:\Users\gusta\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
set "CI=true"

where pnpm >nul 2>nul
if %errorlevel%==0 (
  pnpm --config.confirmModulesPurge=false dev
  goto :end
)

if exist "%BUNDLED_PNPM%" (
  "%BUNDLED_PNPM%" --config.confirmModulesPurge=false dev
  goto :end
)

where npm >nul 2>nul
if %errorlevel%==0 (
  npm run dev
  goto :end
)

echo.
echo Nao encontrei pnpm nem npm no PATH.
echo Instale o Node.js LTS em https://nodejs.org/ ou rode pelo Codex.
echo.
pause

:end
endlocal
