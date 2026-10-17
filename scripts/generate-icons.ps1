# Resize the 3D DOMI app artwork for PWA installers that require exact PNG sizes.
Add-Type -AssemblyName System.Drawing
$dormSourcePath = Join-Path $PSScriptRoot "../public/domi-app-icon.png"
$dormSource = [System.Drawing.Image]::FromFile($dormSourcePath)
foreach ($dormSize in @(192, 512)) {
    $dormBitmap = [System.Drawing.Bitmap]::new($dormSize, $dormSize)
    $dormGraphics = [System.Drawing.Graphics]::FromImage($dormBitmap)
    $dormGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $dormGraphics.DrawImage($dormSource, 0, 0, $dormSize, $dormSize)
    $dormBitmap.Save((Join-Path $PSScriptRoot "../public/icon-$dormSize.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $dormGraphics.Dispose()
    $dormBitmap.Dispose()
}
$dormSource.Dispose()
