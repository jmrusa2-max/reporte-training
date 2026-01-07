document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const slides = document.querySelectorAll('.slide');
  const quarterButtons = document.querySelectorAll('.quarter-btn');
  let currentQuarter = 'q2-2026'; // Default quarter
  let charts = {}; // Object to store chart instances

  // --- 1. Navigation between Slides (Tabs) ---
  function showSlide(slideId) {
    slides.forEach(s => s.classList.remove('active'));
    document.getElementById(`slide${slideId}`).classList.add('active');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-slide="${slideId}"]`).classList.add('active');
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const slideId = button.getAttribute('data-slide');
      showSlide(slideId);
    });
  });

  // --- 2. Quarter Selection ---
  quarterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedQuarter = button.getAttribute('data-quarter');
      if (selectedQuarter === currentQuarter) return; // Do nothing if already active

      currentQuarter = selectedQuarter;

      // Update active button style
      quarterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Reload data for the new quarter
      loadQuarterData(currentQuarter);
    });
  });

  // --- 3. Data Loading Logic ---
  
  // New function to load cover data
  function loadCoverData(quarter) {
    const file = `assets/data/${quarter}/slide1.json`;
    fetch(`${file}?v=${new Date().getTime()}`)
      .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok for ${file}`);
        return response.json();
      })
      .then(data => {
        // Update cover image
        const cover = document.querySelector('#slide1 .cover');
        if (cover && data.cover_image) {
          cover.style.backgroundImage = `url('${data.cover_image}')`;
        }

        // Update highlights
        const destacadosSection = document.querySelector('#slide1 .destacados');
        if (destacadosSection && data.highlights) {
          // Clear existing highlights (keeping the h3 title)
          destacadosSection.querySelectorAll('.highlight-card').forEach(card => card.remove());

          // Add new highlights
          data.highlights.forEach(text => {
            const card = document.createElement('div');
            card.className = 'highlight-card';
            const p = document.createElement('p');
            p.innerHTML = text; // Use innerHTML to parse the <strong> tag
            card.appendChild(p);
            destacadosSection.appendChild(card);
          });
        }
      })
      .catch(err => console.error(`Error loading ${file}:`, err));
  }
  
  // Main function to load data for all slides
  function loadQuarterData(quarter) {
    // Load cover data
    loadCoverData(quarter);

    // Config for chart/gallery slides
    const slideConfigs = [
      { slide: '2', id: 'chartSlide2', file: `assets/data/${quarter}/slide2.json`, type: 'bar' },
      { slide: '3', id: 'chartSlide3', file: `assets/data/${quarter}/slide3.json`, type: 'bar' },
      { slide: '4', id: 'chartSlide4', file: `assets/data/${quarter}/slide4.json`, type: 'line' },
      { slide: '5', id: 'chartSlide5', file: `assets/data/${quarter}/slide5.json`, type: 'bar' },
      { slide: '6', id: 'chartSlide6', file: `assets/data/${quarter}/slide6.json`, type: 'bar' }
    ];

    slideConfigs.forEach(config => {
      if (charts[config.id]) {
        charts[config.id].destroy();
      }

      fetch(`${config.file}?v=${new Date().getTime()}`)
        .then(response => {
          if (!response.ok) throw new Error(`Network response was not ok for ${config.file}`);
          return response.json();
        })
        .then(data => {
          // Load Chart
          const ctx = document.getElementById(config.id).getContext('2d');
          charts[config.id] = new Chart(ctx, {
            type: config.type,
            data: { labels: data.labels, datasets: data.datasets },
            options: { // Chart options from your previous version...
              responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, elements: { bar: { borderWidth: 0 } },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true, backgroundColor: 'rgba(255, 255, 255, 0.95)', titleColor: '#003366', bodyColor: '#333', borderColor: '#e0e0e0', borderWidth: 1, cornerRadius: 6, padding: 10, usePointStyle: true },
                datalabels: { anchor: 'center', align: 'top', color: '#fff', font: { weight: 'bold', size: 12, family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }, formatter: Math.round, backgroundColor: context => context.dataset.backgroundColor[context.dataIndex], borderRadius: 4, padding: 4, opacity: 0.9 }
              },
              scales: {
                y: { beginAtZero: true, ticks: { precision: 0, font: { size: 12, family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", weight: 'bold' }, color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)', lineWidth: 1 } },
                x: { ticks: { font: { size: 12, family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", weight: 'bold' }, color: '#ffffff' }, grid: { display: false } }
              },
              interaction: { intersect: false, mode: 'index' }, hover: { mode: 'nearest', intersect: true }
            }
          });

          // Load Gallery Images
          const gallery = document.querySelector(`#slide${config.slide} .gallery`);
          if (gallery) {
            gallery.innerHTML = '';
            if (data.gallery_images && Array.isArray(data.gallery_images)) {
              data.gallery_images.forEach((imgPath, index) => {
                const img = document.createElement('img');
                img.src = imgPath;
                img.alt = `Foto ${index + 1}`;
                gallery.appendChild(img);
              });
              setupModalForGallery();
            }
          }

          // Update footnote text
          const footnote = document.querySelector(`#slide${config.slide} .footnote`);
          if (footnote && data.footnote) {
            footnote.innerHTML = data.footnote;
          } else if (footnote) {
            // Clear the footnote if the new data doesn't have one, to avoid showing stale text
            footnote.innerHTML = '';
          }
        })
        .catch(err => console.error(`Error loading ${config.file}:`, err));
    });
  }

  // --- 4. Image Modal Popup ---
  function setupModalForGallery() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.close');

    document.querySelectorAll('.gallery img').forEach(img => {
      const newImg = img.cloneNode(true);
      img.parentNode.replaceChild(newImg, img);
      newImg.addEventListener('click', () => {
        modal.style.display = "flex";
        modalImg.src = newImg.src;
      });
    });

    closeBtn.addEventListener('click', () => modal.style.display = "none");
    window.addEventListener('click', (event) => {
      if (event.target == modal) modal.style.display = "none";
    });
  }

  // --- Initial Load ---
  loadQuarterData(currentQuarter);
});