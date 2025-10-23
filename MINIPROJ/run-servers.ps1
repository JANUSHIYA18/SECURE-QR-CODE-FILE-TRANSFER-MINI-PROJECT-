# Start backend and frontend in new PowerShell windows. Double-click to run.
$root = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\\Backend'; npm install --silent; $env:PORT='3001'; node index.js" -WindowStyle Normal -Verb RunAs
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\\Frontend'; npm install --silent; npm run dev -- --host" -WindowStyle Normal
Write-Host 'Started backend and frontend in new windows.'
