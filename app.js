// ============================================
// QR & Barcode Generator — Web Version (app.js)
// Pure browser APIs, no Electron dependencies
// ============================================

const dataList = [];

// DOM References
const pageInput = document.getElementById('page-input');
const previewModal = document.getElementById('preview-modal');
const btnCloseModal = document.getElementById('btn-close-modal');

const typeSelect = document.getElementById('type-select');
const fileImport = document.getElementById('file-import');
const btnAdd = document.getElementById('btn-add');
const btnClear = document.getElementById('btn-clear');
const btnGenerate = document.getElementById('btn-generate');
const btnPrint = document.getElementById('btn-print');

const inputKode = document.getElementById('input-kode');
const inputNama1 = document.getElementById('input-nama1');
const inputNama2 = document.getElementById('input-nama2');
const inputNama3 = document.getElementById('input-nama3');

const dataTbody = document.getElementById('data-tbody');
const dataCount = document.getElementById('data-count');
const emptyState = document.getElementById('empty-state');
const printArea = document.getElementById('print-area');

// ---- Modal helpers ----
function openModal() {
    previewModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    previewModal.style.display = 'none';
    document.body.style.overflow = '';
}

// ---- Helpers ----
function updateTable() {
    dataCount.textContent = dataList.length;
    btnGenerate.disabled = dataList.length === 0;
    emptyState.style.display = dataList.length === 0 ? 'flex' : 'none';

    dataTbody.innerHTML = '';
    dataList.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(item.kode)}</td>
      <td>${escapeHtml(item.nama1)}</td>
      <td>${escapeHtml(item.nama2)}</td>
      <td>${escapeHtml(item.nama3)}</td>
      <td>
        <button class="btn-delete-row" data-idx="${idx}" title="Hapus">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
        </button>
      </td>
    `;
        dataTbody.appendChild(tr);
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function clearForm() {
    inputKode.value = '';
    inputNama1.value = '';
    inputNama2.value = '';
    inputNama3.value = '';
    inputKode.focus();
}

// ---- Add Data ----
btnAdd.addEventListener('click', () => {
    const kode = inputKode.value.trim();
    if (!kode) {
        inputKode.focus();
        inputKode.style.borderColor = '#ff6b6b';
        setTimeout(() => (inputKode.style.borderColor = ''), 1500);
        return;
    }
    dataList.push({
        kode,
        nama1: inputNama1.value.trim(),
        nama2: inputNama2.value.trim(),
        nama3: inputNama3.value.trim(),
    });
    clearForm();
    updateTable();
});

// Enter key to add
[inputKode, inputNama1, inputNama2, inputNama3].forEach((input, i, arr) => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (i < arr.length - 1) {
                arr[i + 1].focus();
            } else {
                btnAdd.click();
            }
        }
    });
});

// ---- Delete Row ----
dataTbody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete-row');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    dataList.splice(idx, 1);
    updateTable();
});

// ---- Clear All ----
btnClear.addEventListener('click', () => {
    if (dataList.length === 0) return;
    dataList.length = 0;
    updateTable();
});

// ---- Import Excel/CSV (browser File API + SheetJS) ----
fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            rows.forEach((row) => {
                const kode = row.kode || row.Kode || row.KODE || row.code || row.Code || row.CODE || '';
                const nama1 = row.nama1 || row.Nama1 || row.NAMA1 || row['Nama 1'] || row['nama 1'] || row.Outlet || row.OUTLET || '';
                const nama2 = row.nama2 || row.Nama2 || row.NAMA2 || row['Nama 2'] || row['nama 2'] || row['No. Asset'] || row.NoAsset || row['NO. ASSET'] || '';
                const nama3 = row.nama3 || row.Nama3 || row.NAMA3 || row['Nama 3'] || row['nama 3'] || row['Tipe Asset'] || row.TipeAsset || row['TIPE ASSET'] || '';

                if (String(kode).trim()) {
                    dataList.push({
                        kode: String(kode).trim(),
                        nama1: String(nama1).trim(),
                        nama2: String(nama2).trim(),
                        nama3: String(nama3).trim(),
                    });
                }
            });

            updateTable();
        } catch (err) {
            alert('Gagal membaca file: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
});

// ---- Generate Preview (opens modal popup) ----
btnGenerate.addEventListener('click', async () => {
    if (dataList.length === 0) return;

    // Show loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'generating-overlay';
    overlay.innerHTML = '<div class="spinner"></div><p>Generating codes...</p>';
    document.body.appendChild(overlay);

    const type = typeSelect.value;
    printArea.innerHTML = '';

    try {
        for (const item of dataList) {
            const card = document.createElement('div');
            card.className = 'print-card';

            const codeDiv = document.createElement('div');
            codeDiv.className = 'print-card-code';

            if (type === 'qrcode') {
                const canvas = document.createElement('canvas');
                new QRious({
                    element: canvas,
                    value: item.kode,
                    size: 200,
                    level: 'M',
                    background: '#ffffff',
                    foreground: '#000000',
                    padding: 4,
                });
                codeDiv.appendChild(canvas);
            } else {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                codeDiv.appendChild(svg);
                try {
                    JsBarcode(svg, item.kode, {
                        format: 'CODE128',
                        width: 1.2,
                        height: 40,
                        displayValue: true,
                        fontSize: 9,
                        margin: 2,
                        background: '#ffffff',
                    });
                } catch (err) {
                    codeDiv.innerHTML = '<span style="color:red;font-size:0.7rem;">Invalid</span>';
                }
            }

            const topContainer = document.createElement('div');
            topContainer.className = 'print-card-top';

            const leftCol = document.createElement('div');
            leftCol.className = 'print-card-left';
            leftCol.appendChild(codeDiv);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'print-card-info';
            infoDiv.innerHTML = `
        <div class="info-row">
          <span class="info-value">${escapeHtml(item.nama1) || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-value">${escapeHtml(item.nama2) || '-'}</span>
        </div>
        <div class="print-card-kode">${escapeHtml(item.kode)}</div>
      `;

            topContainer.appendChild(leftCol);
            topContainer.appendChild(infoDiv);

            const nama3Div = document.createElement('div');
            nama3Div.className = 'print-card-nama3';
            nama3Div.innerHTML = escapeHtml(item.nama3) || '-';
            // Force text wrapping inline to override any other constraints
            nama3Div.style.whiteSpace = 'normal';
            nama3Div.style.wordBreak = 'break-word';
            nama3Div.style.overflow = 'visible';
            nama3Div.style.width = '100%';

            card.appendChild(topContainer);
            card.appendChild(nama3Div);
            printArea.appendChild(card);
        }

        // Open modal popup
        openModal();
    } catch (err) {
        console.error('Generation error:', err);
        alert('Error generating codes: ' + err.message);
    } finally {
        overlay.remove();
    }
});

// ---- Close modal ----
btnCloseModal.addEventListener('click', closeModal);

// Click backdrop to close
previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) closeModal();
});

// ESC key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewModal.style.display !== 'none') {
        closeModal();
    }
});

// ---- Print (browser native) ----
btnPrint.addEventListener('click', () => {
    window.print();
});

// Initial state
updateTable();
