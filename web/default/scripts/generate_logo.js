import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '../public')

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512">
  <defs>
    <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
  </defs>
  <path d="M12 2Q12 12 2 12Q12 12 12 22Q12 12 22 12Q12 12 12 2Z" fill="url(#logo-grad)" />
</svg>`

const svgPath = path.join(publicDir, 'logo.svg')
fs.writeFileSync(svgPath, svgContent, 'utf-8')
console.log('Saved logo.svg to', svgPath)

function svgToPng(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  })
  const pngData = resvg.render()
  return pngData.asPng()
}

const png512Buffer = svgToPng(svgContent, 512)
const pngPath = path.join(publicDir, 'logo.png')
fs.writeFileSync(pngPath, png512Buffer)
console.log('Saved logo.png (512x512) to', pngPath)

const png32Buffer = svgToPng(svgContent, 32)
const icoPath = path.join(publicDir, 'favicon.ico')
fs.writeFileSync(icoPath, png32Buffer)
console.log('Saved favicon.ico (32x32) to', icoPath)
