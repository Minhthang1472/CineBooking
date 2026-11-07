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
$results = Join-Path $PSScriptRoot 'robot-results'

if (-not (Test-Path -LiteralPath $robot)) {
    throw 'Robot Framework is not installed. Follow section 6 in HUONG_DAN_CHAY.md first or set ROBOT_EXECUTABLE.'
}

if (-not $env:FRONTEND_BASE_URL) {
    $env:FRONTEND_BASE_URL = 'http://localhost:5173'
}
if (-not $env:API_BASE_URL) {
    $env:API_BASE_URL = 'http://localhost:5262'
}

New-Item -ItemType Directory -Path $results -Force | Out-Null
Push-Location $repoRoot
try {
    Invoke-WebRequest -Uri "$($env:FRONTEND_BASE_URL.TrimEnd('/'))/login" -TimeoutSec 10 | Out-Null
    Invoke-WebRequest -Uri "$($env:API_BASE_URL.TrimEnd('/'))/swagger/v1/swagger.json" -TimeoutSec 10 | Out-Null

    & $robot --outputdir $results .\tests\ui-smoke.robot
    $robotExit = $LASTEXITCODE

    node --test .\tests\api-smoke.test.mjs 2>&1 |
        Tee-Object -FilePath (Join-Path $results 'api-smoke.tap')
    $apiExit = $LASTEXITCODE

    if ($robotExit -ne 0 -or $apiExit -ne 0) {
        exit 1
    }
}
finally {
    Pop-Location
}
