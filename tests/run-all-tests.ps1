[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
cmd.exe /c "chcp 65001 >nul 2>&1"

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$robot = $env:ROBOT_EXECUTABLE
if (-not $robot) {
    $robot = Join-Path $repoRoot '.venv-tests\Scripts\robot.exe'
}
if (-not (Test-Path -LiteralPath $robot)) {
    $installedRobot = Get-Command robot -ErrorAction SilentlyContinue
    if ($installedRobot) {
        $robot = $installedRobot.Source
    }
}
if (-not (Test-Path -LiteralPath $robot)) {
    throw 'Robot Framework is not installed. Follow section 6 in HUONG_DAN_CHAY.md first or set ROBOT_EXECUTABLE.'
}

if (-not $env:FRONTEND_BASE_URL) {
    $env:FRONTEND_BASE_URL = 'http://localhost:5173'
}
if (-not $env:API_BASE_URL) {
    $env:API_BASE_URL = 'http://localhost:5262'
}

$results = Join-Path $PSScriptRoot 'robot-results'
$screenshots = Join-Path $results 'screenshots'
New-Item -ItemType Directory -Path $results -Force | Out-Null
New-Item -ItemType Directory -Path $screenshots -Force | Out-Null
Push-Location $repoRoot
try {
    Write-Host "Kiểm tra kết nối Frontend và Backend API..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "$($env:FRONTEND_BASE_URL.TrimEnd('/'))/login" -TimeoutSec 10 | Out-Null
    Invoke-WebRequest -Uri "$($env:API_BASE_URL.TrimEnd('/'))/swagger/v1/swagger.json" -TimeoutSec 10 | Out-Null

    Write-Host "Bắt đầu chạy 74 kịch bản kiểm thử tự động UI & API..." -ForegroundColor Green
    & $robot --outputdir $results .\tests\ui-smoke.robot
    $robotExit = $LASTEXITCODE

    Write-Host "Chạy API Smoke Tests..." -ForegroundColor Green
    node --test .\tests\api-smoke.test.mjs 2>&1 |
        Tee-Object -FilePath (Join-Path $results 'api-smoke.tap')
    $apiExit = $LASTEXITCODE

    # Tự động đọc output.xml và điền kết quả Tiếng Việt vào file test-case-expl.xlsx
    Write-Host "Tự động điền kết quả kiểm thử Tiếng Việt vào file test-case-expl.xlsx..." -ForegroundColor Yellow
    python (Join-Path $PSScriptRoot 'update_excel_results.py')

    if ($robotExit -ne 0 -or $apiExit -ne 0) {
        exit 1
    }
}
finally {
    Pop-Location
}
