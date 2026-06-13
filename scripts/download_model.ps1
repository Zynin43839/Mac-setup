param(
    [Parameter(Mandatory=$true)]
    [string]$modelName
)

$modelFiles = @{
    'tiny' = 'ggml-tiny.bin'
    'tiny.en' = 'ggml-tiny.en.bin'
    'base' = 'ggml-base.bin'
    'base.en' = 'ggml-base.en.bin'
    'small' = 'ggml-small.bin'
    'small.en' = 'ggml-small.en.bin'
    'medium' = 'ggml-medium.bin'
    'medium.en' = 'ggml-medium.en.bin'
    'large' = 'ggml-large-v3.bin'
    'large-v3' = 'ggml-large-v3.bin'
}

$modelUrls = @{
    'tiny' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin'
    'tiny.en' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin'
    'base' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin'
    'base.en' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin'
    'small' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin'
    'small.en' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin'
    'medium' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin'
    'medium.en' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin'
    'large-v3' = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin'
}

$fileName = $modelFiles[$modelName]
$url = $modelUrls[$modelName]

if (-not $fileName -or -not $url) {
    Write-Host "ERROR: Unknown model '$modelName'" -ForegroundColor Red
    Write-Host "Available models: $($modelFiles.Keys -join ', ')"
    pause
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$destDir = Join-Path $projectDir "backend\models"
$destPath = Join-Path $destDir $fileName

if (-not (Test-Path -LiteralPath $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

if (Test-Path -LiteralPath $destPath) {
    $existing = (Get-Item -LiteralPath $destPath).Length
    if ($existing -gt 0) {
        Write-Host "Model already downloaded: $([math]::Round($existing / 1MB, 1)) MB" -ForegroundColor Green
        pause
        exit 0
    }
}

# Clean up any .tmp leftover
$tmpPath = $destPath + '.tmp'
if (Test-Path -LiteralPath $tmpPath) { Remove-Item -LiteralPath $tmpPath -Force }
if (Test-Path -LiteralPath $destPath) { Remove-Item -LiteralPath $destPath -Force }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Downloading $modelName ($fileName)" -ForegroundColor Cyan
Write-Host "  From: $url" -ForegroundColor Cyan
Write-Host "  To:   $destPath" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Use curl.exe for real progress bar (built-in on Windows 10/11)
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curl) {
        Write-Host "  Downloading..." -ForegroundColor Yellow
        & $curl.Source -L -o $tmpPath $url
        if ($LASTEXITCODE -ne 0) { throw "curl.exe failed with exit code $LASTEXITCODE" }
    } else {
        # Fallback: Invoke-WebRequest without -UseBasicParsing shows Write-Progress bar
        Write-Host "  Downloading (this may take a while)..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $tmpPath -TimeoutSec 0
    }

    if (-not (Test-Path -LiteralPath $tmpPath)) {
        throw "No file was downloaded"
    }

    $size = (Get-Item -LiteralPath $tmpPath).Length
    if ($size -eq 0) {
        Remove-Item -LiteralPath $tmpPath -Force
        throw "Downloaded file is empty"
    }

    Move-Item -LiteralPath $tmpPath -Destination $destPath -Force
    Write-Host ""
    Write-Host "SUCCESS: $modelName model ($([math]::Round($size / 1MB, 1)) MB)" -ForegroundColor Green
    Write-Host "Saved to: $destPath" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "ERROR: Download failed: $_" -ForegroundColor Red
    if (Test-Path -LiteralPath $tmpPath) { Remove-Item -LiteralPath $tmpPath -Force }
    if (Test-Path -LiteralPath $destPath) { Remove-Item -LiteralPath $destPath -Force }
    pause
    exit 1
}

Write-Host ""
Write-Host "Press any key to close this window..."
pause
