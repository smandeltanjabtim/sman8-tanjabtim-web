/* =====================================================
   PERPUSTAKAAN DIGITAL - JAVASCRIPT
   SMAN 8 Tanjung Jabung Timur
   ===================================================== */

// ─── State Global ─────────────────────────────────────
let allData = [];
let books = [];
let members = [];
let borrows = [];
let currentPage = 'dashboard';
let deleteTarget = null;
let editingBook = null;
let editingMember = null;

const defaultConfig = {
  library_name: 'Perpustakaan Digital',
  welcome_text: 'Selamat datang di sistem perpustakaan',
  primary_color: '#6366f1',
  secondary_color: '#f8fafc',
  text_color: '#1e293b',
  accent_color: '#10b981',
  surface_color: '#ffffff'
};

// ─── Data Handler (SDK) ───────────────────────────────
const dataHandler = {
  onDataChanged(data) {
    allData = data;
    books   = data.filter(d => d.type === 'book');
    members = data.filter(d => d.type === 'member');
    borrows = data.filter(d => d.type === 'borrow');

    updateDashboard();
    renderBooks();
    renderMembers();
    renderBorrowOptions();
    renderActiveBorrows();
    renderReturnsTable();
    renderReports();
  }
};

// ─── GOOGLE SHEETS API ADAPTER (VERSI BAHASA INDONESIA) ─────────────────
// GANTI STRING DI BAWAH DENGAN URL WEB APP YANG ANDA COPY DARI APPS SCRIPT
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwrnxDyUPEAJhvd0qcrCNJqN4rVOLPqH6DuLXFi2hiVlpSsEsPERUlr29o5c6xsROsiFA/exec";

// Kamus Terjemahan: Mengubah variabel web menjadi judul kolom Indonesia
const kamusData = {
  '__backendId': 'ID_Sistem',
  'type': 'Tipe',
  'title': 'Judul',
  'author': 'Penulis',
  'publisher': 'Penerbit',
  'year': 'Tahun',
  'category': 'Kategori',
  'isbn': 'ISBN',
  'copies': 'Total_Buku',
  'available': 'Tersedia',
  'location': 'Lokasi',
  'created_at': 'Tgl_Dibuat',
  'member_id': 'No_Anggota',
  'name': 'Nama',
  'phone': 'Telepon',
  'email': 'Email',
  'address': 'Alamat',
  'join_date': 'Tgl_Gabung',
  'member_backend_id': 'ID_Anggota_Sistem',
  'book_backend_id': 'ID_Buku_Sistem',
  'member_name': 'Nama_Anggota',
  'book_title': 'Judul_Buku',
  'borrow_date': 'Tgl_Pinjam',
  'due_date': 'Batas_Kembali',
  'return_date': 'Tgl_Dikembalikan',
  'status': 'Status',
  'fine': 'Denda'
};

function keBahasaIndonesia(obj) {
  let hasil = {};
  for (let key in obj) {
    if (kamusData[key]) hasil[kamusData[key]] = obj[key];
    else hasil[key] = obj[key];
  }
  return hasil;
}

function keBahasaSistem(obj) {
  let kamusSistem = {};
  for (let key in kamusData) kamusSistem[kamusData[key]] = key;
  let hasil = {};
  for (let key in obj) {
    if (kamusSistem[key]) hasil[kamusSistem[key]] = obj[key];
    else hasil[key] = obj[key];
  }
  return hasil;
}

function generateUniqId() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

// Fungsi bantuan untuk membuat jeda waktu (delay) buatan
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Menimpa SDK bawaan agar terhubung ke Google Sheets (Versi Loading 1 Detik)
window.dataSdk = {
  handler: null,
  
  async init(handler) {
    this.handler = handler;
    showToast('Memuat data dari Google Sheets...', 'info');
    try {
      const response = await fetch(GOOGLE_SHEETS_URL);
      const result = await response.json();
      if (result.isOk) {
        let formattedData = result.data.map(item => keBahasaSistem(item));
        formattedData = formattedData.map(item => {
          if (item.copies) item.copies = parseInt(item.copies);
          if (item.available) item.available = parseInt(item.available);
          if (item.fine) item.fine = parseInt(item.fine);
          return item;
        });
        
        this.handler.onDataChanged(formattedData);
        showToast('Data berhasil disinkronkan', 'success');
        return { isOk: true };
      }
      return { isOk: false };
    } catch (error) {
      showToast('Gagal memuat data dari server', 'error');
      return { isOk: false };
    }
  },

  async create(data) {
    data.__backendId = generateUniqId();
    const dataIndo = keBahasaIndonesia(data);
    
    // 1. Kirim ke Google Sheets di latar belakang tanpa memblokir
    fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'create', data: dataIndo })
    }).catch(error => console.error("Gagal simpan ke Sheets:", error));
    
    // 2. Tunggu secara paksa selama 1 detik agar animasi loading terlihat
    await delay(1000);

    // 3. Update UI setelah 1 detik
    allData.push(data);
    this.handler.onDataChanged(allData);

    return { isOk: true };
  },

  async update(data) {
    const dataIndo = keBahasaIndonesia(data);
    
    // 1. Kirim ke Google Sheets di latar belakang
    fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'update', data: dataIndo })
    }).catch(error => console.error("Gagal update ke Sheets:", error));
    
    // 2. Tunggu secara paksa selama 1 detik
    await delay(1000);

    // 3. Update UI setelah 1 detik
    const index = allData.findIndex(d => d.__backendId === data.__backendId);
    if (index !== -1) {
      allData[index] = data;
      this.handler.onDataChanged(allData);
    }

    return { isOk: true };
  },

  async delete(data) {
    const dataIndo = keBahasaIndonesia(data);
    
    // 1. Kirim perintah hapus ke Google Sheets di latar belakang
    fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', data: dataIndo })
    }).catch(error => console.error("Gagal hapus di Sheets:", error));
    
    // 2. Tunggu secara paksa selama 1 detik
    await delay(1000);

    // 3. Hapus dari UI secara instan setelah jeda selesai
    allData = allData.filter(d => d.__backendId !== data.__backendId);
    this.handler.onDataChanged(allData);

    return { isOk: true };
  }
};

