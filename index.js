import { parseGIF, decompressFrames } from "gifuct-js";


console.log('test')
const uploadField = document.getElementsByTagName('input')[0]
const uploadSpot = document.getElementById('uploadSpot')
const gifcanvas = document.getElementsByTagName('canvas')[0] 
const imgctx = gifcanvas.getContext('2d')
// extra canvas needed to deal with gif transparency
const tempcanvas = document.createElement('canvas')
const tempctx = tempcanvas.getContext('2d')
const overlay = document.querySelector('#overlay')
let frames=null
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
    drawFrames(frames)
}

function drawFrames(){
    const frame = frames[frameInd]
    const imgdata = imgctx.createImageData(frame.dims.width, frame.dims.height)
    imgdata.data.set(frame.patch)
    tempctx.putImageData(imgdata, frame.dims.left, frame.dims.top)
    imgctx.drawImage(tempcanvas,0, 0)
    imgctx.drawImage(overlay, 0, 0, frames[0].dims.width, frames[0].dims.height)
    frameInd++
    if (frameInd >= frames.length){
        frameInd = 0
    }
    requestAnimationFrame(()=>{
        setTimeout(drawFrames, 100)
    })
}

function download(){
    
}