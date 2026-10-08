var taxRate = 0.15;
var curr = "ر.س";
var invoiceCounter = parseInt(localStorage.getItem("vidas_counter")) || 1;
var currentUser = "";
var savedInvoices = JSON.parse(localStorage.getItem("vidas_invoices")) || [];
var users = JSON.parse(localStorage.getItem("vidas_users")) || [
  { u: "يعقوب", p: "3204047lp" },
  { u: "كوامل", p: "pass1234" },
  { u: "اسيل", p: "pass5678" }
];

var state = {
  invoiceNo: "",
  customerNo: "",
  payMethod: "نقدي",
  items: [{ name: "", qty: 1, price: 0 }]
};

function fixNum(n) { return (Math.round(n * 100) / 100).toFixed(2); }
function cleanText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function makeNum(c) {
  var y = new Date().getFullYear();
  var numStr = "" + c;
  while (numStr.length < 6) { numStr = "0" + numStr; }
  return "VIDAS-" + y + "-" + numStr;
}

function calcTotals() {
  var grand = 0;
  for (var i = 0; i < state.items.length; i++) {
    var q = Number(state.items[i].qty) || 0;
    var p = Number(state.items[i].price) || 0;
    grand += (q * p);
  }
  var subtotal = grand / (1 + taxRate);
  var vat = grand - subtotal;
  return { grand: grand, subtotal: subtotal, vat: vat };
}

function saveDataToStorage() {
  localStorage.setItem("vidas_invoices", JSON.stringify(savedInvoices));
  localStorage.setItem("vidas_counter", invoiceCounter);
  localStorage.setItem("vidas_users", JSON.stringify(users));
}

function renderReceipt() {
  var now = new Date();
  document.getElementById("rDate").textContent = now.toLocaleDateString("en-GB");
  document.getElementById("rTime").textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("rInv").textContent = state.invoiceNo || "—";
  document.getElementById("rPay").textContent = state.payMethod;
  document.getElementById("rUser").textContent = currentUser || "—";
  document.getElementById("rCust").textContent = state.customerNo || "—";

  if (state.invoiceNo) {
    document.getElementById("rBar").textContent = "|| ||| || |||| " + state.invoiceNo.replace(/\D/g, "") + " ||| || ||";
  }

  var lines = document.getElementById("rLines");
  lines.innerHTML = "";

  for (var i = 0; i < state.items.length; i++) {
    var item = state.items[i];
    if (item.name || item.price) {
      var d = document.createElement("div");
      d.className = "line";
      var itemQty = Number(item.qty) || 0;
      var itemPrice = Number(item.price) || 0;
      var lineTotal = fixNum(itemQty * itemPrice);

      d.innerHTML = '<span class="nm">' + cleanText(item.name || "صنف") + '</span>' +
                    '<span class="qt num">' + itemQty + '</span>' +
                    '<span class="pr num">' + lineTotal + '</span>';
      lines.appendChild(d);
    }
  }

  var totals = calcTotals();
  document.getElementById("rTotal").textContent = fixNum(totals.grand) + " " + curr;
  document.getElementById("rVat").textContent = fixNum(totals.vat) + " " + curr;
  document.getElementById("rSub").textContent = fixNum(totals.subtotal) + " " + curr;
}

function renderItems() {
  var tbody = document.getElementById("items");
  tbody.innerHTML = "";

  for (var i = 0; i < state.items.length; i++) {
    var it = state.items[i];
    var tr = document.createElement("tr");
    var q = Number(it.qty) || 0;
    var p = Number(it.price) || 0;
    
    tr.innerHTML = 
      '<td><input type="text" class="inp-name" value="' + cleanText(it.name) + '" placeholder="اسم الصنف"></td>' +
      '<td><input type="number" class="inp-qty" value="' + it.qty + '" min="1"></td>' +
      '<td><input type="number" class="inp-price" value="' + it.price + '" min="0" step="0.01"></td>' +
      '<td class="calc"><input type="text" value="' + fixNum(q * p) + '" readonly></td>' +
      '<td style="text-align:center"><button class="del">✕</button></td>';

    tbody.appendChild(tr);

    (function(index, row) {
      var nameInp = row.querySelector(".inp-name");
      var qtyInp = row.querySelector(".inp-qty");
      var priceInp = row.querySelector(".inp-price");
      var calcInp = row.querySelector("td.calc input");
      var delBtn = row.querySelector(".del");

      nameInp.oninput = function(e) {
        state.items[index].name = e.target.value;
        renderReceipt();
      };

      qtyInp.oninput = function(e) {
        state.items[index].qty = parseFloat(e.target.value) || 0;
        calcInp.value = fixNum(state.items[index].qty * state.items[index].price);
        renderReceipt();
      };

      priceInp.oninput = function(e) {
        state.items[index].price = parseFloat(e.target.value) || 0;
        calcInp.value = fixNum(state.items[index].qty * state.items[index].price);
        renderReceipt();
      };

      delBtn.onclick = function() {
        if (state.items.length <= 1) {
          state.items = [{ name: "", qty: 1, price: 0 }];
        } else {
          state.items.splice(index, 1);
        }
        renderItems();
        renderReceipt();
      };
    })(i, tr);
  }
}

