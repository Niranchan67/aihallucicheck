param(
    [Parameter(Mandatory=$true, HelpMessage="Enter your GitHub Repository URL (e.g., https://github.com/username/hallucicheck.git)")]
    [string]$RepoUrl
)

$git = "$env:LOCALAPPDATA\Programs\MinGit\cmd\git.exe"
if (!(Test-Path $git)) {
    $git = "git"
}

Write-Host "Setting up remote origin: $RepoUrl..." -ForegroundColor Cyan
& $git remote remove origin 2> $null
& $git remote add origin $RepoUrl
& $git branch -M main

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
& $git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "
SUCCESS! Your project is published to GitHub!" -ForegroundColor Green
    Write-Host "Next, go to your repository on GitHub:" -ForegroundColor White
    Write-Host "1. Click Settings -> Pages" -ForegroundColor White
    Write-Host "2. Under 'Source', select 'GitHub Actions'" -ForegroundColor White
    Write-Host "3. Your site will automatically go live on https://<username>.github.io/<repo-name>/" -ForegroundColor Green
} else {
    Write-Host "
Push failed. Please check your GitHub repository URL and ensure you are logged in." -ForegroundColor Red
}
