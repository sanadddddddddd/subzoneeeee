const STORAGE_KEY = "subzone-records-v1";

const seedRecords = [
  {
    id: "seed-1",
    customerName: "عميل تجريبي",
    phone: "0912345678",
    warrantyCode: "SZ-4821",
    service: "Netflix Premium",
    accountIdentifier: "SUB-ACC-2049",
    accountSecret: "email@example.com / Pass-2030 / PIN: 8221",
    purchaseDate: "2026-04-23",
    warrantyUntil: "2026-05-23",
    status: "نشط",
    notes: "هذا سجل تجريبي لتوضيح طريقة العمل."
  }
];

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRecords));
    return [...seedRecords];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...seedRecords];
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRecords));
    return [...seedRecords];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function generateWarrantyCode() {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SZ-${randomPart}`;
}

function isoDateWithOffset(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return "غير محدد";
  }

  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function attachPointerGlow(selector) {
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((node) => {
    node.addEventListener("pointermove", (event) => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty("--pointer-x", `${x}%`);
      node.style.setProperty("--pointer-y", `${y}%`);
    });
  });
}

function initScrollControls() {
  const scrollTopButton = document.createElement("button");
  scrollTopButton.type = "button";
  scrollTopButton.className = "scroll-top-button";
  scrollTopButton.setAttribute("aria-label", "العودة إلى أعلى الصفحة");
  scrollTopButton.textContent = "↑";
  document.body.appendChild(scrollTopButton);

  const toggleScrollButton = () => {
    scrollTopButton.classList.toggle("visible", window.scrollY > 260);
  };

  window.addEventListener("scroll", toggleScrollButton, { passive: true });
  toggleScrollButton();

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.getAttribute("data-scroll-target"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  attachPointerGlow(".scroll-top-button");
}

function initPortalPage() {
  const form = document.getElementById("portal-form");
  if (!form) {
    return;
  }

  const feedback = document.getElementById("portal-feedback");
  const emptyState = document.getElementById("empty-state");
  const customerCard = document.getElementById("customer-card");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const phone = normalizePhone(document.getElementById("phone").value);
    const warrantyCode = document.getElementById("warrantyCode").value.trim().toUpperCase();
    const records = loadRecords();
    const record = records.find((item) =>
      normalizePhone(item.phone) === phone &&
      String(item.warrantyCode).trim().toUpperCase() === warrantyCode
    );

    if (!record) {
      feedback.textContent = "ما لقيناش سجل مطابق. راجع رقم الهاتف وكود الضمان.";
      customerCard.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    feedback.textContent = "تم العثور على السجل بنجاح.";
    emptyState.classList.add("hidden");
    customerCard.classList.remove("hidden");

    setText("customerName", record.customerName);
    setText("recordStatus", record.status || "نشط");
    setText("serviceType", record.service || "-");
    setText("customerPhone", record.phone || "-");
    setText("customerCode", record.warrantyCode || "-");
    setText("purchaseDate", formatDate(record.purchaseDate));
    setText("warrantyUntil", formatDate(record.warrantyUntil));
    setText("accountIdentifier", record.accountIdentifier || "-");
    setText("accountSecret", record.accountSecret || "-");
    setText("recordNotes", record.notes || "لا توجد ملاحظات.");
  });
}

function initAdminPage() {
  const form = document.getElementById("admin-form");
  if (!form) {
    return;
  }

  const feedback = document.getElementById("admin-feedback");
  const recordsBody = document.getElementById("recordsBody");
  const searchInput = document.getElementById("searchRecords");
  const generateCodeButton = document.getElementById("generateCode");
  const resetButton = document.getElementById("resetForm");

  const fields = {
    recordId: document.getElementById("recordId"),
    customerName: document.getElementById("customerNameInput"),
    phone: document.getElementById("phoneInput"),
    warrantyCode: document.getElementById("warrantyCodeInput"),
    service: document.getElementById("serviceInput"),
    accountIdentifier: document.getElementById("accountIdentifierInput"),
    accountSecret: document.getElementById("accountSecretInput"),
    purchaseDate: document.getElementById("purchaseDateInput"),
    warrantyUntil: document.getElementById("warrantyUntilInput"),
    status: document.getElementById("statusInput"),
    notes: document.getElementById("notesInput")
  };

  function resetForm(message = "النموذج جاهز لإضافة عميل جديد.") {
    form.reset();
    fields.recordId.value = "";
    fields.warrantyCode.value = generateWarrantyCode();
    fields.purchaseDate.value = isoDateWithOffset(0);
    fields.warrantyUntil.value = isoDateWithOffset(30);
    feedback.textContent = message;
  }

  function fillForm(record) {
    fields.recordId.value = record.id;
    fields.customerName.value = record.customerName || "";
    fields.phone.value = record.phone || "";
    fields.warrantyCode.value = record.warrantyCode || "";
    fields.service.value = record.service || "";
    fields.accountIdentifier.value = record.accountIdentifier || "";
    fields.accountSecret.value = record.accountSecret || "";
    fields.purchaseDate.value = record.purchaseDate || "";
    fields.warrantyUntil.value = record.warrantyUntil || "";
    fields.status.value = record.status || "نشط";
    fields.notes.value = record.notes || "";
    feedback.textContent = `أنت الآن تعدّل سجل ${record.customerName}.`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderRecords(filterText = "") {
    const records = loadRecords();
    const query = filterText.trim().toLowerCase();
    const visibleRecords = records.filter((record) => {
      if (!query) {
        return true;
      }

      return [
        record.customerName,
        record.phone,
        record.warrantyCode,
        record.service,
        record.accountIdentifier
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    if (!visibleRecords.length) {
      recordsBody.innerHTML = `
        <tr>
          <td colspan="6">لا توجد نتائج مطابقة.</td>
        </tr>
      `;
      return;
    }

    recordsBody.innerHTML = visibleRecords.map((record) => `
      <tr>
        <td>${escapeHtml(record.customerName)}</td>
        <td>${escapeHtml(record.phone)}</td>
        <td>${escapeHtml(record.warrantyCode)}</td>
        <td>${escapeHtml(record.service)}</td>
        <td>${escapeHtml(formatDate(record.warrantyUntil))}</td>
        <td>
          <div class="table-actions">
            <button class="action-button" type="button" data-action="edit" data-id="${escapeHtml(record.id)}">تعديل</button>
            <button class="action-button" type="button" data-action="delete" data-id="${escapeHtml(record.id)}">حذف</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const records = loadRecords();
    const payload = {
      id: fields.recordId.value || `record-${Date.now()}`,
      customerName: fields.customerName.value.trim(),
      phone: normalizePhone(fields.phone.value),
      warrantyCode: fields.warrantyCode.value.trim().toUpperCase(),
      service: fields.service.value.trim(),
      accountIdentifier: fields.accountIdentifier.value.trim(),
      accountSecret: fields.accountSecret.value.trim(),
      purchaseDate: fields.purchaseDate.value,
      warrantyUntil: fields.warrantyUntil.value,
      status: fields.status.value,
      notes: fields.notes.value.trim()
    };

    const duplicated = records.find((record) =>
      record.id !== payload.id &&
      normalizePhone(record.phone) === payload.phone &&
      String(record.warrantyCode).trim().toUpperCase() === payload.warrantyCode
    );

    if (duplicated) {
      feedback.textContent = "فيه سجل آخر بنفس رقم الهاتف وكود الضمان. غيّر واحد منهم قبل الحفظ.";
      return;
    }

    const existingIndex = records.findIndex((record) => record.id === payload.id);

    if (existingIndex >= 0) {
      records[existingIndex] = payload;
      saveRecords(records);
      renderRecords(searchInput.value);
      resetForm("تم تحديث السجل بنجاح.");
    } else {
      records.unshift(payload);
      saveRecords(records);
      renderRecords(searchInput.value);
      resetForm("تمت إضافة السجل بنجاح.");
    }
  });

  generateCodeButton.addEventListener("click", () => {
    fields.warrantyCode.value = generateWarrantyCode();
  });

  resetButton.addEventListener("click", () => {
    resetForm();
  });

  searchInput.addEventListener("input", () => {
    renderRecords(searchInput.value);
  });

  recordsBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const recordId = target.dataset.id;
    if (!action || !recordId) {
      return;
    }

    const records = loadRecords();
    const record = records.find((item) => item.id === recordId);
    if (!record) {
      return;
    }

    if (action === "edit") {
      fillForm(record);
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(`هل تريد حذف سجل ${record.customerName}؟`);
      if (!confirmed) {
        return;
      }

      const nextRecords = records.filter((item) => item.id !== recordId);
      saveRecords(nextRecords);
      renderRecords(searchInput.value);
      feedback.textContent = "تم حذف السجل.";

      if (fields.recordId.value === recordId) {
        resetForm();
      }
    }
  });

  resetForm();
  renderRecords();
}

attachPointerGlow(".primary-button, .secondary-button, .action-button, .topnav a, .scroll-cue");
initScrollControls();
initPortalPage();
initAdminPage();
