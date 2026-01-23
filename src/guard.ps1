# WFSL Repo Guard — ABSOLUTE HARDENED
# PowerShell-safe, schema-agnostic, zero-assumption enforcement

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
    Write-Error $Message
    exit 10
}

function Is-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p  = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (Is-Admin) {
    Fail "WFSL Repo Guard must not run in an admin shell"
}

function Resolve-GitRoot {
    try {
        $r = (& git rev-parse --show-toplevel 2>$null).Trim()
        if ($r) { return $r }
    } catch {}
    return $null
}

$gitRoot = Resolve-GitRoot
if (-not $gitRoot) {
    Fail "Not inside a git repository"
}

$manifest = Join-Path $gitRoot 'proofgate.manifest.json'
if (-not (Test-Path $manifest)) {
    Fail "Missing proofgate.manifest.json at repo root"
}

$proofGate = $env:WFSL_PROOFGATE_ENTRY
if (-not $proofGate -or -not (Test-Path $proofGate)) {
    Fail "WFSL_PROOFGATE_ENTRY is not set or invalid"
}

function Invoke-ProofGate {
    param([string]$Mode)

    $args = @(
        '"' + $proofGate + '"'
        $Mode
        '--manifest'
        '"' + $manifest + '"'
        '--json'
    ) -join ' '

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'node'
    $psi.Arguments = $args
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $psi.UseShellExecute = $false

    $p = [System.Diagnostics.Process]::Start($psi)
    $stdout = $p.StandardOutput.ReadToEnd().Trim()
    $stderr = $p.StandardError.ReadToEnd().Trim()
    $p.WaitForExit()

    if ($p.ExitCode -ne 0) {
        if ($stderr) { Write-Error $stderr }
        exit $p.ExitCode
    }

    if (-not $stdout.StartsWith('{')) {
        Fail "ProofGate returned non-JSON output. Refusing to parse."
    }

    return ($stdout | ConvertFrom-Json)
}

$raw = Invoke-ProofGate -Mode 'status'

# -------- SAFE PROPERTY RESOLUTION --------
# Never touch $obj.prop unless the property EXISTS

$props = @{}
foreach ($p in $raw.PSObject.Properties) {
    $props[$p.Name] = $p.Value
}

if ($props.ContainsKey('repoGuard')) {
    $verdict = $props['repoGuard']
}
elseif ($props.ContainsKey('repoState')) {
    $verdict = $raw
}
elseif ($props.ContainsKey('ok') -and $props.ContainsKey('repoGuard')) {
    $verdict = $props['repoGuard']
}
else {
    Fail "Unrecognised ProofGate JSON schema. Enforcement aborted."
}

# Resolve verdict safely
$verdictProps = @{}
foreach ($p in $verdict.PSObject.Properties) {
    $verdictProps[$p.Name] = $p.Value
}

if (-not $verdictProps.ContainsKey('repoState')) {
    Fail "repoState missing from ProofGate verdict"
}

if ($verdictProps['repoState'] -ne 'VALID') {
    Fail "Repo Guard verdict INVALID. Operation blocked."
}

$verdict | ConvertTo-Json -Depth 6
exit 0