// ─── Inisialisasi App ─────────────────────────────────
async function initApp() {
  if (window.elementSdk) {
    window.elementSdk.init({
      defaultConfig,
      onConfigChange: async (config) => {
        const libraryName = document.getElementById('library-name');
        const welcomeText = document.getElementById('welcome-text');

        if (libraryName) libraryName.textContent = config.library_name || defaultConfig.library_name;
        if (welcomeText) welcomeText.textContent = config.welcome_text || defaultConfig.welcome_text;

        document.documentElement.style.setProperty('--primary-color', config.primary_color || defaultConfig.primary_color);
      },
      mapToCapabilities: (config) => ({
        recolorables: [
          {
            get: () => config.primary_color || defaultConfig.primary_color,
            set: (value) => { config.primary_color = value; window.elementSdk.setConfig({ primary_color: value }); }
          },
          {
            get: () => config.secondary_color || defaultConfig.secondary_color,
            set: (value) => { config.secondary_color = value; window.elementSdk.setConfig({ secondary_color: value }); }
          },
          {
            get: () => config.text_color || defaultConfig.text_color,
            set: (value) => { config.text_color = value; window.elementSdk.setConfig({ text_color: value }); }
          },
          {
            get: () => config.accent_color || defaultConfig.accent_color,
            set: (value) => { config.accent_color = value; window.elementSdk.setConfig({ accent_color: value }); }
          },
          {
            get: () => config.surface_color || defaultConfig.surface_color,
            set: (value) => { config.surface_color = value; window.elementSdk.setConfig({ surface_color: value }); }
          }
        ],
        borderables: [],
        fontEditable: undefined,
        fontSizeable: undefined
      }),
      mapToEditPanelValues: (config) => new Map([
        ['library_name', config.library_name || defaultConfig.library_name],
        ['welcome_text', config.welcome_text || defaultConfig.welcome_text]
      ])
    });
  }

  if (window.dataSdk) {
    const result = await window.dataSdk.init(dataHandler);
    if (!result.isOk) {
      showToast('Gagal menginisialisasi penyimpanan data', 'error');
    }
  }

  // Set tanggal hari ini untuk form peminjaman
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('borrow-date').value = today;
  document.getElementById('borrow-date').addEventListener('change', updateDueDate);
  updateDueDate();
}

// ─── Navigasi ─────────────────────────────────────────
function navigateTo(page) {
  currentPage = page;

  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${page}`).classList.remove('hidden');

  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) item.classList.add('active');
  });

  const titles = {
    dashboard: 'Dashboard',
    books:     'Data Buku',
    members:   'Data Anggota',
    borrow:    'Peminjaman Buku',
    returns:   'Pengembalian Buku',
    reports:   'Laporan'
  };
  document.getElementById('page-title').textContent = titles[page];
}

// ─── Dashboard ────────────────────────────────────────
function updateDashboard() {
  const totalCopies    = books.reduce((sum, b) => sum + (b.copies || 0), 0);
  const activeBorrows  = borrows.filter(b => b.status === 'borrowed');
  const totalBorrowed  = activeBorrows.length;
  const totalAvailable = books.reduce((sum, b) => sum + (b.available || 0), 0);

  document.getElementById('stat-total-books').textContent = totalCopies;
  document.getElementById('stat-borrowed').textContent    = totalBorrowed;
  document.getElementById('stat-available').textContent   = totalAvailable;
  document.getElementById('stat-members').textContent     = members.length;

  // Statistik bulanan
  const now       = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const monthlyBorrows = borrows.filter(b => {
    const d = new Date(b.borrow_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const monthlyReturns = borrows.filter(b => {
    if (!b.return_date) return false;
    const d = new Date(b.return_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const overdueCount  = activeBorrows.filter(b => new Date(b.due_date) < now).length;
  const monthlyFines  = borrows.filter(b => b.return_date).reduce((sum, b) => sum + (b.fine || 0), 0);

  document.getElementById('monthly-borrows').textContent  = monthlyBorrows.length;
  document.getElementById('monthly-returns').textContent  = monthlyReturns.length;
  document.getElementById('monthly-overdue').textContent  = overdueCount;
  document.getElementById('monthly-fines').textContent    = `Rp ${monthlyFines.toLocaleString('id-ID')}`;

  // Peminjaman terbaru
  const recentBorrowsEl = document.getElementById('recent-borrows');
  const recent = [...borrows].sort((a, b) => new Date(b.borrow_date) - new Date(a.borrow_date)).slice(0, 5);

  if (recent.length === 0) {
    recentBorrowsEl.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Belum ada data peminjaman</p>';
  } else {
    recentBorrowsEl.innerHTML = recent.map(b => `
      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <span class="text-indigo-600 font-semibold text-sm">${(b.member_name || '?')[0].toUpperCase()}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 truncate">${b.book_title || 'Unknown'}</p>
          <p class="text-xs text-slate-500">${b.member_name || 'Unknown'} • ${formatDate(b.borrow_date)}</p>
        </div>
        <span class="px-2 py-1 text-xs font-medium rounded-full ${b.status === 'borrowed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
          ${b.status === 'borrowed' ? 'Dipinjam' : 'Dikembalikan'}
        </span>
      </div>
    `).join('');
  }
}

// ─── Buku ─────────────────────────────────────────────
function renderBooks() {
  const tbody    = document.getElementById('books-table-body');
  const search   = document.getElementById('book-search').value.toLowerCase();
  const category = document.getElementById('book-category-filter').value;

  let filtered = books;
  if (search) {
    filtered = filtered.filter(b =>
      (b.title  || '').toLowerCase().includes(search) ||
      (b.author || '').toLowerCase().includes(search) ||
      (b.isbn   || '').toLowerCase().includes(search)
    );
  }
  if (category) {
    filtered = filtered.filter(b => b.category === category);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-5 py-8 text-center text-slate-500">Tidak ada data buku</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(book => `
    <tr class="table-row">
      <td class="px-5 py-4">
        <input type="checkbox" class="book-checkbox rounded" value="${book.__backendId}" onchange="updateBookSelection()">
      </td>
      <td class="px-5 py-4">
        <div class="font-medium text-slate-800">${book.title || '-'}</div>
        <div class="text-xs text-slate-500">${book.publisher || '-'} (${book.year || '-'})</div>
      </td>
      <td class="px-5 py-4 text-sm text-slate-600">${book.author || '-'}</td>
      <td class="px-5 py-4">
        <span class="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">${book.category || '-'}</span>
      </td>
      <td class="px-5 py-4 text-sm text-slate-600 font-mono">${book.isbn || '-'}</td>
      <td class="px-5 py-4 text-center">
        <span class="text-sm font-medium ${book.available > 0 ? 'text-emerald-600' : 'text-red-600'}">${book.available || 0}/${book.copies || 0}</span>
      </td>
      <td class="px-5 py-4 text-sm text-slate-600">${book.location || '-'}</td>
      <td class="px-5 py-4 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="editBook('${book.__backendId}')" class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button onclick="showDeleteConfirm('book', '${book.__backendId}', '${(book.title || '').replace(/'/g, "\\'")}')" class="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterBooks() { renderBooks(); }

