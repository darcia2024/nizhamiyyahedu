# Deploy production ke project Vercel nizhamiyyahedu-web, ditayangkan di https://belajarditimurtengah.com (alamat utama).
# nizhamiyyahedu.vercel.app tetap hidup lewat rewrite di vercel.json root repo (branch main).
# Jalankan dari folder web:  .\scripts\deploy.ps1
# Rahasia (Supabase, Google, Mayar, AUTH_SECRET) disimpan di project Vercel lewat .\scripts\setup-production.ps1.
# Saat build, Vercel menjalankan migrasi database dan mengisi data awal kelas (npm run vercel-build).
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$base = 'https://belajarditimurtengah.com'
# Tanpa NEXT_PUBLIC_BASE_PATH: aplikasi tayang di akar domain, bukan di /web.
$public = @(
  "APP_URL=$base",
  "AUTH_URL=$base/api/auth",
  'ALLOWED_ORIGINS=belajarditimurtengah.com,nizhamiyyahedu.vercel.app'
)

$deployArgs = @('vercel', 'deploy', '--prod', '--yes')
foreach ($kv in $public) { $deployArgs += @('--build-env', $kv, '--env', $kv) }
& npx @deployArgs
