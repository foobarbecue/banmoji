import { parseGIF, decompressFrames } from "gifuct-js"
import { GIFEncoder, quantize, applyPalette } from 'gifenc'

const gifExporter = new GIFEncoder()

const uploadField = document.getElementsByTagName('input')[0]
const gifDisplayCanvas = document.querySelector('canvas#gifdisplay') 
const gifDisplayCtx = gifDisplayCanvas.getContext('2d')
const origGifDisplayCanvas = document.querySelector('canvas#origgifdisplay')
const origGifDisplayCtx = origGifDisplayCanvas.getContext('2d')

const nonOverlainCanvas = document.createElement('canvas')

const overlayEl = document.querySelector('#overlay')
const inpImgDims = {width: null, height: null}
const downloadButtonEl = document.getElementsByName("download")[0]
let inpImgFrames = null
let frameInd=0
uploadField.onchange = async function (evt){
    const inpImgParsed = parseGIF(await evt.target.files[0].arrayBuffer())
    inpImgFrames = decompressFrames(inpImgParsed, true)
    // todo probably can save several LOC using unpacking or something
    inpImgDims.width = inpImgFrames[0].dims.width
    inpImgDims.height = inpImgFrames[0].dims.height
    gifDisplayCanvas.width = inpImgDims.width
    gifDisplayCanvas.height = inpImgDims.height
    overlayEl.width = inpImgDims.width
    overlayEl.height = inpImgDims.height
    
    // Now that we have an input image, set up the controls
    downloadButtonEl.onclick = render
    downloadButtonEl.style.display = 'block'
    gifDisplayCanvas.style.display = 'block'
    Object.assign(nonOverlainCanvas, inpImgDims)
    Object.assign(origGifDisplayCanvas, inpImgDims)
    preview()
}

function render(){
    for (const frame of inpImgFrames) {
        const tempcanvas = document.createElement('canvas')
        tempcanvas.width = gifDisplayCanvas.width
        tempcanvas.height = gifDisplayCanvas.height
        const imgdata = gifDisplayCtx.createImageData(frame.dims.width, frame.dims.height)
        imgdata.data.set(frame.patch)
        tempctx.putImageData(imgdata, frame.dims.left, frame.dims.top)
        gifDisplayCtx.drawImage(tempcanvas, 0, 0)
        gifDisplayCtx.drawImage(overlayEl, 0, 0, inpImgFrames[0].dims.width, inpImgFrames[0].dims.height)

        const imgdataForExport = gifDisplayCtx.getImageData(0, 0, inpImgFrames[0].dims.width, inpImgFrames[0].dims.height).data

        // Quantize your colors to a 256-color RGB palette palette
        const palette = quantize(imgdataForExport, 256)

        // Get an indexed bitmap by reducing each pixel to the nearest color palette
        const indexed = applyPalette(imgdataForExport, palette)

        gifExporter.writeFrame(indexed, inpImgFrames[0].dims.width, inpImgFrames[0].dims.height, {palette})
    }
    gifExporter.finish()
    // Get a direct typed array view into the buffer to avoid copying it
    const buffer = gifExporter.bytesView()
    download(buffer, 'animation.gif', { type: 'image/gif' })
}

function addOverlay(nonOverlainCanvas, newImgFrame, overlay){
    // Inputs:
    // non-overlain canvas nonOverlainCanvas where gif data is accumulating
    // gifuct-js frame inpImgFrame
    // overlay image element overlayEl
    // 
    
    // create temporary canvas inpFrameCanvas and draw newImgFrame to it
    const inpFrameCanvas = document.createElement('canvas')
    Object.assign(inpFrameCanvas, inpImgDims)
    const inpImgCtx = inpFrameCanvas.getContext('2d')
    const inpImgData = gifDisplayCtx.createImageData(newImgFrame.dims.width, newImgFrame.dims.height)
    inpImgData.data.set(newImgFrame.patch)
    inpImgCtx.putImageData(inpImgData, newImgFrame.dims.left, newImgFrame.dims.top)

    // draw inpFrameCanvas onto accumulating image nonOverlainCanvas
    nonOverlainCanvas.globalAlpha = 1
    nonOverlainCanvas.getContext('2d').drawImage(inpFrameCanvas, 0, 0)
    
    // create temporary canvas overlainCanvas
    const overlainCanvas = document.createElement('canvas')
    Object.assign(overlainCanvas, inpImgDims)
    const overlainCtx = overlainCanvas.getContext('2d')
    overlainCtx.globalAlpha = 1
    overlainCtx.drawImage(nonOverlainCanvas,0, 0)
    overlainCtx.globalAlpha = document.getElementById("nosignTransparency").value
    overlainCtx.drawImage(overlay, 0, 0, inpImgFrames[0].dims.width, inpImgFrames[0].dims.height)
    
    return {original: nonOverlainCanvas, overlain: overlainCanvas}
}

function preview(){
    const newFrame = inpImgFrames[frameInd]
    const overlayOutput = addOverlay(nonOverlainCanvas, newFrame, overlayEl)
    gifDisplayCtx.clearRect(0, 0, inpImgDims.width, inpImgDims.height)
    gifDisplayCtx.drawImage(overlayOutput.overlain, 0, 0)
    origGifDisplayCtx.drawImage(overlayOutput.original, 0, 0)
    frameInd++
    if (frameInd >= inpImgFrames.length){
        frameInd = 0
    }
    requestAnimationFrame(()=>{
        setTimeout(preview, newFrame.delay)
    })
}

function download (buf, filename, type) {
    const blob = buf instanceof Blob ? buf : new Blob([buf], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
}