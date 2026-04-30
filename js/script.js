document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const slides = document.querySelectorAll('.slide');
  const quarterButtons = document.querySelectorAll('.quarter-btn');
  
  // Define available quarters and set the latest as default
  const QUARTERS = ['q2-2026', 'q3-2026', 'q4-2026', 'fy-2026'];
  let currentQuarter = 'fy-2026'; // Default to last quarterly
  let charts = {}; // Object to store chart instances

  // --- Helper: Check if current quarter is FY ---
  function isFY(quarter) {
    return quarter.startsWith('fy-');
  }

  // --- Toggle FY-only vs Quarter-only tabs ---
  function updateTabsVisibility(quarter) {
    const fyTabs = document.querySelectorAll('.tab-fy-only');
    const quarterTabs = document.querySelectorAll('.tab-quarter-only');

    if (isFY(quarter)) {
      fyTabs.forEach(tab => tab.style.display = '');
      quarterTabs.forEach(tab => tab.style.display = 'none');
    } else {
      fyTabs.forEach(tab => tab.style.display = 'none');
      quarterTabs.forEach(tab => tab.style.display = '');
    }
  }

  // --- 1. Navigation between Slides (Tabs) ---
  function showSlide(slideId) {
    slides.forEach(s => s.classList.remove('active'));
    // Support both numeric IDs (slide1, slide2...) and named IDs (slideAcciones, slideDesarrollos)
    const targetSlide = document.getElementById(`slide${slideId}`) || document.getElementById(`slide${slideId.charAt(0).toUpperCase() + slideId.slice(1)}`);
    if (targetSlide) {
      targetSlide.classList.add('active');
    }
    tabButtons.forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`[data-slide="${slideId}"]`);
    if (targetBtn) {
      targetBtn.classList.add('active');
    }
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

      // Update tab visibility
      updateTabsVisibility(currentQuarter);

      // Reset to first slide (Portada)
      showSlide('1');

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
          
          if (isFY(quarter)) {
            cover.style.height = 'auto';
            cover.style.aspectRatio = '2/1';
          } else {
            cover.style.height = '';
            cover.style.aspectRatio = '';
          }
          
          cover.style.backgroundPosition = '';
          cover.style.backgroundSize = '';
          cover.style.backgroundRepeat = '';
        }

        // Update title text for Destacados
        const destacadosTitle = document.querySelector('#slide1 .destacados h3');
        if (destacadosTitle) {
          destacadosTitle.innerHTML = isFY(quarter) ? '✨ Destacados del Año' : '✨ Destacados del Trimestre';
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

  // --- Load Acciones Destacadas ---
  function loadAccionesData(quarter) {
    const file = `assets/data/${quarter}/slide-acciones.json`;
    fetch(`${file}?v=${new Date().getTime()}`)
      .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok for ${file}`);
        return response.json();
      })
      .then(data => {
        const grid = document.querySelector('#slideAcciones .acciones-grid');
        if (grid) {
          grid.innerHTML = '';
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item, index) => {
              const div = document.createElement('div');
              div.className = 'accion-item';

              const img = document.createElement('img');
              img.src = item.image;
              img.alt = item.label || `Acción ${index + 1}`;

              div.appendChild(img);
              
              if (item.label) {
                const label = document.createElement('span');
                label.className = 'accion-label';
                label.textContent = item.label;
                div.appendChild(label);
              }
              
              grid.appendChild(div);
            });
            setupModalForImages('#slideAcciones .accion-item img');
          }
        }

        // Update footnote
        const footnote = document.querySelector('#slideAcciones .footnote');
        if (footnote && data.footnote) {
          footnote.innerHTML = data.footnote;
        } else if (footnote) {
          footnote.innerHTML = '';
        }
      })
      .catch(err => console.error(`Error loading ${file}:`, err));
  }

  // --- Load Desarrollos Destacados ---
  function loadDesarrollosData(quarter) {
    const file = `assets/data/${quarter}/slide-desarrollos.json`;
    fetch(`${file}?v=${new Date().getTime()}`)
      .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok for ${file}`);
        return response.json();
      })
      .then(data => {
        const grid = document.querySelector('#slideDesarrollos .desarrollos-grid');
        if (grid) {
          grid.innerHTML = '';
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item, index) => {
              const div = document.createElement('div');
              div.className = 'desarrollo-item';

              const img = document.createElement('img');
              img.src = item.image;
              img.alt = `Desarrollo ${index + 1}`;

              const p = document.createElement('p');
              p.className = 'footnote';
              p.style.marginTop = '20px';
              p.style.marginBottom = '0';
              p.innerHTML = item.text || '';

              div.appendChild(img);
              div.appendChild(p);
              grid.appendChild(div);
            });
            setupModalForImages('#slideDesarrollos .desarrollo-item img');
          }
        }
      })
      .catch(err => console.error(`Error loading ${file}:`, err));
  }
  
  // Main function to load data for all slides
  function loadQuarterData(quarter) {
    // Load cover data
    loadCoverData(quarter);

    // Determine which chart slides to load based on quarter type
    const slideConfigs = [];

    // Slides 2, 3 are always loaded
    slideConfigs.push(
      { slide: '2', id: 'chartSlide2', file: `assets/data/${quarter}/slide2.json`, type: 'bar' },
      { slide: '3', id: 'chartSlide3', file: `assets/data/${quarter}/slide3.json`, type: 'bar' }
    );

    // Slide 4 (Vendedores por mes) only for quarterly, not FY
    if (!isFY(quarter)) {
      slideConfigs.push(
        { slide: '4', id: 'chartSlide4', file: `assets/data/${quarter}/slide4.json`, type: 'line' }
      );
    }

    // Slides 5, 6 are always loaded
    slideConfigs.push(
      { slide: '5', id: 'chartSlide5', file: `assets/data/${quarter}/slide5.json`, type: 'bar' },
      { slide: '6', id: 'chartSlide6', file: `assets/data/${quarter}/slide6.json`, type: 'bar' }
    );

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
          // --- BEGIN SORTING LOGIC FOR SLIDES 5 & 6 ---
          if ((config.slide === '5' || config.slide === '6') &&
            data.labels &&
            data.datasets &&
            data.datasets[0] &&
            data.datasets[0].data &&
            data.datasets[0].backgroundColor &&
            data.datasets[0].borderColor) {
            // 1. Combine data into an array of objects
            let combined = data.labels.map((label, index) => {
              return {
                label: label,
                data: data.datasets[0].data[index],
                backgroundColor: data.datasets[0].backgroundColor[index],
                borderColor: data.datasets[0].borderColor[index]
              };
            });

            // 2. Sort the array of objects by data value (descending)
            combined.sort((a, b) => b.data - a.data);

            // 3. Deconstruct the sorted array back into the data object
            data.labels = combined.map(item => item.label);
            data.datasets[0].data = combined.map(item => item.data);
            data.datasets[0].backgroundColor = combined.map(item => item.backgroundColor);
            data.datasets[0].borderColor = combined.map(item => item.borderColor);
          }
          // --- END SORTING LOGIC ---

          // Load Chart
          const ctx = document.getElementById(config.id).getContext('2d');
          charts[config.id] = new Chart(ctx, {
            type: config.type,
            data: { labels: data.labels, datasets: data.datasets },
            plugins: [ChartDataLabels],
            options: {
              responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, elements: { bar: { borderWidth: 0 } },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true, backgroundColor: 'rgba(255, 255, 255, 0.95)', titleColor: '#003366', bodyColor: '#333', borderColor: '#e0e0e0', borderWidth: 1, cornerRadius: 6, padding: 10, usePointStyle: true },
                datalabels: { 
                  display: config.type === 'bar',
                  anchor: 'end', 
                  align: 'bottom', 
                  offset: 6,
                  color: '#ffffff', 
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 4,
                  padding: { top: 3, bottom: 3, left: 6, right: 6 },
                  font: { weight: 'bold', size: 13, family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }, 
                  formatter: Math.round
                }
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

    // Load FY-specific sections
    if (isFY(quarter)) {
      loadAccionesData(quarter);
      loadDesarrollosData(quarter);
    }
  }

  // --- 4. Image Modal Popup ---
  function setupModalForGallery() {
    setupModalForImages('.gallery img');
  }

  function setupModalForImages(selector) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.close');

    document.querySelectorAll(selector).forEach(img => {
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
  // Set the active class on the correct button for the initial load
  quarterButtons.forEach(btn => {
    if (btn.getAttribute('data-quarter') === currentQuarter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  updateTabsVisibility(currentQuarter);
  loadQuarterData(currentQuarter);
});