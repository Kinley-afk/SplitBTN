// Turns report HTML into a PDF. Works offline: nothing here uses the network.
// 1st choice: create a PDF file and open the share sheet.
// If sharing fails (some phones refuse to share the file), fall back to the
// system print dialog, which has a "Save as PDF" option.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Returns 'shared' or 'print-dialog' so the caller knows what happened.
export async function exportPdf(html) {
  try {
    const file = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf', // iOS file type
        dialogTitle: 'Export expenses',
      });
      return 'shared';
    }
  } catch (error) {
    console.warn('Sharing the PDF failed, using the print dialog instead:', error.message);
  }
  await Print.printAsync({ html });
  return 'print-dialog';
}