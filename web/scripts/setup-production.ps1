# Isi rahasia production (Supabase, Google, Mayar) ke project Vercel nizhamiyyahedu-web.
# Jalankan SENDIRI dari folder web:  .\scripts\setup-production.ps1
# Nilai yang kamu ketik tidak tampil di layar dan langsung dikirim ke Vercel (environment Production).
# Kosongkan isian (langsung Enter) untuk melewati / mempertahankan nilai yang sudah ada.
# Isi ulang sebagian saja:  .\scripts\setup-production.ps1 -Only DIRECT_URL,AUTH_GOOGLE_ID,AUTH_GOOGLE_SECRET
# Cukup tempel DIRECT_URL, DATABASE_URL dibuat otomatis:  .\scripts\setup-production.ps1 -FromDirect
param([string[]]$Only, [switch]$FromDirect)
# 'Continue': di Windows PowerShell 5.1, stderr dari npx yang dialihkan bisa dianggap error fatal.
# Kegagalan diperiksa lewat $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path -Parent $PSScriptRoot)

if ($FromDirect -and -not $Only) { $Only = @('-') }  # -FromDirect saja: lewati semua pertanyaan lain
function Want([string]$name) { return (-not $Only) -or ($Only -contains $name) }

function Read-Secret([string]$label) {
  $s = Read-Host -AsSecureString $label
  $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

function Set-VercelEnv([string]$name, [string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { Write-Host "  - $name dilewati" -ForegroundColor DarkGray; return }
  # Hapus nilai lama (bila ada) lalu tambahkan yang baru.
  & npx vercel env rm $name production --yes *> $null
  $out = $value.Trim() | & npx vercel env add $name production 2>&1
  if ($LASTEXITCODE -ne 0) {
    # Keluaran Vercel tidak memuat nilai rahasia, jadi aman ditampilkan untuk mencari penyebabnya.
    $out | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkYellow }
    throw "Gagal menyimpan $name ke Vercel."
  }
  Write-Host "  + $name tersimpan" -ForegroundColor Green
}

function New-RandomSecret {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes)
}

$existing = (& npx vercel env ls production 2>$null) -join "`n"

Write-Host "`n== Supabase: Project Settings > Database > Connection string ==" -ForegroundColor Cyan
function Add-PoolerParams([string]$u) {
  if ($u -and $u -match ':6543/' -and $u -notmatch 'pgbouncer=true') {
    # Prisma lewat pooler transaksi Supabase wajib pgbouncer=true dan satu koneksi per fungsi.
    $u += ($(if ($u.Contains('?')) { '&' } else { '?' }) + 'pgbouncer=true&connection_limit=1')
  }
  return $u
}

if ($FromDirect) {
  # Satu tempelan saja: DATABASE_URL dibuat dari DIRECT_URL (user, password, dan host sama; port 5432 jadi 6543).
  $direct = (Read-Secret 'DIRECT_URL (Session pooler, port 5432)').Trim()
  if ($direct -notmatch ':5432/') { throw 'DIRECT_URL harus memakai port 5432 (Session pooler).' }
  Set-VercelEnv 'DIRECT_URL' $direct
  Set-VercelEnv 'DATABASE_URL' (Add-PoolerParams ($direct -replace '\?.*$','' -replace ':5432/', ':6543/'))
} else {
  if (Want 'DATABASE_URL') { Set-VercelEnv 'DATABASE_URL' (Add-PoolerParams (Read-Secret 'DATABASE_URL (Transaction pooler, port 6543)')) }
  if (Want 'DIRECT_URL') { Set-VercelEnv 'DIRECT_URL' (Read-Secret 'DIRECT_URL (Session pooler / direct, port 5432)') }
}

Write-Host "`n== Supabase: Project Settings > API ==" -ForegroundColor Cyan
if (Want 'SUPABASE_URL') { Set-VercelEnv 'SUPABASE_URL' (Read-Host 'Project URL (https://xxxx.supabase.co)') }
if (Want 'SUPABASE_SERVICE_ROLE_KEY') { Set-VercelEnv 'SUPABASE_SERVICE_ROLE_KEY' (Read-Secret 'service_role key (untuk simpan foto unggahan)') }

Write-Host "`n== Google Cloud: OAuth client (Web application) ==" -ForegroundColor Cyan
Write-Host "   Authorized redirect URI: https://nizhamiyyahedu.vercel.app/api/auth/callback/google" -ForegroundColor DarkGray
if (Want 'AUTH_GOOGLE_ID') { Set-VercelEnv 'AUTH_GOOGLE_ID' (Read-Host 'Client ID') }
if (Want 'AUTH_GOOGLE_SECRET') { Set-VercelEnv 'AUTH_GOOGLE_SECRET' (Read-Secret 'Client secret') }

Write-Host "`n== Superadmin ==" -ForegroundColor Cyan
if (Want 'ADMIN_EMAILS') { Set-VercelEnv 'ADMIN_EMAILS' (Read-Host 'Email Google superadmin (pisahkan koma bila lebih dari satu)') }

Write-Host "`n== Mayar (boleh dilewati dulu) ==" -ForegroundColor Cyan
if (Want 'MAYAR_API_KEY') { Set-VercelEnv 'MAYAR_API_KEY' (Read-Secret 'API key Mayar') }
if (Want 'MAYAR_WEBHOOK_TOKEN') { Set-VercelEnv 'MAYAR_WEBHOOK_TOKEN' (Read-Secret 'Webhook token Mayar') }

Write-Host "`n== Rahasia internal ==" -ForegroundColor Cyan
foreach ($name in 'AUTH_SECRET', 'CRON_SECRET') {
  # Dibuat acak sekali saja; mengganti AUTH_SECRET membuat semua user harus login ulang.
  if ($existing -match "(?m)^\s*$name\s") { Write-Host "  = $name sudah ada" -ForegroundColor DarkGray }
  else { Set-VercelEnv $name (New-RandomSecret) }
}

Write-Host "`nSelesai. Lanjut deploy: .\scripts\deploy.ps1" -ForegroundColor Green
