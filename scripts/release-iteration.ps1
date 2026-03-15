param(
	[Parameter(Mandatory = $true)]
	[string]$Version,

	[Parameter(Mandatory = $true)]
	[string]$CommitMessage,

	[Parameter(Mandatory = $true)]
	[string[]]$Changes
)

$ErrorActionPreference = 'Stop'

Set-Location (Split-Path -Parent $PSScriptRoot)

function Update-JsonVersion {
	param(
		[string]$Path,
		[string]$Version
	)

	$content = Get-Content -Raw -Path $Path
	$updated = [regex]::Replace($content, '"version"\s*:\s*"[^"]+"', "`"version`": `"$Version`"", 1)
	if ($updated -eq $content) {
		throw "Failed to update version in $Path"
	}
	Set-Content -Path $Path -Value $updated -Encoding utf8
}

function Prepend-ChangelogEntry {
	param(
		[string]$Path,
		[string]$Version,
		[string[]]$Changes
	)

	$existing = Get-Content -Raw -Path $Path
	$body = ($Changes | ForEach-Object { "1. $_" }) -join "`r`n"
	$entry = @"
# $Version

## 变更

$body

"@
	if ($existing -match '^# 更新日志（Changelog）') {
		$updated = $existing -replace '^# 更新日志（Changelog）\r?\n\r?\n', "# 更新日志（Changelog）`r`n`r`n$entry"
	} else {
		$updated = "$entry$existing"
	}
	Set-Content -Path $Path -Value $updated -Encoding utf8
}

Update-JsonVersion -Path '.\package.json' -Version $Version
Update-JsonVersion -Path '.\extension.json' -Version $Version
Prepend-ChangelogEntry -Path '.\CHANGELOG.md' -Version $Version -Changes $Changes

npm run build | Out-Host

git add .\package.json .\extension.json .\CHANGELOG.md .\README.md .\src .\iframe .\config .\build\dist .\scripts .\.edaignore .\locales
git commit -m $CommitMessage --no-verify | Out-Host
