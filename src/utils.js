export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload    = () => resolve(reader.result)    // data:<mime>;base64,...
    reader.onerror   = err => reject(err)
    reader.readAsDataURL(file)
  })
}