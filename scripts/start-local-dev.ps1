$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$backendDir = Join-Path $rootDir "backend"
$envFile = Join-Path $rootDir ".env"

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }
    if ($line -match "^\s*([^=\s]+)\s*=\s*(.*)\s*$") {
      $name = $matches[1]
      $value = $matches[2].Trim()
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

$viteOut = Join-Path $rootDir "vite-dev.log"
$viteErr = Join-Path $rootDir "vite-dev.err.log"
$backendOut = Join-Path $backendDir "backend-dev.log"
$backendErr = Join-Path $backendDir "backend-dev.err.log"

$vite = Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort") `
  -WorkingDirectory $rootDir `
  -RedirectStandardOutput $viteOut `
  -RedirectStandardError $viteErr `
  -WindowStyle Hidden `
  -PassThru

$backend = Start-Process `
  -FilePath "mvn.cmd" `
  -ArgumentList @("spring-boot:run") `
  -WorkingDirectory $backendDir `
  -RedirectStandardOutput $backendOut `
  -RedirectStandardError $backendErr `
  -WindowStyle Hidden `
  -PassThru

[PSCustomObject]@{
  frontendUrl = "http://localhost:5173"
  backendUrl = "http://localhost:18080"
  vitePid = $vite.Id
  backendPid = $backend.Id
  viteLog = $viteOut
  backendLog = $backendOut
} | ConvertTo-Json
