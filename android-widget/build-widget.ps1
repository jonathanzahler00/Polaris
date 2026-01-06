# PowerShell script to build the Polaris Android Widget
# This script uses Android Studio's bundled JDK

$ErrorActionPreference = "Stop"

# Set Android Studio JDK path
$JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;$env:PATH"

Write-Host "Using Android Studio JDK: $JAVA_HOME" -ForegroundColor Green

# Verify Java is available
java -version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Java not found" -ForegroundColor Red
    exit 1
}

Write-Host "`nKeystore already exists: polaris-widget.keystore" -ForegroundColor Green
Write-Host "Password: ***REMOVED***" -ForegroundColor Yellow

# Build the APK
Write-Host "`nBuilding Android Widget APK..." -ForegroundColor Green
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful!" -ForegroundColor Green
    Write-Host "APK location: app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
    Write-Host "`nTo install on your phone:" -ForegroundColor Yellow
    Write-Host "  1. Copy the APK to your phone"
    Write-Host "  2. Open it and allow installation from unknown sources"
    Write-Host "  3. Install the app"
    Write-Host "  4. Add widget to home screen"
} else {
    Write-Host "`nBuild failed!" -ForegroundColor Red
    exit 1
}
