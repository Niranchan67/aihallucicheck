@echo off
title Pushing AI HalluciCheck to GitHub...
cd /d "%~dp0"
echo =======================================================
echo Pushing HalluciCheck to:
echo https://github.com/Niranchan67/aihallucicheck.git
echo =======================================================
echo.

"%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe" remote remove origin 2>nul
"%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe" remote add origin https://github.com/Niranchan67/aihallucicheck.git
"%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe" branch -M main

echo Pushing code to main branch...
"%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe" push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Your repository is live on GitHub!
) else (
    echo [NOTE] If a browser window opened, please click 'Authorize' to finish sign-in.
)
echo.
pause
