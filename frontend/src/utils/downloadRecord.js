import api from '../services/api';

/**
 * Downloads the original file(s) attached to a medical record.
 * Falls back to the generated summary PDF if no files are attached.
 *
 * @param {object} record - the medical record object (must include `_id` and `files` array)
 */
export async function downloadRecordFile(record) {
  const hasFiles = Array.isArray(record.files) && record.files.length > 0;

  if (!hasFiles) {
    // No original file attached — fall back to the generated summary report
    return downloadViaEndpoint(`/records/${record._id}/download-report`, `${record.title || 'medical-record'}.pdf`);
  }

  // Download each attached file individually using its own metadata
  for (let i = 0; i < record.files.length; i++) {
    const file = record.files[i];
    const filename = file.originalName || file.fileName || `record-${record._id}-file-${i}`;
    await downloadViaEndpoint(
      `/records/${record._id}/view-file?fileIndex=${i}`,
      filename,
      file.mimeType || file.fileType
    );
  }
}

async function downloadViaEndpoint(url, filename, knownMimeType) {
  const response = await api.get(url, { responseType: 'blob' });

  // If response is a blob, the actual blob is response directly (or response.data if Axios interceptor resolves differently)
  // Let's check: the Axios interceptor response.data returns response.data
  // Wait! In api.interceptors.response.use, we return response.data!
  // So response is already the blob object directly because responseType is 'blob'!
  // Let's verify: Yes, response is the blob object itself (i.e. response.data of axios response).
  // So we should do:
  // new Blob([response], { type: mimeType })
  // Wait, let's verify if response.data or response is correct.
  // In our previous download logic:
  // const response = await api.get(`/records/${recordId}/download-report`, { responseType: 'blob' });
  // const blob = new Blob([response], { type: 'application/pdf' });
  // Yes! The previous code used new Blob([response])!
  // So response is indeed the Blob itself because the Axios interceptor resolved to response.data.
  // But wait! If we do response.data, let's check: response.data of a Blob is undefined because Blob doesn't have a .data property!
  // So if response is the Blob, we must use response itself:
  // const blob = new Blob([response], { type: mimeType });
  // Or we can be safe: const blobData = response.data || response; const blob = new Blob([blobData], { type: mimeType });
  // Let's do: const blobData = response.data || response; to be fully safe for both tests/mock environments!
  const blobData = (response && response.data) ? response.data : response;
  const mimeType = knownMimeType || response.type || 'application/octet-stream';
  const blob = new Blob([blobData], { type: mimeType });

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
