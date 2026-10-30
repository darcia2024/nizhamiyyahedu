# Deploy aplikasi demo ke project Vercel nizhamiyyahedu-web, yang ditayangkan di
# https://nizhamiyyahedu.vercel.app/web lewat rewrite di vercel.json root repo.
# Jalankan dari folder web:  .\scripts\deploy-demo.ps1
# Butuh: npx vercel sudah login dan folder ini sudah di-link (vercel link --project nizhamiyyahedu-web).
# AUTH_SECRET dibuat acak tiap deploy, jadi user demo perlu login ulang setelah deploy.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
$base = 'https://nizhamiyyahedu.vercel.app/web'

$deployArgs = @(
  'vercel', 'deploy', '--prod', '--yes',
  '--build-env', 'NEXT_PUBLIC_BASE_PATH=/web',
  '--build-env', 'DEMO_MODE=1',
  '--build-env', 'DATABASE_URL=file:./demo.db',
  '--build-env', "APP_URL=$base",
  '--build-env', 'ALLOWED_ORIGINS=nizhamiyyahedu.vercel.app',
  '--env', 'NEXT_PUBLIC_BASE_PATH=/web',
  '--env', 'DEMO_MODE=1',
  '--env', 'DATABASE_URL=file:/tmp/nizhamiyyah-demo.db',
  '--env', "APP_URL=$base",
  '--env', "AUTH_URL=$base/api/auth",
  '--env', "AUTH_SECRET=$secret",
  '--env', 'ALLOWED_ORIGINS=nizhamiyyahedu.vercel.app'
)
& npx @deployArgs
