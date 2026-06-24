# run-postgres.ps1
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$binDir = Join-Path $PSScriptRoot "postgres-bin"
$dataDir = Join-Path $PSScriptRoot "postgres-data"
$zipPath = Join-Path $PSScriptRoot "postgres.zip"
$pgCtl = Join-Path $binDir "bin\pg_ctl.exe"
$initDb = Join-Path $binDir "bin\initdb.exe"
$createdb = Join-Path $binDir "bin\createdb.exe"
$psql = Join-Path $binDir "bin\psql.exe"

# 1. Download and Extract PostgreSQL binaries if not present
if (-not (Test-Path $pgCtl)) {
    Write-Host "PostgreSQL binaries not found. Downloading (approx. 310MB)..." -ForegroundColor Cyan
    $url = "https://get.enterprisedb.com/postgresql/postgresql-16.14-1-windows-x64-binaries.zip"
    
    try {
        Start-BitsTransfer -Source $url -Destination $zipPath -ErrorAction Stop
    } catch {
        Write-Host "BitsTransfer failed or not supported, falling back to System.Net.WebClient..." -ForegroundColor Yellow
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($url, $zipPath)
    }
    
    Write-Host "Extracting binaries..." -ForegroundColor Cyan
    $tempExtract = Join-Path $PSScriptRoot "temp-extract"
    New-Item -ItemType Directory -Path $tempExtract -Force | Out-Null
    Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force
    
    Move-Item -Path (Join-Path $tempExtract "pgsql") -Destination $binDir -Force
    Remove-Item -Path $tempExtract -Recurse -Force
    Remove-Item -Path $zipPath -Force
    Write-Host "PostgreSQL binaries set up successfully." -ForegroundColor Green
}

# 2. Initialize database cluster if data directory is empty/not present
if (-not (Test-Path $dataDir)) {
    Write-Host "Initializing database cluster..." -ForegroundColor Cyan
    Start-Process -FilePath $initDb -ArgumentList "-U postgres -A trust -D `"$dataDir`"" -NoNewWindow -Wait
    Write-Host "Database cluster initialized." -ForegroundColor Green
}

# 3. Start PostgreSQL Server if not already running
$statusProc = Start-Process -FilePath $pgCtl -ArgumentList "status -D `"$dataDir`"" -NoNewWindow -PassThru -Wait
if ($statusProc.ExitCode -ne 0) {
    Write-Host "Starting PostgreSQL server on port 5433..." -ForegroundColor Cyan
    Start-Process -FilePath $pgCtl -ArgumentList "start -o `"-p 5433 -h 127.0.0.1`" -D `"$dataDir`"" -NoNewWindow
    Write-Host "Waiting for PostgreSQL server to accept connections..." -ForegroundColor Cyan
    $timeout = 20
    while ($timeout -gt 0) {
        $null = & $psql -p 5433 -U postgres -d postgres -c "SELECT 1;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            break
        }
        Start-Sleep -Seconds 1
        $timeout--
    }
} else {
    Write-Host "PostgreSQL server is already running." -ForegroundColor Green
}

# 4. Set password for postgres user to 'postgres'
Write-Host "Configuring database credentials..." -ForegroundColor Cyan
& $psql -p 5433 -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# 5. Create 'shopify_clone' database if it doesn't exist
$dbExists = (& $psql -p 5433 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='shopify_clone'") -eq "1"

if (-not $dbExists) {
    Write-Host "Creating database 'shopify_clone'..." -ForegroundColor Cyan
    & $createdb -p 5433 -U postgres shopify_clone
    Write-Host "Database 'shopify_clone' created." -ForegroundColor Green
} else {
    Write-Host "Database 'shopify_clone' already exists." -ForegroundColor Green
}

Write-Host "PostgreSQL is ready!" -ForegroundColor Green
