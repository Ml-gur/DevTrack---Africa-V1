Get-ChildItem -Path src -Filter *.tsx -Recurse | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -match "sonner@2.0.3") {
    $content -replace "sonner@2.0.3", "sonner" | Set-Content $_.FullName
    Write-Host "Fixed: $($_.Name)"
  }
}

Get-ChildItem -Path src -Filter *.ts -Recurse | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -match "sonner@2.0.3") {
    $content -replace "sonner@2.0.3", "sonner" | Set-Content $_.FullName
    Write-Host "Fixed: $($_.Name)"
  }
}
