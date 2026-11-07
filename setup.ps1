$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$backendProject = Join-Path $root "backend\HotelManagementApi.csproj"
$frontendDirectory = Join-Path $root "frontend"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw ".NET SDK 8 or later is required. Install it before running setup.ps1."
}

$dotnetVersionText = (& dotnet --version).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Unable to determine the installed .NET SDK version."
}

$dotnetVersion = [version]$dotnetVersionText
if ($dotnetVersion.Major -lt 8) {
    throw ".NET SDK 8 or later is required. Found $dotnetVersionText."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or
    -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "Node.js and npm are required. Install Node.js 20.19+ or 22.12+ before running setup.ps1."
}

$nodeVersionText = (& node --version).Trim().TrimStart("v")
if ($LASTEXITCODE -ne 0) {
    throw "Unable to determine the installed Node.js version."
}

$nodeVersion = [version]$nodeVersionText
$supportedNodeVersion = ($nodeVersion.Major -eq 20 -and $nodeVersion -ge [version]"20.19") -or
    ($nodeVersion.Major -eq 22 -and $nodeVersion -ge [version]"22.12") -or
    $nodeVersion.Major -gt 22
if (-not $supportedNodeVersion) {
    throw "Vite requires Node.js 20.19+ or 22.12+. Found $nodeVersionText."
}

Write-Host "Restoring backend NuGet packages..."
& dotnet restore $backendProject
if ($LASTEXITCODE -ne 0) {
    throw "Backend dependency restore failed."
}

Write-Host "Installing the EF Core CLI tool if it is missing..."
$globalTools = & dotnet tool list --global
if ($LASTEXITCODE -ne 0) {
    throw "Unable to inspect globally installed .NET tools."
}

if (-not ($globalTools -match "(?m)^dotnet-ef\s")) {
    & dotnet tool install --global dotnet-ef --version 8.0.2
    if ($LASTEXITCODE -ne 0) {
        throw "Installing dotnet-ef failed."
    }
}
else {
    Write-Host "dotnet-ef is already installed; keeping the existing version."
}

Write-Host "Installing frontend packages from package-lock.json..."
& npm ci --prefix $frontendDirectory
if ($LASTEXITCODE -ne 0) {
    throw "Frontend dependency installation failed."
}

Write-Host "All project dependencies are installed."
