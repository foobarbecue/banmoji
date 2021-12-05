import { parseGIF, decompressFrames } from "gifuct-js"
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

const gifExporter = new GIFEncoder()

const uploadField = document.getElementsByTagName('input')[0]
const gifcanvas = document.getElementsByTagName('canvas')[0] 
const imgctx = gifcanvas.getContext('2d')
// extra canvas needed to deal with gif transparency
const tempcanvas = document.createElement('canvas')
const tempctx = tempcanvas.getContext('2d')
const overlay = document.querySelector('#overlay')
let frames = null
let frameInd=0
uploadField.onchange = async function (evt){
    const gif = parseGIF(await evt.target.files[0].arrayBuffer())
    frames = decompressFrames(gif, true)
    gifcanvas.width = frames[0].dims.width
    gifcanvas.height = frames[0].dims.height
    tempcanvas.width = gifcanvas.width
    tempcanvas.height = gifcanvas.height
    overlay.width = gifcanvas.width
    overlay.height = gifcanvas.height
    drawFrames()
}

function drawFrames(){
    const frame = frames[frameInd]
    const imgdata = imgctx.createImageData(frame.dims.width, frame.dims.height)
    imgdata.data.set(frame.patch)
    tempctx.putImageData(imgdata, frame.dims.left, frame.dims.top)
    imgctx.drawImage(tempcanvas,0, 0)
    imgctx.drawImage(overlay, 0, 0, frames[0].dims.width, frames[0].dims.height)
    
    const imgdataForExport = imgctx.getImageData(0, 0 , frames[0].dims.width, frames[0].dims.height).data
    
    // Quantize your colors to a 256-color RGB palette palette
    const palette = quantize(imgdataForExport, 256);
    
    // Get an indexed bitmap by reducing each pixel to the nearest color palette
    const index = applyPalette(imgdataForExport, palette);
    
    gifExporter.writeFrame(imgdataForExport, frames[0].dims.width, frames[0].dims.height, { palette })
    frameInd++
    if (frameInd >= frames.length){
        frameInd = 0
        gifExporter.finish()
        // Get a direct typed array view into the buffer to avoid copying it
        const buffer = gifExporter.bytesView();
        download(buffer, 'animation.gif', { type: 'image/gif' });
    }
    requestAnimationFrame(()=>{
        setTimeout(drawFrames, frame.delay)
    })
}

function download (buf, filename, type) {
    const blob = buf instanceof Blob ? buf : new Blob([buf], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
};