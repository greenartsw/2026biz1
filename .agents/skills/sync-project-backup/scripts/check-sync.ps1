param(
  [string]$Repository,
  [switch]$SkipFetch
)

$ErrorActionPreference = 'Stop'
$expectedRemote = 'https://github.com/greenartsw/2026biz1.git'
if ([string]::IsNullOrWhiteSpace($Repository)) {
  $Repository = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..\..')).Path
} else {
  $Repository = (Resolve-Path -LiteralPath $Repository).Path
}
$repositoryPath = $Repository

try {
  $inside = (& git -c "safe.directory=$repositoryPath" -C $repositoryPath rev-parse --is-inside-work-tree 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) { throw $inside }
  if ($inside -ne 'true') { throw 'The selected path is not a Git working tree.' }

  $remote = (& git -c "safe.directory=$repositoryPath" -C $repositoryPath remote get-url origin 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) { throw $remote }
  if ($remote.TrimEnd('/') -ne $expectedRemote.TrimEnd('/')) {
    throw "Unexpected origin: $remote"
  }

  if (-not $SkipFetch) {
    & git -c "safe.directory=$repositoryPath" -C $repositoryPath fetch origin --prune
    if ($LASTEXITCODE -ne 0) { throw 'git fetch origin --prune failed.' }
  }

  $branch = (& git -c "safe.directory=$repositoryPath" -C $repositoryPath branch --show-current | Out-String).Trim()
  $head = (& git -c "safe.directory=$repositoryPath" -C $repositoryPath rev-parse HEAD | Out-String).Trim()
  $remoteHead = (& git -c "safe.directory=$repositoryPath" -C $repositoryPath rev-parse origin/main | Out-String).Trim()
  $porcelain = (& git -c "safe.directory=$repositoryPath" -C $repositoryPath status --porcelain | Out-String).Trim()

  $ok = $branch -eq 'main' -and [string]::IsNullOrWhiteSpace($porcelain) -and $head -eq $remoteHead
  [pscustomobject]@{
    Repository = $repositoryPath
    Branch = $branch
    LocalHead = $head
    RemoteMain = $remoteHead
    WorktreeClean = [string]::IsNullOrWhiteSpace($porcelain)
    InSync = $ok
  } | Format-List

  if (-not $ok) { exit 1 }
  exit 0
} catch {
  Write-Error $_
  exit 2
}
