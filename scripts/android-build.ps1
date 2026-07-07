$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$jdk = Join-Path $root ".tools\jdk\jdk-21.0.11+10"
$sdk = Join-Path $root ".tools\android-sdk"

if (-not (Test-Path (Join-Path $jdk "bin\java.exe"))) {
  throw "Local JDK not found at $jdk. Recreate it under .tools or install Java and set JAVA_HOME."
}

if (-not (Test-Path (Join-Path $sdk "platforms\android-36"))) {
  throw "Local Android SDK not found at $sdk. Install Android SDK platform 36 before building."
}

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$jdk\bin;$sdk\cmdline-tools\latest\bin;$sdk\platform-tools;$env:Path"

Push-Location (Join-Path $root "android")
try {
  .\gradlew.bat bundleRelease
} finally {
  Pop-Location
}