function renderSavedList() {
  var container = document.getElementById("savedListContainer");
  container.innerHTML = "";

  if (savedInvoices.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:20px;">لا توجد فواتير محفوظة بعد</div>';
    return;
  }

  savedInvoices.forEach(function(inv) {
    var card = document.createElement("div");
    card.style.cssText = "border:1px solid #ccc; margin-bottom:12px; padding:10px; background:#f9f9f9; border-radius:4px;";
    
    var html = '<div style="font-weight:bold; margin-bottom:6px;">رقم الفاتورة: ' + cleanText(inv.no) + ' | العميل: ' + cleanText(inv.customer) + ' | الإجمالي: ' + cleanText(inv.total) + '</div>';
    html += '<div style="font-size:12px; color:#666; margin-bottom:6px;">طريقة الدفع: ' + cleanText(inv.payMethod) + ' | بواسطة: ' + cleanText(inv.user) + ' | التاريخ: ' + cleanText(inv.date) + '</div>';
    html += '<table style="width:100%; font-size:12px; border-collapse:collapse; background:#fff;">';
    html += '<tr style="background:#eee;"><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>';

    inv.items.forEach(function(item) {
      var itemTot = (Number(item.qty) || 0) * (Number(item.price) || 0);
      html += '<tr>' +
        '<td style="border:1px solid #ddd; padding:4px;">' + cleanText(item.name || "—") + '</td>' +
        '<td style="border:1px solid #ddd; padding:4px; text-align:center;">' + item.qty + '</td>' +
        '<td style="border:1px solid #ddd; padding:4px; text-align:center;">' + fixNum(item.price) + '</td>' +
        '<td style="border:1px solid #ddd; padding:4px; text-align:center;">' + fixNum(itemTot) + '</td>' +
      '</tr>';
    });

    html += '</table>';
    card.innerHTML = html;
    container.appendChild(card);
  });
}

function syncAll() {
  document.getElementById("custNum").value = state.customerNo || "";
  document.getElementById("invNum").value = state.invoiceNo || "";
  document.getElementById("payMethod").value = state.payMethod || "نقدي";
  renderItems();
  renderReceipt();
}

function doSave() {
  var totals = calcTotals();
  savedInvoices.push({
    no: state.invoiceNo,
    customer: state.customerNo || "—",
    payMethod: state.payMethod,
    total: fixNum(totals.grand) + " " + curr,
    user: currentUser || "—",
    date: document.getElementById("rDate").textContent,
    items: JSON.parse(JSON.stringify(state.items))
  });

  invoiceCounter++;
  saveDataToStorage();

  alert("تم حفظ الفاتورة بنجاح!");
  
  state.invoiceNo = makeNum(invoiceCounter);
  state.customerNo = "";
  state.items = [{ name: "", qty: 1, price: 0 }];
  syncAll();
}

function bindEvents() {
  document.getElementById("showLoginTab").onclick = function() {
    this.className = "tab-btn active";
    document.getElementById("showRegisterTab").className = "tab-btn";
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("registerSection").style.display = "none";
  };

  document.getElementById("showRegisterTab").onclick = function() {
    this.className = "tab-btn active";
    document.getElementById("showLoginTab").className = "tab-btn";
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("registerSection").style.display = "block";
  };

  document.getElementById("loginBtn").onclick = function() {
    var uVal = document.getElementById("loginUser").value.trim();
    var pVal = document.getElementById("loginPass").value.trim();
    var ok = users.some(function(usr) { return usr.u === uVal && usr.p === pVal; });

    if (ok) {
      currentUser = uVal;
      document.getElementById("currentUserLabel").textContent = currentUser;
      document.getElementById("loginModal").style.display = "none";
      renderReceipt();
    } else {
      document.getElementById("loginErr").style.display = "block";
    }
  };

  document.getElementById("regBtn").onclick = function() {
    var nu = document.getElementById("regUser").value.trim();
    var vp = document.getElementById("regAdminPass").value.trim();
    var msg = document.getElementById("regMsg");

    if (vp !== "3204047lp") {
      msg.style.color = "red";
      msg.textContent = "رمز التحقيق غير صحيح!";
      return;
    }
    if (!nu) {
      msg.style.color = "red";
      msg.textContent = "يرجى إدخال اسم مستخدم!";
      return;
    }

    var genPass = "pass" + Math.floor(Math.random() * 8999 + 1000);
    users.push({ u: nu, p: genPass });
    saveDataToStorage();

    msg.style.color = "green";
    msg.textContent = "تم الإنشاء! كلمة المرور: " + genPass;
  };

  document.getElementById("custNum").oninput = function(e) { state.customerNo = e.target.value; renderReceipt(); };
  document.getElementById("payMethod").onchange = function(e) { state.payMethod = e.target.value; renderReceipt(); };
  document.getElementById("addItem").onclick = function() { state.items.push({ name: "", qty: 1, price: 0 }); renderItems(); renderReceipt(); };
  document.getElementById("viewSavedBtn").onclick = function() { renderSavedList(); document.getElementById("savedModal").style.display = "flex"; };
  document.getElementById("closeSavedBtn").onclick = function() { document.getElementById("savedModal").style.display = "none"; };
  document.getElementById("saveBtn").onclick = doSave;
  document.getElementById("printBtn").onclick = function() { renderReceipt(); window.print(); };
}

window.onload = function() {
  if (!state.invoiceNo) state.invoiceNo = makeNum(invoiceCounter);
  bindEvents();
  syncAll();
};