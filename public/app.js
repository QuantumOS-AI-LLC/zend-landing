// Zend Processing Interactive Calculator Logic

document.addEventListener('DOMContentLoaded', () => {
  // Input elements
  const volumeSlider = document.getElementById('monthly-volume');
  const volumeInput = document.getElementById('volume-val-input');
  const ticketSlider = document.getElementById('avg-ticket');
  const ticketInput = document.getElementById('avg-ticket-input');
  const customPercentInput = document.getElementById('custom-percent');
  const customCentsInput = document.getElementById('custom-cents');
  
  // Display elements
  const txCountText = document.getElementById('calc-tx-count');
  const debitCountText = document.getElementById('calc-debit-count');
  
  const savingsAmountText = document.getElementById('savings-amount');
  const annualSavingsText = document.getElementById('annual-savings');
  
  // Competitor cards
  const competitorCards = document.querySelectorAll('.competitor-card');
  const customRatePanel = document.getElementById('custom-rate-panel');
  
  // Chart elements
  const competitorBar = document.getElementById('chart-competitor-bar');
  const competitorValText = document.getElementById('chart-competitor-val');
  const zendBar = document.getElementById('chart-zend-bar');
  const zendValText = document.getElementById('chart-zend-val');
  
  // Form elements
  // const contactForm = document.getElementById('contact-form');
  // const formSuccessMsg = document.getElementById('form-success-msg');

  // State variables
  let currentProcessor = 'square'; // default
  let currentSavings = 0;
  let animationFrameId = null;

  // Helper: Format Currency
  function formatCurrency(val, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    }).format(val);
  }

  // Easing/Animation function for the main savings number
  function animateSavings(targetVal) {
    let startVal = currentSavings;
    const duration = 400; // ms
    const startTime = performance.now();

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    function updateNumber(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutQuad
      const easeProgress = progress * (2 - progress);
      const current = startVal + (targetVal - startVal) * easeProgress;
      
      savingsAmountText.textContent = Math.round(current).toLocaleString();
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateNumber);
      } else {
        currentSavings = targetVal;
        savingsAmountText.textContent = Math.round(targetVal).toLocaleString();
      }
    }

    animationFrameId = requestAnimationFrame(updateNumber);
  }

  // Primary Calculation Logic
  function calculate() {
    const volume = parseFloat(volumeSlider.value);
    const avgTicket = parseFloat(ticketSlider.value);
    
    // Synchronize inputs if they don't match (prevents loops while typing/sliding)
    if (document.activeElement !== volumeInput && parseFloat(volumeInput.value) !== volume) {
      volumeInput.value = volume;
    }
    if (document.activeElement !== ticketInput && parseFloat(ticketInput.value) !== avgTicket) {
      ticketInput.value = avgTicket;
    }
    
    // Calculate total transactions (prevent division by zero if avgTicket is 0)
    const totalTransactions = avgTicket > 0 ? Math.round(volume / avgTicket) : 0;
    txCountText.textContent = totalTransactions.toLocaleString();
    
    // Debit vs Credit splits (85% debit / 15% credit)
    const debitTransactions = Math.round(totalTransactions * 0.85);
    debitCountText.textContent = debitTransactions.toLocaleString();
    
    const debitVolume = volume * 0.85;
    const creditVolume = volume * 0.15;
    
    // Zend Fee Calculation
    // Debit: 1.25% + 25 cents
    const zendDebitFee = (debitVolume * 0.0125) + (debitTransactions * 0.25);
    // Credit: 1.5% flat (no per-tx fee)
    const zendCreditFee = (creditVolume * 0.015);
    const zendTotalFee = zendDebitFee + zendCreditFee;
    
    // Competitor Fee Calculation
    let compRate = 0.029; // 2.9% default
    let compPerTxFee = 0.30; // 30 cents default
    
    if (currentProcessor === 'square' || currentProcessor === 'stripe') {
      compRate = 0.029;
      compPerTxFee = 0.30;
    } else if (currentProcessor === 'custom') {
      compRate = parseFloat(customPercentInput.value) / 100 || 0;
      compPerTxFee = parseFloat(customCentsInput.value) / 100 || 0;
    }
    
    const competitorTotalFee = (volume * compRate) + (totalTransactions * compPerTxFee);
    
    // Savings calculations
    const monthlySavings = Math.max(0, competitorTotalFee - zendTotalFee);
    const annualSavings = monthlySavings * 12;
    
    // Update values in UI
    animateSavings(monthlySavings);
    annualSavingsText.textContent = formatCurrency(annualSavings);
    
    // Update SVG Chart
    const maxBarWidth = 280; // from the viewBox layout (80 to 360)
    let compBarWidth = maxBarWidth;
    let zendBarWidth = 0;
    
    if (competitorTotalFee > 0) {
      zendBarWidth = (zendTotalFee / competitorTotalFee) * maxBarWidth;
      // Clamp values
      zendBarWidth = Math.max(10, Math.min(maxBarWidth, zendBarWidth));
    }
    
    competitorBar.setAttribute('width', compBarWidth);
    competitorValText.textContent = formatCurrency(competitorTotalFee, 2);
    // Position text inside the bar or shift if width is too narrow
    competitorValText.setAttribute('x', 150);
    
    zendBar.setAttribute('width', zendBarWidth);
    zendValText.textContent = formatCurrency(zendTotalFee, 2);
    
    // Keep text visible: if bar is too short, display value to the right of the bar
    if (zendBarWidth < 70) {
      zendValText.setAttribute('x', zendBarWidth + 150);
      zendValText.setAttribute('fill', '#10B981');
    } else {
      zendValText.setAttribute('x', 150);
      zendValText.setAttribute('fill', '#FFFFFF');
    }
  }

  // Slider Event Listeners
  volumeSlider.addEventListener('input', calculate);
  ticketSlider.addEventListener('input', calculate);

  // Input Box Event Listeners (direct typing)
  volumeInput.addEventListener('input', () => {
    let val = parseFloat(volumeInput.value) || 0;
    val = Math.max(0, Math.min(250000, val));
    volumeSlider.value = val;
    calculate();
  });

  ticketInput.addEventListener('input', () => {
    let val = parseFloat(ticketInput.value) || 0;
    val = Math.max(0, Math.min(25000, val));
    ticketSlider.value = val;
    calculate();
  });
  
  // Custom inputs Event Listeners
  customPercentInput.addEventListener('input', calculate);
  customCentsInput.addEventListener('input', calculate);

  // Competitor Card Toggle
  competitorCards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove active from all
      competitorCards.forEach(c => c.classList.remove('active'));
      // Add active to clicked
      card.classList.add('active');
      
      currentProcessor = card.getAttribute('data-processor');
      
      // Toggle custom rates panel
      if (currentProcessor === 'custom') {
        customRatePanel.classList.remove('hidden');
      } else {
        customRatePanel.classList.add('hidden');
      }
      
      calculate();
    });
  });

  // Contact Form Submit Handler
  // if (contactForm) {
  //   contactForm.addEventListener('submit', (e) => {
  //     e.preventDefault();
      
  //     const contactName = document.getElementById('contact-name').value;
  //     const businessName = document.getElementById('business-name').value;
  //     const phone = document.getElementById('contact-phone').value;
  //     const email = document.getElementById('contact-email').value;
      
  //     const submitBtn = contactForm.querySelector('button[type="submit"]');
  //     const originalBtnText = submitBtn.textContent;
  //     submitBtn.disabled = true;
  //     submitBtn.textContent = 'Securing Rates...';

  //     fetch('/api/leads', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         name: contactName,
  //         business: businessName,
  //         phone: phone,
  //         email: email,
  //         volume: parseFloat(volumeSlider.value),
  //         ticketSize: parseFloat(ticketSlider.value),
  //         savings: currentSavings
  //       })
  //     })
  //     .then(response => response.json())
  //     .then(data => {
  //       console.log('[Lead Captured Server Output]:', data);
        
  //       // Populate success elements
  //       document.getElementById('success-biz-name').textContent = businessName;
  //       document.getElementById('success-contact-name').textContent = contactName;
  //       document.getElementById('success-volume-val').textContent = formatCurrency(parseFloat(volumeSlider.value));
  //       document.getElementById('success-ticket-val').textContent = formatCurrency(parseFloat(ticketSlider.value));
  //       document.getElementById('success-savings-val').textContent = formatCurrency(currentSavings) + "/mo";
  //       document.getElementById('success-phone-val').textContent = phone;

  //       // Hide form, show custom success message
  //       contactForm.classList.add('hidden');
  //       formSuccessMsg.classList.remove('hidden');
  //     })
  //     .catch(err => {
  //       console.error('[Lead Submit Error]:', err);
  //       // Fallback to show success message for demo/testing
  //       document.getElementById('success-biz-name').textContent = businessName;
  //       document.getElementById('success-contact-name').textContent = contactName;
  //       document.getElementById('success-volume-val').textContent = formatCurrency(parseFloat(volumeSlider.value));
  //       document.getElementById('success-ticket-val').textContent = formatCurrency(parseFloat(ticketSlider.value));
  //       document.getElementById('success-savings-val').textContent = formatCurrency(currentSavings) + "/mo";
  //       document.getElementById('success-phone-val').textContent = phone;

  //       contactForm.classList.add('hidden');
  //       formSuccessMsg.classList.remove('hidden');
  //     })
  //     .finally(() => {
  //       submitBtn.disabled = false;
  //       submitBtn.textContent = originalBtnText;
  //     });
  //   });
  // }


  document.querySelectorAll(".contact-form").forEach((contactForm) => {

    contactForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const wrapper = contactForm.closest(".form-max-width");

        const contactName = contactForm.querySelector(".contact-name").value;
        const businessName = contactForm.querySelector(".business-name").value;
        const phone = contactForm.querySelector(".contact-phone").value;
        const email = contactForm.querySelector(".contact-email").value;

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = "Securing Rates...";

        fetch("/api/leads", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: contactName,
                business: businessName,
                phone: phone,
                email: email,
                volume: parseFloat(volumeSlider.value),
                ticketSize: parseFloat(ticketSlider.value),
                savings: currentSavings
            })
        })
        .then(res => res.json())
        .then(() => {

            showSuccess();

        })
        .catch(err => {

            console.error(err);

            // Demo fallback
            showSuccess();

        })
        .finally(() => {

            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;

        });

        function showSuccess() {

            wrapper.querySelector(".success-biz-name").textContent = businessName;
            wrapper.querySelector(".success-contact-name").textContent = contactName;
            wrapper.querySelector(".success-volume-val").textContent = formatCurrency(parseFloat(volumeSlider.value));
            wrapper.querySelector(".success-ticket-val").textContent = formatCurrency(parseFloat(ticketSlider.value));
            wrapper.querySelector(".success-savings-val").textContent = formatCurrency(currentSavings) + "/mo";
            wrapper.querySelector(".success-phone-val").textContent = phone;

            contactForm.classList.add("hidden");
            wrapper.querySelector(".form-success").classList.remove("hidden");

        }
      });
  });

  document.querySelectorAll(".menu_toggle_btn").forEach((btn) => {
      btn.addEventListener("click", () => {
          document.body.classList.toggle("show__menu");
      });
  });

  // Initial Calculation
  calculate();
});
