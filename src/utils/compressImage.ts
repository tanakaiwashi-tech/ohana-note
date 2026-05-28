/**
 * 画像DataURLをCanvasでリサイズ＋JPEG圧縮して返す
 * - 長辺を最大 MAX_PX px に収める（元が小さければそのまま）
 * - JPEG quality: 0.82（画質と容量のバランス）
 */
const MAX_PX = 1600
const QUALITY = 0.88

export function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img

      // リサイズ後のサイズを計算
      let targetW = w
      let targetH = h
      if (w > h && w > MAX_PX) {
        targetW = MAX_PX
        targetH = Math.round(h * (MAX_PX / w))
      } else if (h >= w && h > MAX_PX) {
        targetH = MAX_PX
        targetW = Math.round(w * (MAX_PX / h))
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        // Canvasが使えない環境ではそのまま返す
        resolve(dataUrl)
        return
      }

      // PNG透過部分が黒くならないよう白背景を敷く
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, targetW, targetH)
      ctx.drawImage(img, 0, 0, targetW, targetH)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }

    img.onerror = reject
    img.src = dataUrl
  })
}