function showBookModal(bookId = null) {
  editingBook = bookId ? books.find(b => b.__backendId === bookId) : null;

  document.getElementById('book-modal-title').textContent  = editingBook ? 'Edit Buku' : 'Tambah Buku Baru';
  document.getElementById('book-id').value                 = editingBook?.__backendId || '';
  document.getElementById('book-title').value              = editingBook?.title     || '';
  document.getElementById('book-author').value             = editingBook?.author    || '';
  document.getElementById('book-publisher').value          = editingBook?.publisher || '';
  document.getElementById('book-year').value               = editingBook?.year      || '';
  document.getElementById('book-category').value           = editingBook?.category  || '';
  document.getElementById('book-isbn').value               = editingBook?.isbn      || '';
  document.getElementById('book-copies').value             = editingBook?.copies    || 1;
  document.getElementById('book-location').value           = editingBook?.location  || '';

  document.getElementById('book-modal').classList.remove('hidden');
  document.getElementById('book-modal').classList.add('flex');
}

function closeBookModal() {
  document.getElementById('book-modal').classList.add('hidden');
  document.getElementById('book-modal').classList.remove('flex');
  document.getElementById('book-form').reset();
  editingBook = null;
}

async function handleBookSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('book-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner inline-block mr-2"></span>Menyimpan...';

  const copies   = parseInt(document.getElementById('book-copies').value) || 1;
  const bookData = {
    type:       'book',
    title:      document.getElementById('book-title').value,
    author:     document.getElementById('book-author').value,
    publisher:  document.getElementById('book-publisher').value,
    year:       document.getElementById('book-year').value,
    category:   document.getElementById('book-category').value,
    isbn:       document.getElementById('book-isbn').value,
    copies:     copies,
    available:  editingBook ? editingBook.available : copies,
    location:   document.getElementById('book-location').value,
    created_at: editingBook?.created_at || new Date().toISOString()
  };

  try {
    if (allData.length >= 999 && !editingBook) {
      showToast('Batas maksimum 999 data tercapai', 'error');
      return;
    }

    let result;
    if (editingBook) {
      result = await window.dataSdk.update({ ...editingBook, ...bookData });
    } else {
      result = await window.dataSdk.create(bookData);
    }

    if (result.isOk) {
      showToast(editingBook ? 'Buku berhasil diperbarui' : 'Buku berhasil ditambahkan', 'success');
      closeBookModal();
    } else {
      showToast('Gagal menyimpan buku', 'error');
    }
  } catch (error) {
    showToast('Terjadi kesalahan', 'error');
  } finally {
    btn.disabled  = false;
    btn.textContent = 'Simpan';
  }
}

function editBook(id) { showBookModal(id); }

function showBulkBookModal() {
  document.getElementById('bulk-book-modal').classList.remove('hidden');
  document.getElementById('bulk-book-modal').classList.add('flex');
}

function closeBulkBookModal() {
  document.getElementById('bulk-book-modal').classList.add('hidden');
  document.getElementById('bulk-book-modal').classList.remove('flex');
  document.getElementById('bulk-book-input').value = '';
}

