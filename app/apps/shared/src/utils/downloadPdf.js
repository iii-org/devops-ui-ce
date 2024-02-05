/**
 *! Download pdf by selecting dom and converting to canvas, and can be used like this.$pdf(dom, file_info) to download pdf
 * @param dom - dom selected in components
 * @param file_name - pdf file name
 */

import Vue from 'vue'
import html2canvas from 'html2canvas'
import JsPDF from 'jspdf'

const PDF = {}

PDF.install = function(options) {
  Vue.prototype.$pdf = function(dom, fileName, canvas = true) {
    if (canvas) {
      html2canvas(dom).then(canvas => {
        const time = new Date()
        const timeNow = time.toLocaleString()
        const fullFileName = `${fileName}_${timeNow}`

        const imgData = canvas.toDataURL('image/jpeg')
        const imgWidth = 595
        const pageHeight = 841
        const imgHeight = canvas.height * (imgWidth / canvas.width)
        let heightLeft = imgHeight
        const doc = new JsPDF('p', 'pt', 'a4')
        let position = 0

        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          doc.addPage()
          doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        doc.save(fullFileName)
      })
    } else {
      const headContent = document.head.outerHTML
      // Open the print window
      const winPrint = window.open(
        '',
        '',
        'left = 0, top = 0, width = 800, height = 900, toolbar = 0, scrollbars = 0, status = 0'
      )
      winPrint.document.write(`${headContent}${dom}`)
      winPrint.document.close()
      winPrint.focus()
      // Set a timeout before calling print
      const printTimeout = setTimeout(() => {
        winPrint.print()
      }, 1000)

      // Event listener to close the print window and clear the timeout after printing
      winPrint.onafterprint = () => {
        clearTimeout(printTimeout)
        winPrint.close()
      }
    }
  }
}

Vue.use(PDF)

export default { PDF }
