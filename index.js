console.log('test')
const uploadField = document.getElementsByTagName('input')[0]
const uploadSpot = document.getElementById('uploadSpot')
const myfilereader = new FileReader()
uploadField.onchange = function (evt){
    myfilereader.readAsDataURL(evt.target.files[0])
    console.log(evt)
}

myfilereader.onload = function (evt){
    uploadSpot.src = evt.target.result
    console.log(evt)
    mergeImages([evt.target.result, 'banned.png'])
        .then(
            (merged) => {
                document.getElementById('combined').src = merged
            }
        )
}