async function processBulkBooks() {
  const input = document.getElementById('bulk-book-input').value.trim();
  if (!input) { showToast('Masukkan data buku', 'error'); return; }

  const btn = document.getElementById('bulk-book-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner inline-block mr-2"></span>Memproses...';

  const lines = input.split('\n').filter(line => line.trim());
  let success = 0, failed = 0;

  for (const line of lines) {
    if (allData.length >= 999) { showToast('Batas maksimum 999 data tercapai', 'error'); break; }

    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      const copies   = parseInt(parts[6]) || 1;
      const bookData = {
        type:       'book',
        title:      parts[0] || '',
        author:     parts[1] || '',
        publisher:  parts[2] || '',
        year:       parts[3] || '',
        category:   parts[4] || 'Umum',
        isbn:       parts[5] || '',
        copies:     copies,
        available:  copies,
        location:   parts[7] || '',
        created_at: new Date().toISOString()
      };
      const result = await window.dataSdk.create(bookData);
      if (result.isOk) success++; else failed++;
    } else {
      failed++;
    }
  }

  btn.disabled    = false;
  btn.textContent = 'Proses Data';

  showToast(`${success} buku ditambahkan${failed > 0 ? `, ${failed} gagal` : ''}`, success > 0 ? 'success' : 'error');
  if (success > 0) closeBulkBookModal();
}

