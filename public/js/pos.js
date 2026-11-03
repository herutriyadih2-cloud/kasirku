let cart = [];

const searchInput = document.getElementById('searchProduct');
const searchResults = document.getElementById('searchResults');
const cartItems = document.getElementById('cartItems');
const grandTotalEl = document.getElementById('grandTotal');
const discountTotalEl = document.getElementById('discountTotal');
const paidAmountEl = document.getElementById('paidAmount');
const changeAmountEl = document.getElementById('changeAmount');
const paymentMethodEl = document.getElementById('paymentMethod');
const cashInput = document.getElementById('cashInput');
const weightTotalEl = document.getElementById('weightTotal');
const btnSave = document.getElementById('btnSaveTransaction');

function formatMoney(num) {
  return Number(num).toLocaleString('id-ID');
}

function renderCart() {
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach((item, index) => {
    const subtotal = (item.price * item.quantity) - item.discount;
    total += subtotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="fw-semibold">${item.name}</div>
        <small class="text-muted">${item.service_type === 'kiloan' ? 'Kiloan' : 'Satuan'}</small>
      </td>
      <td>Rp ${formatMoney(item.price)}</td>
      <td><input type="number" step="0.01" min="0.1" class="form-control form-control-sm cart-qty" value="${item.quantity}" data-index="${index}" style="width:80px;"></td>
      <td><input type="number" min="0" class="form-control form-control-sm cart-discount" value="${item.discount}" data-index="${index}" style="width:90px;"></td>
      <td class="fw-semibold">Rp ${formatMoney(subtotal)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removeItem(${index})"><i class="bi bi-trash"></i></button></td>
    `;
    cartItems.appendChild(tr);
  });

  document.querySelectorAll('.cart-qty').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = e.target.dataset.index;
      cart[idx].quantity = parseFloat(e.target.value) || 1;
      renderCart();
    });
  });

  document.querySelectorAll('.cart-discount').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = e.target.dataset.index;
      cart[idx].discount = parseFloat(e.target.value) || 0;
      renderCart();
    });
  });

  const discount = parseFloat(discountTotalEl.value) || 0;
  const grandTotal = Math.max(total - discount, 0);
  grandTotalEl.textContent = formatMoney(grandTotal);

  calculateChange();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function calculateChange() {
  const total = parseFloat(grandTotalEl.textContent.replace(/\./g, '').replace(',', '.')) || 0;
  const paid = parseFloat(paidAmountEl.value) || 0;
  const change = Math.max(paid - total, 0);
  changeAmountEl.textContent = formatMoney(change);
}

searchInput.addEventListener('input', async (e) => {
  const q = e.target.value.trim();
  if (q.length < 2) {
    searchResults.innerHTML = '';
    return;
  }
  const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
  const products = await res.json();
  searchResults.innerHTML = '';
  products.forEach(p => {
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'list-group-item list-group-item-action';
    a.innerHTML = `<div class="d-flex justify-content-between"><strong>${p.name}</strong><span class="fw-semibold text-primary">Rp ${formatMoney(p.sale_price)}</span></div><small class="text-muted">${p.code} · ${p.service_type === 'kiloan' ? 'Kiloan' : 'Satuan'} · ${p.unit}</small>`;
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      addToCart(p);
      searchInput.value = '';
      searchResults.innerHTML = '';
      searchInput.focus();
    });
    searchResults.appendChild(a);
  });
});

function addToCart(product) {
  const existing = cart.find(i => i.product_id === product.id);
  if (existing) {
    existing.quantity += product.service_type === 'kiloan' ? 1 : 1;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      service_type: product.service_type,
      price: parseFloat(product.sale_price),
      quantity: product.service_type === 'kiloan' ? 1 : 1,
      discount: 0,
    });
  }
  renderCart();
}

discountTotalEl.addEventListener('input', renderCart);
paidAmountEl.addEventListener('input', calculateChange);

paymentMethodEl.addEventListener('change', () => {
  const isCredit = paymentMethodEl.value === 'credit';
  cashInput.style.display = isCredit ? 'none' : 'block';
});

btnSave.addEventListener('click', async () => {
  if (cart.length === 0) {
    alert('Keranjang masih kosong');
    return;
  }

  const items = cart.map(i => ({
    product_id: i.product_id,
    quantity: i.quantity,
    sale_price_at_time: i.price,
    discount: i.discount,
  }));

  const payload = {
    items,
    weight: parseFloat(weightTotalEl.value) || 0,
    payment_method: paymentMethodEl.value,
    paid_amount: parseFloat(paidAmountEl.value) || 0,
    customer_id: document.getElementById('customerId').value || null,
    employee_id: document.getElementById('employeeId').value || null,
    discount: parseFloat(discountTotalEl.value) || 0,
    estimated_finish_date: document.getElementById('estimatedFinish').value || null,
    note: document.getElementById('note').value,
  };

  const res = await fetch('/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.success) {
    alert('Order berhasil disimpan!');
    const printUrl = `/transactions/${data.transaction_id}/print`;
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      window.location.href = printUrl;
    } else {
      window.open(printUrl, '_blank');
      window.location.reload();
    }
  } else {
    alert('Gagal: ' + data.error);
  }
});

searchInput.focus();
