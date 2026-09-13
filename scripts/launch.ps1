$ErrorActionPreference = 'Stop'
$oneMoreRoot = Split-Path -Parent $PSScriptRoot
$oneMoreNode = (Get-Command node -ErrorAction Stop).Source
$oneMoreAddress = 'http://127.0.0.1:8888/'
$oneMoreRunning = $false
try {
    $oneMoreResponse = Invoke-WebRequest -Uri $oneMoreAddress -UseBasicParsing -TimeoutSec 2
    if ($oneMoreResponse.Content -match '<title>One More') { $oneMoreRunning = $true }
    else { throw 'Port 8888 is serving a different application.' }
} catch {
    if ($_.Exception.Message -like '*different application*') { throw }
}
if (-not $oneMoreRunning) {
    Push-Location -LiteralPath $oneMoreRoot
    try {
        & $oneMoreNode 'scripts/build.mjs'
        if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
        Start-Process -FilePath $oneMoreNode -ArgumentList @('scripts/serve.mjs', '8888', 'dist', '127.0.0.1') -WorkingDirectory $oneMoreRoot -WindowStyle Hidden
    } finally { Pop-Location }
    for ($oneMoreAttempt = 0; $oneMoreAttempt -lt 30; $oneMoreAttempt++) {
        try { $oneMoreResponse = Invoke-WebRequest -Uri $oneMoreAddress -UseBasicParsing -TimeoutSec 1; if ($oneMoreResponse.Content -match '<title>One More') { $oneMoreRunning = $true; break } } catch {}
        Start-Sleep -Milliseconds 150
    }
    if (-not $oneMoreRunning) { throw 'The local game server could not start.' }
}
if ($env:ONE_MORE_NO_BROWSER -ne '1') { Start-Process $oneMoreAddress }
