# Copies Reveal.js and Monaco Editor into vendor/ (run from project root).
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

npm install reveal.js@5.2.1 monaco-editor@0.52.2 --no-save

New-Item -ItemType Directory -Force -Path vendor\reveal, vendor\monaco | Out-Null
Copy-Item -Recurse -Force node_modules\reveal.js\dist\* vendor\reveal\
Copy-Item -Recurse -Force node_modules\monaco-editor\min vendor\monaco\

Write-Host "Vendor libraries installed to vendor/reveal and vendor/monaco"
