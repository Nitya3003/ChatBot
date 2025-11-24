# PowerShell script to kill process using port 5000
$port = 5000
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        $processName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
        Write-Host "Killing process $pid ($processName) using port $port"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port $port is now free!"
} else {
    Write-Host "No process found using port $port"
}

