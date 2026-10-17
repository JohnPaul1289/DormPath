# Raster exports of public/icon.svg for PWA installers that require PNG icons.
Add-Type -AssemblyName System.Drawing
foreach ($dormSize in @(192, 512)) {
    $dormBitmap = [System.Drawing.Bitmap]::new($dormSize, $dormSize)
    $dormGraphics = [System.Drawing.Graphics]::FromImage($dormBitmap)
    $dormGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $dormGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#174be8'))
    $dormGraphics.ScaleTransform($dormSize / 192.0, $dormSize / 192.0)
    $dormPoints = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(40,91), [System.Drawing.PointF]::new(96,43),
        [System.Drawing.PointF]::new(152,91), [System.Drawing.PointF]::new(152,148),
        [System.Drawing.PointF]::new(111,148), [System.Drawing.PointF]::new(111,108),
        [System.Drawing.PointF]::new(81,108), [System.Drawing.PointF]::new(81,148),
        [System.Drawing.PointF]::new(40,148)
    )
    $dormGraphics.FillPolygon([System.Drawing.Brushes]::White, $dormPoints)
    $dormGold = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#ffd477'))
    $dormGraphics.FillEllipse($dormGold, 132, 35, 26, 26)
    $dormBitmap.Save((Join-Path $PSScriptRoot "../public/icon-$dormSize.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $dormGold.Dispose()
    $dormGraphics.Dispose()
    $dormBitmap.Dispose()
}
