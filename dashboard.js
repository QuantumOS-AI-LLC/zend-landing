// Zend Operations Dashboard & CRM Logic

document.addEventListener('DOMContentLoaded', () => {
  
  // --- STATE VARIABLES ---
  let debitRatio = 0.85; // default 85%
  let baseGrossSales = 42500;
  
  let expenses = [
    { id: 1, name: 'Employee Payroll', amount: 18500 },
    { id: 2, name: 'Office Rent & Utilities', amount: 3500 },
    { id: 3, name: 'Advertising & Marketing', amount: 3000 }
  ];

  let invoices = [
    { id: 1, customer: 'Sarah Jenkins', phone: '5550100001', item: 'Logo Retouch', amount: 450, due: '2026-06-10', status: 'Paid' },
    { id: 2, customer: 'Marcus Thorne', phone: '5550100002', item: 'Marketing Funnel Setup', amount: 1200, due: '2026-06-15', status: 'Sent' },
    { id: 3, customer: 'David Kim', phone: '5550100004', item: 'CRM Integration Service', amount: 800, due: '2026-05-25', status: 'Overdue' }
  ];

  let smsLog = [
    { 
      type: 'received', 
      text: 'Hi Sarah! Your invoice from Reflection Co is ready. The total is $450.00. You can pay securely here: znd.pay/i/7812B',
      timestamp: '2026-05-27 10:14 AM'
    },
    { 
      type: 'sent', 
      text: 'Done! Card processed on my phone. Very simple.',
      timestamp: '2026-05-27 10:18 AM'
    },
    { 
      type: 'confirmation', 
      text: '⚡ Payment Approved! Receipt #1098 has been sent. Thank you!',
      timestamp: '2026-05-27 10:18 AM'
    }
  ];

  // --- DOM SELECTORS ---
  
  // Tabs
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const pageTitle = document.getElementById('page-title');
  
  // P&L Cards
  const kpiGrossText = document.getElementById('kpi-gross');
  const kpiFeesText = document.getElementById('kpi-fees');
  const kpiExpensesText = document.getElementById('kpi-expenses');
  const kpiNetText = document.getElementById('kpi-net');
  const netMarginPctText = document.getElementById('net-margin-pct');
  const netMarginBar = document.getElementById('net-margin-bar');
  const topSavingsBanner = document.getElementById('top-savings-banner');
  
  // P&L Expense Worksheet
  const expenseTbody = document.getElementById('expense-tbody');
  const addExpenseForm = document.getElementById('add-expense-form');
  const expenseNameInput = document.getElementById('expense-name');
  const expenseAmountInput = document.getElementById('expense-amount');
  
  // P&L Efficiency Graphics
  const legacyFeeValText = document.getElementById('legacy-fee-value');
  const zendFeeValText = document.getElementById('zend-fee-value');
  const zendEfficiencyFill = document.getElementById('zend-efficiency-fill');
  const savingsPctLabel = document.getElementById('savings-percentage-label');
  
  // CRM Invoices
  const invoiceTbody = document.getElementById('invoice-tbody');
  const btnTriggerInvoiceModal = document.getElementById('btn-trigger-invoice-modal');
  const invoiceModal = document.getElementById('invoice-modal');
  const btnCloseInvoiceModal = document.getElementById('btn-close-invoice-modal');
  const btnCancelInvoiceModal = document.getElementById('btn-cancel-invoice-modal');
  const createInvoiceForm = document.getElementById('create-invoice-form');
  const toastMessage = document.getElementById('toast-message');
  
  // CRM SMS Log
  const dashboardSmsFeed = document.getElementById('dashboard-sms-feed');
  
  // Settings
  const debitRatioSetting = document.getElementById('debit-ratio-setting');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  // Helper: Format Currency
  function formatCurrency(val, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    }).format(val);
  }

  // Helper: Show Toast Alert
  function showToast(message) {
    toastMessage.textContent = message;
    toastMessage.classList.remove('hidden');
    setTimeout(() => {
      toastMessage.classList.add('hidden');
    }, 3000);
  }

  // --- TAB NAVIGATION ---
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate active states
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Activate clicked
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
      
      // Update Page Title
      if (targetId === 'pl-section') {
        pageTitle.textContent = 'P&L Operations Dashboard';
      } else if (targetId === 'crm-section') {
        pageTitle.textContent = 'CRM & Automated Invoicing';
      } else if (targetId === 'settings-section') {
        pageTitle.textContent = 'Gateway Credentials';
      }
    });
  });

  // --- MATHEMATICAL OPERATIONS ENGINE ---
  function updatePLStats() {
    // 1. Calculate Gross Sales
    // We add the values of all "Paid" invoices to our base gross revenue
    let additionalSales = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const grossSales = baseGrossSales + additionalSales;
    kpiGrossText.textContent = Math.round(grossSales).toLocaleString();
    
    // 2. Processing Fees Math
    // Let's assume an average ticket size of $35
    const avgTicket = 35;
    const totalTransactions = Math.round(grossSales / avgTicket);
    
    // Debit vs Credit ratios (Debit is variable based on Settings)
    const debitVol = grossSales * debitRatio;
    const creditVol = grossSales * (1 - debitRatio);
    const debitTransactions = Math.round(totalTransactions * debitRatio);
    
    // Zend Fee
    const zendDebitFee = (debitVol * 0.0125) + (debitTransactions * 0.25);
    const zendCreditFee = (creditVol * 0.0150);
    const zendTotalFee = zendDebitFee + zendCreditFee;
    
    kpiFeesText.textContent = Math.round(zendTotalFee).toLocaleString();
    
    // Competitor Fee (Square/Stripe at 2.9% + 30¢)
    const competitorTotalFee = (grossSales * 0.029) + (totalTransactions * 0.30);
    const monthlySavings = Math.max(0, competitorTotalFee - zendTotalFee);
    topSavingsBanner.textContent = `+${formatCurrency(monthlySavings)} / mo`;
    
    // 3. Operating Expenses Math
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    kpiExpensesText.textContent = totalExpenses.toLocaleString();
    
    // 4. Net Profit & Margin
    const netProfit = grossSales - zendTotalFee - totalExpenses;
    kpiNetText.textContent = Math.round(netProfit).toLocaleString();
    
    let netMargin = 0;
    if (grossSales > 0) {
      netMargin = (netProfit / grossSales) * 100;
    }
    netMarginPctText.textContent = `${netMargin.toFixed(1)}%`;
    netMarginBar.style.width = `${Math.max(0, Math.min(100, netMargin))}%`;
    
    // 5. Efficiency graphics panel
    legacyFeeValText.textContent = formatCurrency(competitorTotalFee, 2);
    zendFeeValText.textContent = formatCurrency(zendTotalFee, 2);
    
    let efficiencyRatio = 100;
    if (competitorTotalFee > 0) {
      efficiencyRatio = (zendTotalFee / competitorTotalFee) * 100;
    }
    zendEfficiencyFill.style.width = `${efficiencyRatio.toFixed(0)}%`;
    
    let savingsPct = 100 - efficiencyRatio;
    savingsPctLabel.textContent = `${savingsPct.toFixed(1)}% Saved`;
  }

  // --- EXPENSE WORKSHEET RENDER ---
  function renderExpenses() {
    expenseTbody.innerHTML = '';
    expenses.forEach(exp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${exp.name}</td>
        <td class="text-right">${formatCurrency(exp.amount)}</td>
        <td class="text-center">
          <button class="btn-delete" data-id="${exp.id}">×</button>
        </td>
      `;
      expenseTbody.appendChild(tr);
    });
    
    // Bind Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.getAttribute('data-id'));
        expenses = expenses.filter(exp => exp.id !== id);
        renderExpenses();
        updatePLStats();
      });
    });
  }

  // Add Operating Expense Form
  addExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    
    if (name && amount > 0) {
      const nextId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
      expenses.push({ id: nextId, name, amount });
      
      expenseNameInput.value = '';
      expenseAmountInput.value = '';
      
      renderExpenses();
      updatePLStats();
      showToast('Expense Item Added!');
    }
  });

  // --- CRM INVOICES & CLIENTS TABLE ---
  function renderInvoices() {
    invoiceTbody.innerHTML = '';
    invoices.forEach(inv => {
      const tr = document.createElement('tr');
      
      // Determine badge class
      let badgeClass = 'badge-sent';
      if (inv.status === 'Paid') badgeClass = 'badge-paid';
      if (inv.status === 'Overdue') badgeClass = 'badge-overdue';
      
      let operationsHtml = '';
      if (inv.status !== 'Paid') {
        operationsHtml = `
          <button class="btn btn-secondary btn-sm btn-record-pay" data-id="${inv.id}">Mark Paid</button>
          <button class="btn btn-outline btn-sm btn-send-reminder" data-id="${inv.id}">Send SMS</button>
        `;
      } else {
        operationsHtml = `<span class="text-muted" style="font-size: 11px; font-weight: 700;">TRANSACTION CLEARED</span>`;
      }
      
      tr.innerHTML = `
        <td>
          <div style="font-weight: 700; color: #fff;">${inv.customer}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${inv.phone}</div>
        </td>
        <td>${inv.item}</td>
        <td>${formatCurrency(inv.amount)}</td>
        <td>${inv.due}</td>
        <td><span class="badge ${badgeClass}">${inv.status}</span></td>
        <td class="text-center" style="display: flex; gap: 8px; justify-content: center; align-items: center; min-height: 52px;">
          ${operationsHtml}
        </td>
      `;
      invoiceTbody.appendChild(tr);
    });
    
    // Bind mark paid
    document.querySelectorAll('.btn-record-pay').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        recordPayment(id);
      });
    });
    
    // Bind send reminder
    document.querySelectorAll('.btn-send-reminder').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        sendReminderSMS(id);
      });
    });
  }

  // Pay invoice handler
  function recordPayment(id) {
    const inv = invoices.find(i => i.id === id);
    if (inv && inv.status !== 'Paid') {
      inv.status = 'Paid';
      
      // Push simulator SMS messages
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      smsLog.push({
        type: 'sent',
        text: `Logged a manual credit card payment of $${inv.amount.toFixed(2)} for invoice.`,
        timestamp: timeStr
      });
      smsLog.push({
        type: 'confirmation',
        text: `⚡ Zend Gateway: Invoice cleared. Customer ${inv.customer} payment of $${inv.amount.toFixed(2)} recorded in gross revenue.`,
        timestamp: timeStr
      });
      
      renderInvoices();
      renderSmsFeed();
      updatePLStats();
      showToast(`Payment of $${inv.amount} Recorded!`);
    }
  }

  // Send reminder SMS
  function sendReminderSMS(id) {
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      smsLog.push({
        type: 'received',
        text: `⚠️ URGENT REMINDER: Your invoice from Reflection Co of $${inv.amount.toFixed(2)} for ${inv.item} is overdue. Pay immediately to avoid processing locks: znd.pay/i/${Math.random().toString(36).substring(7).toUpperCase()}`,
        timestamp: timeStr
      });
      
      renderSmsFeed();
      showToast(`Reminder SMS Sent to ${inv.customer}!`);
    }
  }

  // --- CRM SMS LOG SIMULATOR ---
  function renderSmsFeed() {
    dashboardSmsFeed.innerHTML = '';
    smsLog.forEach(sms => {
      const feedBlock = document.createElement('div');
      feedBlock.className = `sms-feed-block ${sms.type === 'sent' ? 'sent' : 'received'} ${sms.type === 'confirmation' ? 'success' : ''}`;
      
      let bubbleClass = 'sms-bubble-received';
      if (sms.type === 'sent') bubbleClass = 'sms-bubble-sent';
      
      feedBlock.innerHTML = `
        <div class="${bubbleClass}">
          ${sms.text}
        </div>
        <span class="sms-timestamp">${sms.timestamp}</span>
      `;
      dashboardSmsFeed.appendChild(feedBlock);
    });
    
    // Auto scroll SMS feed to bottom
    dashboardSmsFeed.scrollTop = dashboardSmsFeed.scrollHeight;
  }

  // --- INVOICE CREATION MODAL HANDLERS ---
  
  // Show Modal
  btnTriggerInvoiceModal.addEventListener('click', () => {
    invoiceModal.classList.remove('hidden');
  });
  
  // Hide Modal
  function hideModal() {
    invoiceModal.classList.add('hidden');
    createInvoiceForm.reset();
  }
  
  btnCloseInvoiceModal.addEventListener('click', hideModal);
  btnCancelInvoiceModal.addEventListener('click', hideModal);
  
  // Submit Create Invoice
  createInvoiceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const customer = document.getElementById('inv-customer').value.trim();
    const phone = document.getElementById('inv-phone').value.trim();
    const item = document.getElementById('inv-item').value.trim();
    const amount = parseFloat(document.getElementById('inv-amount').value);
    
    if (customer && phone && item && amount > 0) {
      // Calculate a due date (14 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const dueStr = futureDate.toISOString().slice(0, 10);
      
      const nextId = invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1;
      invoices.push({
        id: nextId,
        customer,
        phone,
        item,
        amount,
        due: dueStr,
        status: 'Sent'
      });
      
      // Dispatch simulated SMS
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      smsLog.push({
        type: 'received',
        text: `Hi ${customer}! Your invoice from Reflection Co for ${item} is ready. Total: $${amount.toFixed(2)}. Pay with credit/debit: znd.pay/i/${Math.random().toString(36).substring(7).toUpperCase()}`,
        timestamp: timeStr
      });
      
      hideModal();
      renderInvoices();
      renderSmsFeed();
      updatePLStats();
      showToast('Invoice Created & Dispatched!');
    }
  });

  // --- CONFIG / GATEWAY SETTINGS ---
  btnSaveSettings.addEventListener('click', () => {
    const ratio = parseFloat(debitRatioSetting.value);
    if (ratio >= 10 && ratio <= 100) {
      debitRatio = ratio / 100;
      updatePLStats();
      showToast(`Gateway Configs Updated (Debit Ratio: ${ratio}%)!`);
    } else {
      alert('Debit ratio must be between 10% and 100%.');
    }
  });

  // --- INITIAL RENDERING ---
  renderExpenses();
  renderInvoices();
  renderSmsFeed();
  updatePLStats();
});