// ─── Anggota ──────────────────────────────────────────
function renderMembers() {
  const tbody  = document.getElementById('members-table-body');
  const search = document.getElementById('member-search').value.toLowerCase();

  let filtered = members;
  if (search) {
    filtered = filtered.filter(m =>
      (m.name      || '').toLowerCase().includes(search) ||
      (m.member_id || '').toLowerCase().includes(search) ||
      (m.email     || '').toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-8 text-center text-slate-500">Tidak ada data anggota</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(member => `
    <tr class="table-row">
      <td class="px-5 py-4">
        <input type="checkbox" class="member-checkbox rounded" value="${member.__backendId}" onchange="updateMemberSelection()">
      </td>
      <td class="px-5 py-4 font-mono text-sm text-slate-800">${member.member_id || '-'}</td>
      <td class="px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span class="text-purple-600 font-semibold text-sm">${(member.name || '?')[0].toUpperCase()}</span>
          </div>
          <div>
            <div class="font-medium text-slate-800">${member.name || '-'}</div>
            <div class="text-xs text-slate-500">${member.address || '-'}</div>
          </div>
        </div>
      </td>
      <td class="px-5 py-4 text-sm text-slate-600">${member.email || '-'}</td>
      <td class="px-5 py-4 text-sm text-slate-600">${member.phone || '-'}</td>
      <td class="px-5 py-4 text-sm text-slate-600">${formatDate(member.join_date)}</td>
      <td class="px-5 py-4 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="editMember('${member.__backendId}')" class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button onclick="showDeleteConfirm('member', '${member.__backendId}', '${(member.name || '').replace(/'/g, "\\'")}')" class="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterMembers() { renderMembers(); }

function showMemberModal(memberId = null) {
  editingMember = memberId ? members.find(m => m.__backendId === memberId) : null;

  document.getElementById('member-modal-title').textContent = editingMember ? 'Edit Anggota' : 'Tambah Anggota Baru';
  document.getElementById('member-id').value                = editingMember?.__backendId  || '';
  document.getElementById('member-name').value              = editingMember?.name         || '';
  document.getElementById('member-number').value            = editingMember?.member_id    || '';
  document.getElementById('member-phone').value             = editingMember?.phone        || '';
  document.getElementById('member-email').value             = editingMember?.email        || '';
  document.getElementById('member-address').value           = editingMember?.address      || '';
  document.getElementById('member-join-date').value         = editingMember?.join_date    || new Date().toISOString().split('T')[0];

  document.getElementById('member-modal').classList.remove('hidden');
  document.getElementById('member-modal').classList.add('flex');
}

function closeMemberModal() {
  document.getElementById('member-modal').classList.add('hidden');
  document.getElementById('member-modal').classList.remove('flex');
  document.getElementById('member-form').reset();
  editingMember = null;
}

async function handleMemberSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('member-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner inline-block mr-2"></span>Menyimpan...';

  const memberData = {
    type:       'member',
    name:       document.getElementById('member-name').value,
    member_id:  document.getElementById('member-number').value,
    phone:      document.getElementById('member-phone').value,
    email:      document.getElementById('member-email').value,
    address:    document.getElementById('member-address').value,
    join_date:  document.getElementById('member-join-date').value || new Date().toISOString().split('T')[0],
    created_at: editingMember?.created_at || new Date().toISOString()
  };

  try {
    if (allData.length >= 999 && !editingMember) {
      showToast('Batas maksimum 999 data tercapai', 'error');
      return;
    }

    let result;
    if (editingMember) {
      result = await window.dataSdk.update({ ...editingMember, ...memberData });
    } else {
      result = await window.dataSdk.create(memberData);
    }

    if (result.isOk) {
      showToast(editingMember ? 'Anggota berhasil diperbarui' : 'Anggota berhasil ditambahkan', 'success');
      closeMemberModal();
    } else {
      showToast('Gagal menyimpan anggota', 'error');
    }
  } catch (error) {
    showToast('Terjadi kesalahan', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Simpan';
  }
}

function editMember(id) { showMemberModal(id); }

function showBulkMemberModal() {
  document.getElementById('bulk-member-modal').classList.remove('hidden');
  document.getElementById('bulk-member-modal').classList.add('flex');
}

function closeBulkMemberModal() {
  document.getElementById('bulk-member-modal').classList.add('hidden');
  document.getElementById('bulk-member-modal').classList.remove('flex');
  document.getElementById('bulk-member-input').value = '';
}

async function processBulkMembers() {
  const input = document.getElementById('bulk-member-input').value.trim();
  if (!input) { showToast('Masukkan data anggota', 'error'); return; }

  const btn = document.getElementById('bulk-member-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner inline-block mr-2"></span>Memproses...';

  const lines = input.split('\n').filter(line => line.trim());
  let success = 0, failed = 0;

  for (const line of lines) {
    if (allData.length >= 999) { showToast('Batas maksimum 999 data tercapai', 'error'); break; }

    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      const memberData = {
        type:       'member',
        name:       parts[0] || '',
        member_id:  parts[1] || '',
        address:    parts[2] || '',
        phone:      parts[3] || '',
        email:      parts[4] || '',
        join_date:  new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };
      const result = await window.dataSdk.create(memberData);
      if (result.isOk) success++; else failed++;
    } else {
      failed++;
    }
  }

  btn.disabled    = false;
  btn.textContent = 'Proses Data';

  showToast(`${success} anggota ditambahkan${failed > 0 ? `, ${failed} gagal` : ''}`, success > 0 ? 'success' : 'error');
  if (success > 0) closeBulkMemberModal();
}

// ─── Peminjaman ───────────────────────────────────────
function renderBorrowOptions() {
  const memberSelect = document.getElementById('borrow-member');
  const bookSelect   = document.getElementById('borrow-book');

  memberSelect.innerHTML = '<option value="">Pilih Anggota</option>' +
    members.map(m => `<option value="${m.__backendId}">${m.member_id} - ${m.name}</option>`).join('');

  const availableBooks = books.filter(b => (b.available || 0) > 0);
  bookSelect.innerHTML = '<option value="">Pilih Buku</option>' +
    availableBooks.map(b => `<option value="${b.__backendId}">${b.title} (${b.available} tersedia)</option>`).join('');
}

function updateDueDate() {
  const borrowDate = document.getElementById('borrow-date').value;
  if (borrowDate) {
    const due = new Date(borrowDate);
    due.setDate(due.getDate() + 14); // masa pinjam 14 hari
    document.getElementById('due-date').value = due.toISOString().split('T')[0];
  }
}

async function handleBorrow(e) {
  e.preventDefault();

  const btn = document.getElementById('borrow-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner inline-block mr-2"></span>Memproses...';

  const memberId  = document.getElementById('borrow-member').value;
  const bookId    = document.getElementById('borrow-book').value;
  const borrowDate = document.getElementById('borrow-date').value;
  const dueDate   = document.getElementById('due-date').value;

  const member = members.find(m => m.__backendId === memberId);
  const book   = books.find(b => b.__backendId === bookId);

  if (!member || !book) {
    showToast('Pilih anggota dan buku', 'error');
    btn.disabled    = false;
    btn.textContent = 'Proses Peminjaman';
    return;
  }

  if ((book.available || 0) <= 0) {
    showToast('Buku tidak tersedia', 'error');
    btn.disabled    = false;
    btn.textContent = 'Proses Peminjaman';
    return;
  }

  try {
    if (allData.length >= 999) { showToast('Batas maksimum 999 data tercapai', 'error'); return; }

    const borrowData = {
      type:             'borrow',
      member_backend_id: memberId,
      book_backend_id:   bookId,
      member_name:      member.name,
      member_id:        member.member_id,
      book_title:       book.title,
      borrow_date:      borrowDate,
      due_date:         dueDate,
      return_date:      '',
      status:           'borrowed',
      fine:             0,
      created_at:       new Date().toISOString()
    };

    const result = await window.dataSdk.create(borrowData);

    if (result.isOk) {
      await window.dataSdk.update({ ...book, available: (book.available || 0) - 1 });

      showToast('Peminjaman berhasil diproses', 'success');
      document.getElementById('borrow-form').reset();
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('borrow-date').value = today;
      updateDueDate();
    } else {
      showToast('Gagal memproses peminjaman', 'error');
    }
  } catch (error) {
    showToast('Terjadi kesalahan', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Proses Peminjaman';
  }
}

function renderActiveBorrows() {
  const container = document.getElementById('active-borrows');
  const active    = borrows.filter(b => b.status === 'borrowed');

  if (active.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Belum ada peminjaman aktif</p>';
    return;
  }

  const now = new Date();
  container.innerHTML = active.map(b => {
    const isOverdue = new Date(b.due_date) < now;
    return `
      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg ${isOverdue ? 'border-l-4 border-red-500' : ''}">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 truncate">${b.book_title || 'Unknown'}</p>
          <p class="text-xs text-slate-500">${b.member_name} • Jatuh tempo: ${formatDate(b.due_date)}</p>
        </div>
        ${isOverdue ? '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Terlambat</span>' : ''}
      </div>
    `;
  }).join('');
}

// ─── Pengembalian ─────────────────────────────────────
function renderReturnsTable() {
  const tbody  = document.getElementById('returns-table-body');
  const active = borrows.filter(b => b.status === 'borrowed');

  if (active.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-slate-500">Tidak ada buku yang dipinjam</td></tr>';
    return;
  }

  const now = new Date();
  tbody.innerHTML = active.map(b => {
    const isOverdue   = new Date(b.due_date) < now;
    const daysOverdue = isOverdue ? Math.ceil((now - new Date(b.due_date)) / (1000 * 60 * 60 * 24)) : 0;
    const fine        = daysOverdue * 1000; // Rp 1.000 per hari

    return `
      <tr class="table-row">
        <td class="px-5 py-4">
          <div class="font-medium text-slate-800">${b.member_name || '-'}</div>
          <div class="text-xs text-slate-500">${b.member_id || '-'}</div>
        </td>
        <td class="px-5 py-4 text-sm text-slate-800">${b.book_title || '-'}</td>
        <td class="px-5 py-4 text-sm text-slate-600">${formatDate(b.borrow_date)}</td>
        <td class="px-5 py-4 text-sm text-slate-600">${formatDate(b.due_date)}</td>
        <td class="px-5 py-4">
          ${isOverdue ? `
            <div>
              <span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Terlambat ${daysOverdue} hari</span>
              <p class="text-xs text-red-600 mt-1">Denda: Rp ${fine.toLocaleString('id-ID')}</p>
            </div>
          ` : '<span class="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Tepat Waktu</span>'}
        </td>
        <td class="px-5 py-4 text-center">
          <button onclick="processReturn('${b.__backendId}', ${fine})" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors">
            Kembalikan
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function processReturn(borrowId, fine) {
  const borrow = borrows.find(b => b.__backendId === borrowId);
  if (!borrow) return;

  const book = books.find(b => b.__backendId === borrow.book_backend_id);

  try {
    const result = await window.dataSdk.update({
      ...borrow,
      status:      'returned',
      return_date: new Date().toISOString().split('T')[0],
      fine:        fine
    });

    if (result.isOk && book) {
      await window.dataSdk.update({ ...book, available: (book.available || 0) + 1 });
      showToast(`Buku berhasil dikembalikan${fine > 0 ? `. Denda: Rp ${fine.toLocaleString('id-ID')}` : ''}`, 'success');
    } else {
      showToast('Gagal memproses pengembalian', 'error');
    }
  } catch (error) {
    showToast('Terjadi kesalahan', 'error');
  }
}

// ─── Laporan ──────────────────────────────────────────
function renderReports() {
  // Buku paling sering dipinjam
  const bookBorrowCount = {};
  borrows.forEach(b => {
    bookBorrowCount[b.book_title] = (bookBorrowCount[b.book_title] || 0) + 1;
  });

  const popularBooks   = Object.entries(bookBorrowCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const popularBooksEl = document.getElementById('popular-books-list');

  if (popularBooks.length === 0) {
    popularBooksEl.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Belum ada data</p>';
  } else {
    popularBooksEl.innerHTML = popularBooks.map(([title, count], i) => `
      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">${i + 1}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 truncate">${title}</p>
        </div>
        <span class="text-sm font-semibold text-indigo-600">${count}x</span>
      </div>
    `).join('');
  }

  // Anggota paling aktif
  const memberBorrowCount = {};
  borrows.forEach(b => {
    memberBorrowCount[b.member_name] = (memberBorrowCount[b.member_name] || 0) + 1;
  });

  const activeMembers   = Object.entries(memberBorrowCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const activeMembersEl = document.getElementById('active-members-list');

  if (activeMembers.length === 0) {
    activeMembersEl.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Belum ada data</p>';
  } else {
    activeMembersEl.innerHTML = activeMembers.map(([name, count], i) => `
      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <span class="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">${i + 1}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 truncate">${name}</p>
        </div>
        <span class="text-sm font-semibold text-purple-600">${count} pinjaman</span>
      </div>
    `).join('');
  }

  // Buku terlambat
  const now      = new Date();
  const overdue  = borrows.filter(b => b.status === 'borrowed' && new Date(b.due_date) < now);
  const overdueEl = document.getElementById('overdue-list');

  if (overdue.length === 0) {
    overdueEl.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Tidak ada buku terlambat</p>';
  } else {
    overdueEl.innerHTML = overdue.map(b => {
      const daysOverdue = Math.ceil((now - new Date(b.due_date)) / (1000 * 60 * 60 * 24));
      return `
        <div class="flex items-center gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">${b.book_title}</p>
            <p class="text-xs text-slate-500">${b.member_name}</p>
          </div>
          <span class="text-sm font-semibold text-red-600">${daysOverdue} hari</span>
        </div>
      `;
    }).join('');
  }

  // Ringkasan denda
  const unpaidFines = borrows.filter(b => b.status === 'borrowed').reduce((sum, b) => {
    const daysOverdue = Math.max(0, Math.ceil((now - new Date(b.due_date)) / (1000 * 60 * 60 * 24)));
    return sum + (daysOverdue * 1000);
  }, 0);

  const collectedFines = borrows.filter(b => b.status === 'returned').reduce((sum, b) => sum + (b.fine || 0), 0);

  document.getElementById('total-unpaid-fines').textContent    = `Rp ${unpaidFines.toLocaleString('id-ID')}`;
  document.getElementById('total-collected-fines').textContent = `Rp ${collectedFines.toLocaleString('id-ID')}`;
}

function exportReport(type) {
  let content = '';
  const now   = new Date().toLocaleDateString('id-ID');

  if (type === 'popular-books') {
    content = 'LAPORAN BUKU PALING SERING DIPINJAM\n';
    content += `Tanggal: ${now}\n\n`;
    const bookBorrowCount = {};
    borrows.forEach(b => { bookBorrowCount[b.book_title] = (bookBorrowCount[b.book_title] || 0) + 1; });
    Object.entries(bookBorrowCount).sort((a, b) => b[1] - a[1]).forEach(([title, count], i) => {
      content += `${i + 1}. ${title} - ${count}x dipinjam\n`;
    });
  } else if (type === 'active-members') {
    content = 'LAPORAN ANGGOTA PALING AKTIF\n';
    content += `Tanggal: ${now}\n\n`;
    const memberBorrowCount = {};
    borrows.forEach(b => { memberBorrowCount[b.member_name] = (memberBorrowCount[b.member_name] || 0) + 1; });
    Object.entries(memberBorrowCount).sort((a, b) => b[1] - a[1]).forEach(([name, count], i) => {
      content += `${i + 1}. ${name} - ${count} pinjaman\n`;
    });
  } else if (type === 'overdue') {
    content = 'LAPORAN BUKU TERLAMBAT\n';
    content += `Tanggal: ${now}\n\n`;
    const overdue = borrows.filter(b => b.status === 'borrowed' && new Date(b.due_date) < new Date());
    if (overdue.length === 0) {
      content += 'Tidak ada buku terlambat.\n';
    } else {
      overdue.forEach((b, i) => {
        const daysOverdue = Math.ceil((new Date() - new Date(b.due_date)) / (1000 * 60 * 60 * 24));
        content += `${i + 1}. ${b.book_title}\n   Peminjam: ${b.member_name}\n   Terlambat: ${daysOverdue} hari\n\n`;
      });
    }
  } else if (type === 'fines') {
    content = 'LAPORAN DENDA\n';
    content += `Tanggal: ${now}\n\n`;
    const unpaidFines = borrows.filter(b => b.status === 'borrowed').reduce((sum, b) => {
      const daysOverdue = Math.max(0, Math.ceil((new Date() - new Date(b.due_date)) / (1000 * 60 * 60 * 24)));
      return sum + (daysOverdue * 1000);
    }, 0);
    const collectedFines = borrows.filter(b => b.status === 'returned').reduce((sum, b) => sum + (b.fine || 0), 0);
    content += `Total Denda Belum Dibayar: Rp ${unpaidFines.toLocaleString('id-ID')}\n`;
    content += `Total Denda Terkumpul: Rp ${collectedFines.toLocaleString('id-ID')}\n`;
  }

  // Unduh sebagai file teks
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `laporan_${type}_${now.replace(/\//g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Laporan berhasil diekspor', 'success');
}

// ─── Hapus Data ───────────────────────────────────────
function showDeleteConfirm(type, id, name) {
  deleteTarget = { type, id, name };
  document.getElementById('delete-message').textContent =
    `Apakah Anda yakin ingin menghapus ${type === 'book' ? 'buku' : 'anggota'} "${name}"?`;
  document.getElementById('delete-modal').classList.remove('hidden');
  document.getElementById('delete-modal').classList.add('flex');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('hidden');
  document.getElementById('delete-modal').classList.remove('flex');
  deleteTarget = null;
}

async function confirmDelete() {
  if (!deleteTarget) return;

  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner inline-block mr-2"></span>Menghapus...';

  try {
    let item;
    if (deleteTarget.type === 'book') {
      item = books.find(b => b.__backendId === deleteTarget.id);
    } else {
      item = members.find(m => m.__backendId === deleteTarget.id);
    }

    if (item) {
      const result = await window.dataSdk.delete(item);
      if (result.isOk) {
        showToast(`${deleteTarget.type === 'book' ? 'Buku' : 'Anggota'} berhasil dihapus`, 'success');
        closeDeleteModal();
      } else {
        showToast('Gagal menghapus data', 'error');
      }
    }
  } catch (error) {
    showToast('Terjadi kesalahan', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Hapus';
  }
}

// ─── Hapus Massal Buku ────────────────────────────────
function updateBookSelection() {
  const checkboxes  = document.querySelectorAll('.book-checkbox:checked');
  const bulkDeleteUI = document.getElementById('book-bulk-delete');

  if (checkboxes.length > 0) {
    bulkDeleteUI.classList.remove('hidden');
    document.getElementById('selected-books-count').textContent = checkboxes.length;
  } else {
    bulkDeleteUI.classList.add('hidden');
    document.getElementById('book-select-all').checked = false;
  }
}

function toggleSelectAllBooks(checkbox) {
  document.querySelectorAll('.book-checkbox').forEach(cb => cb.checked = checkbox.checked);
  updateBookSelection();
}

function clearBookSelection() {
  document.querySelectorAll('.book-checkbox').forEach(cb => cb.checked = false);
  document.getElementById('book-select-all').checked = false;
  document.getElementById('book-bulk-delete').classList.add('hidden');
}

async function bulkDeleteBooks() {
  const checkboxes = document.querySelectorAll('.book-checkbox:checked');
  if (checkboxes.length === 0) { showToast('Pilih minimal satu buku untuk dihapus', 'error'); return; }

  const bulkDeleteUI = document.getElementById('book-bulk-delete');
  const btn          = bulkDeleteUI.querySelector('button:last-child');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner inline-block mr-2"></span>Menghapus...';

  let deleted = 0, failed = 0;

  for (const checkbox of checkboxes) {
    const book = books.find(b => b.__backendId === checkbox.value);
    if (book) {
      const result = await window.dataSdk.delete(book);
      if (result.isOk) deleted++; else failed++;
    }
  }

  btn.disabled    = false;
  btn.textContent = 'Hapus Terpilih';

  if (deleted > 0) {
    showToast(`${deleted} buku berhasil dihapus${failed > 0 ? `, ${failed} gagal` : ''}`, 'success');
    clearBookSelection();
  } else {
    showToast('Gagal menghapus buku', 'error');
  }
}

// ─── Hapus Massal Anggota ─────────────────────────────
function updateMemberSelection() {
  const checkboxes   = document.querySelectorAll('.member-checkbox:checked');
  const bulkDeleteUI = document.getElementById('member-bulk-delete');

  if (checkboxes.length > 0) {
    bulkDeleteUI.classList.remove('hidden');
    document.getElementById('selected-members-count').textContent = checkboxes.length;
  } else {
    bulkDeleteUI.classList.add('hidden');
    document.getElementById('member-select-all').checked = false;
  }
}

function toggleSelectAllMembers(checkbox) {
  document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = checkbox.checked);
  updateMemberSelection();
}

function clearMemberSelection() {
  document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
  document.getElementById('member-select-all').checked = false;
  document.getElementById('member-bulk-delete').classList.add('hidden');
}

async function bulkDeleteMembers() {
  const checkboxes = document.querySelectorAll('.member-checkbox:checked');
  if (checkboxes.length === 0) { showToast('Pilih minimal satu anggota untuk dihapus', 'error'); return; }

  const bulkDeleteUI = document.getElementById('member-bulk-delete');
  const btn          = bulkDeleteUI.querySelector('button:last-child');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner inline-block mr-2"></span>Menghapus...';

  let deleted = 0, failed = 0;

  for (const checkbox of checkboxes) {
    const member = members.find(m => m.__backendId === checkbox.value);
    if (member) {
      const result = await window.dataSdk.delete(member);
      if (result.isOk) deleted++; else failed++;
    }
  }

  btn.disabled    = false;
  btn.textContent = 'Hapus Terpilih';

  if (deleted > 0) {
    showToast(`${deleted} anggota berhasil dihapus${failed > 0 ? `, ${failed} gagal` : ''}`, 'success');
    clearMemberSelection();
  } else {
    showToast('Gagal menghapus anggota', 'error');
  }
}

// ─── Utilitas ─────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast     = document.createElement('div');

  toast.className = `toast px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
    type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
  } text-white`;

  toast.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      ${type === 'success'
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
        : type === 'error'
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'}
    </svg>
    <span class="text-sm font-medium">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── Fitur Excel (Download Template & Upload) ─────────────────────────

function downloadExcelTemplate(type) {
  if (typeof XLSX === 'undefined') {
    showToast('Library Excel belum dimuat. Periksa koneksi internet.', 'error');
    return;
  }

  let ws_data = [];
  let fileName = '';

  if (type === 'book') {
    // Header tabel
    ws_data = [['Judul', 'Penulis', 'Penerbit', 'Tahun', 'Kategori', 'ISBN', 'Jumlah', 'Lokasi']];
    // Contoh isi
    ws_data.push(['Laskar Pelangi', 'Andrea Hirata', 'Bentang', '2005', 'Fiksi', '978-979-1227-01-2', '3', 'Rak A-01']);
    fileName = 'Template_Data_Buku.xlsx';
  } else if (type === 'member') {
    // Header tabel
    ws_data = [['Nama', 'No. Anggota', 'Alamat', 'Telepon', 'Email']];
    // Contoh isi
    ws_data.push(['Ahmad Fadli', 'M001', 'Jl. Merdeka No. 10', '081234567890', 'ahmad@email.com']);
    fileName = 'Template_Data_Anggota.xlsx';
  }

  // Buat worksheet dan workbook
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  
  // Memicu unduhan file
  XLSX.writeFile(wb, fileName);
  showToast('Template Excel berhasil diunduh', 'success');
}

function handleExcelUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      // Membaca file menggunakan SheetJS
      const workbook = XLSX.read(data, {type: 'array'});
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Ubah data sheet menjadi array 2 dimensi
      const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
      
      if (json.length <= 1) {
        showToast('File Excel kosong atau tidak memiliki data', 'error');
        return;
      }

      let resultText = '';
      // Loop data, skip baris pertama (index 0) karena itu adalah header
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        
        // Lewati jika baris benar-benar kosong
        if (row.length === 0 || !row.some(cell => cell !== undefined && cell !== '')) continue;
        
        // Gabungkan sel dengan pemisah " | "
        resultText += row.map(cell => cell === undefined ? '' : cell).join(' | ') + '\n';
      }

      // Masukkan teks hasil konversi ke dalam textarea
      if (type === 'book') {
        document.getElementById('bulk-book-input').value = resultText.trim();
      } else if (type === 'member') {
        document.getElementById('bulk-member-input').value = resultText.trim();
      }
      
      showToast('File Excel berhasil dimuat ke kotak teks', 'success');
    } catch (error) {
      console.error(error);
      showToast('Gagal membaca format Excel', 'error');
    }
    
    // Kosongkan value input agar user bisa upload file yang sama jika salah hapus textarea
    event.target.value = '';
  };
  
  reader.readAsArrayBuffer(file);
}

// ─── Jalankan App ─────────────────────────────────────
initApp();

// ─── Admin Popup & Logout ─────────────────────────────
function toggleAdminPopup(e) {
  // Mencegah event klik merambat ke document
  e.stopPropagation();
  const popup = document.getElementById('admin-popup');
  popup.classList.toggle('hidden');
}

// Menutup pop-up saat mengklik area di luar pop-up
document.addEventListener('click', function(e) {
  const popup = document.getElementById('admin-popup');
  
  if (popup && !popup.classList.contains('hidden')) {
    const adminBtn = popup.previousElementSibling;
    // Jika yang diklik bukan pop-up dan bukan tombol admin
    if (!popup.contains(e.target) && !adminBtn.contains(e.target)) {
      popup.classList.add('hidden');
    }
  }
});

function logout() {
  // Menampilkan notifikasi dan mengarahkan kembali ke beranda
  showToast('Melakukan logout...', 'info');
  
  setTimeout(() => {
    // Arahkan ke halaman beranda (sesuaikan '/' dengan URL beranda yang sebenarnya jika perlu)
  window.location.href = "index.html";
  }, 1000);
}

