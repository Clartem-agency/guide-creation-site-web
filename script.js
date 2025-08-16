document.addEventListener('DOMContentLoaded', function () {

    // --- NOUVEAU : DÉFINITIONS POUR LA SAUVEGARDE LOCALE ---
    const STORAGE_KEY = 'clartem-briefing-data';
    let allFormElements = [];
    let saveTimeout;

    // --- NOUVEAU : FONCTION POUR AFFICHER LA NOTIFICATION DE SAUVEGARDE ---
    function showSaveNotification() {
        const saveStatus = document.getElementById('save-status');
        if (!saveStatus) return;

        // Si une animation est déjà en cours, on la réinitialise
        if (saveTimeout) clearTimeout(saveTimeout);

        saveStatus.classList.add('visible');

        // On cache la notification après 2 secondes
        saveTimeout = setTimeout(() => {
            saveStatus.classList.remove('visible');
        }, 2000);
    }

    // --- NOUVEAU : FONCTION POUR SAUVEGARDER TOUTES LES DONNÉES ---
    function saveData() {
        const data = {};
        allFormElements.forEach(el => {
            const id = el.id;
            if (!id) return; // On ne sauvegarde que les champs avec un ID

            if (el.type === 'checkbox' || el.type === 'radio') {
                data[id] = el.checked;
            } else if (el.type === 'file') {
                // On ne peut pas sauvegarder le fichier, mais on peut sauvegarder son nom
                // pour rappeler à l'utilisateur qu'il avait sélectionné quelque chose.
                data[id] = el.files.length > 0 ? el.files[0].name : '';
            } else {
                data[id] = el.value;
            }
        });

        // On convertit l'objet de données en texte (JSON) et on le stocke
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // On affiche la notification pour rassurer l'utilisateur
        showSaveNotification();
    }

    // --- NOUVEAU : FONCTION POUR CHARGER LES DONNÉES SAUVEGARDÉES ---
    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return; // Pas de données, on ne fait rien

        const data = JSON.parse(savedData);

        allFormElements.forEach(el => {
            const id = el.id;
            if (data[id] !== undefined) {
                if (el.type === 'checkbox' || el.type === 'radio') {
                    el.checked = data[id];
                } else if (el.type === 'file') {
                    if (data[id]) {
                        // Si un nom de fichier était sauvegardé, on l'affiche
                        // pour rappeler à l'utilisateur de resélectionner le fichier.
                        const infoSpan = document.createElement('span');
                        infoSpan.className = 'file-reselect-info';
                        infoSpan.textContent = `Fichier précédemment sélectionné : ${data[id]}. Veuillez le resélectionner.`;
                        // On supprime l'ancien message s'il existe
                        const oldInfo = el.parentElement.querySelector('.file-reselect-info');
                        if (oldInfo) oldInfo.remove();
                        el.parentElement.insertBefore(infoSpan, el.nextSibling);
                    }
                } else {
                    el.value = data[id];
                }
            }
        });
    }

    // --- NOUVEAU : FONCTION POUR EFFACER LES DONNÉES ---
    function clearData() {
        // On demande confirmation avant de tout effacer
        if (confirm("Êtes-vous sûr de vouloir effacer toutes les données saisies ? Cette action est irréversible.")) {
            localStorage.removeItem(STORAGE_KEY);
            // On recharge la page pour la remettre à zéro
            location.reload();
        }
    }


    // --- GESTION DU BOUTON DE DÉFILEMENT FLUIDE ---
    const startButton = document.querySelector('.cta-button');
    if (startButton) {
        startButton.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- DÉFINITION GLOBALE DES SECTIONS POUR LE TRACKER (MODIFIÉE) ---
    const sectionsToTrack = [
        { id: 'section-1-hero', name: 'Héros : Première Impression', keyFields: ['hero-title-1', 'hero-cta-primary'] },
        { id: 'section-2-about', name: 'À Propos : Votre Histoire', keyFields: ['about-title-final', 'about-story-final'] },
        { id: 'section-3-services', name: 'Services : Vos Offres', keyFields: ['services-title-final', 'service-1-name'] },
        { id: 'section-4-portfolio', name: 'Portfolio : Vos Réalisations', keyFields: ['portfolio-title-final', 'portfolio-zip-upload'] },
        { id: 'section-5-testimonials', name: 'Témoignages : Preuve Sociale', keyFields: ['testimonials-title-final', 'testimonial-1-text'] },
        // NOUVELLE SECTION FAQ AJOUTÉE ICI
        { id: 'section-6-faq', name: 'FAQ : Vos Questions', keyFields: ['faq-title-final', 'faq-q-1'] },
        // SECTIONS SUIVANTES RENUMÉROTÉES
        { id: 'section-7-booking', name: 'Rendez-vous : L\'Outil', keyFields: ['booking-title-final', 'booking-event-name'] },
        { id: 'section-8-contact', name: 'Contact : Le Hub Final', keyFields: ['contact-title-final', 'contact-reception-email'] },
        { id: 'section-9-architecture', name: 'Architecture : Le Récit', keyFields: ['plan-choice-a'] }, // On vérifie juste qu'un choix a été fait
        { id: 'section-10-navigation', name: 'Navigation : Le GPS', keyFields: ['nav-cta-text'] },
        { id: 'section-11-footer', name: 'Pied de Page : Les Fondations', keyFields: ['footer-pitch', 'footer-copyright'] },
        { id: 'section-12-conclusion', name: 'Conclusion & Envoi', keyFields: [] } // Section spéciale
    ];

    const progressTrackerContainer = document.getElementById('progress-tracker');
    const verticalNavContainer = document.getElementById('vertical-nav');
    // MODIFICATION : la variable allInputs est maintenant globale (déclarée en haut)

    // --- FONCTION POUR OBTENIR LE STATUT D'UNE SECTION ---
    function getSectionStatus(section) {
        if (section.id === 'section-12-conclusion') return 'todo'; // Modifié pour la nouvelle numérotation

        if (section.keyFields.length === 0) {
            const currentIndex = sectionsToTrack.findIndex(s => s.id === section.id);
            if (currentIndex > 0) {
                const prevSection = sectionsToTrack[currentIndex - 1];
                if (getSectionStatus(prevSection) === 'completed') {
                    return 'completed';
                }
            }
            return 'todo';
        }

        const filledFields = section.keyFields.filter(fieldId => {
            const el = document.getElementById(fieldId);
            if (!el) return false;
            if (el.type === 'file') return el.files.length > 0;
            if (el.type === 'radio' || el.type === 'checkbox') {
                const groupName = el.name;
                return !!document.querySelector(`input[name="${groupName}"]:checked`);
            }
            return el.value.trim() !== '';
        }).length;

        if (filledFields === section.keyFields.length) return 'completed';
        if (filledFields > 0) return 'inprogress';
        return 'todo';
    }

    // --- FONCTION POUR METTRE À JOUR TOUS LES VISUELS DE PROGRESSION ---
    function updateAllProgressVisuals() {
        updateProgressTracker();
        updateVerticalNavStatus();
    }

    // --- FONCTION POUR METTRE À JOUR LE TABLEAU DE BORD ---
    function updateProgressTracker() {
        if (!progressTrackerContainer) return;

        sectionsToTrack.forEach(section => {
            const item = document.getElementById(`progress-item-${section.id}`);
            if (!item) return;

            const status = getSectionStatus(section);

            item.classList.remove('status-todo', 'status-inprogress', 'status-completed');
            item.classList.add(`status-${status}`);

            const iconEl = item.querySelector('.status-icon');
            const statusTextEl = item.querySelector('.progress-text span');

            switch (status) {
                case 'completed':
                    iconEl.innerHTML = '✔';
                    statusTextEl.textContent = 'Terminé';
                    break;
                case 'inprogress':
                    iconEl.innerHTML = '…';
                    statusTextEl.textContent = 'En cours';
                    break;
                default:
                    iconEl.innerHTML = '○';
                    statusTextEl.textContent = 'À commencer';
                    break;
            }
        });
    }

    // --- FONCTION POUR METTRE À JOUR LA NAV VERTICALE ---
    function updateVerticalNavStatus() {
        if (!verticalNavContainer) return;

        sectionsToTrack.forEach(section => {
            const item = document.getElementById(`vnav-item-${section.id}`);
            if (!item) return;
            const status = getSectionStatus(section);
            item.classList.remove('status-todo', 'status-inprogress', 'status-completed');
            item.classList.add(`status-${status}`);
        });
    }

    // --- FONCTION POUR INITIALISER LE TABLEAU DE BORD ---
    function initializeProgressTracker() {
        if (!progressTrackerContainer) return;
        progressTrackerContainer.innerHTML = '';

        sectionsToTrack.forEach(section => {
            const item = document.createElement('a');
            item.id = `progress-item-${section.id}`;
            item.href = `#${section.id}`;
            item.className = 'progress-item status-todo';

            item.innerHTML = `
                <span class="status-icon">○</span>
                <div class="progress-text">
                    <strong>${section.name.split(':')[0]}</strong>
                    <span>À commencer</span>
                </div>
            `;

            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            progressTrackerContainer.appendChild(item);
        });
    }

    // --- FONCTION POUR INITIALISER LA NAV VERTICALE ---
    function initializeVerticalNav() {
        if (!verticalNavContainer) return;
        const ul = document.createElement('ul');

        sectionsToTrack.forEach(section => {
            const li = document.createElement('li');
            li.id = `vnav-item-${section.id}`;

            const a = document.createElement('a');
            a.href = `#${section.id}`;
            a.setAttribute('aria-label', `Aller à la section ${section.name.split(':')[0]}`);

            a.innerHTML = `
                <span class="nav-dot"></span>
                <span class="nav-tooltip">${section.name.split(':')[0]}</span>
            `;

            a.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            li.appendChild(a);
            ul.appendChild(li);
        });
        verticalNavContainer.appendChild(ul);
    }

    // --- LOGIQUE POUR L'ÉTAT ACTIF DE LA NAV VERTICALE ---
    function setupVerticalNavObserver() {
        if (!verticalNavContainer) return;

        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const navItem = document.querySelector(`#vnav-item-${entry.target.id}`);
                if (navItem) {
                    if (entry.isIntersecting) {
                        verticalNavContainer.querySelectorAll('li.active').forEach(item => item.classList.remove('active'));
                        navItem.classList.add('active');
                    }
                }
            });
        }, observerOptions);

        sectionsToTrack.forEach(section => {
            const sectionEl = document.getElementById(section.id);
            if (sectionEl) {
                observer.observe(sectionEl);
            }
        });
    }


    // --- FONCTION D'INITIALISATION GLOBALE (MODIFIÉE) ---
    function initializeApp() {
        // --- NOUVEAU : On collecte tous les champs du formulaire ---
        allFormElements = Array.from(document.querySelectorAll('input, textarea'));

        // --- NOUVEAU : On charge les données AVANT toute chose ---
        loadData();

        initializeProgressTracker();
        initializeVerticalNav();
        setupVerticalNavObserver();

        // MODIFICATION : on utilise la variable `allFormElements` déjà prête
        allFormElements.forEach(input => {
            const eventType = (input.type === 'radio' || input.type === 'checkbox' || input.type === 'file') ? 'change' : 'input';
            // On attache la sauvegarde à chaque champ
            input.addEventListener(eventType, () => {
                saveData(); // Sauvegarde les données
                updateAllProgressVisuals(); // Met à jour l'UI de progression
            });
        });

        // --- NOUVEAU : On attache l'événement au bouton pour effacer ---
        const clearButton = document.getElementById('clear-data-button');
        if (clearButton) {
            clearButton.addEventListener('click', clearData);
        }

        // On initialise les résumés et la progression une fois les données chargées
        initializeSummaries();
        updateAllProgressVisuals();

        // --- NOUVEAU : GESTION DU BOUTON PDF ---
        const pdfButton = document.getElementById('save-pdf-button');

        // On vérifie que le bouton existe bien pour éviter les erreurs
        if (pdfButton) {
            // On ajoute un "écouteur d'événement" qui attend un clic sur le bouton
            pdfButton.addEventListener('click', () => {
                // Quand le clic se produit, on lance la fonction d'impression du navigateur
                window.print();
            });
        }
    }


    // --- DÉFINITION GLOBALE DES SECTIONS (POUR LES SYNCHRONISATIONS) ---
    // (MODIFIÉ POUR AJOUTER LA FAQ)
    const sectionDefinitions = {
        hero: { key: 'hero', name: 'Héros', isFilled: () => !!document.getElementById('hero-title-1')?.value.trim() },
        about: { key: 'about', name: 'À Propos', isFilled: () => !!document.getElementById('about-title-final')?.value.trim() },
        services: { key: 'services', name: 'Services / Offres', isFilled: () => !!document.getElementById('service-1-name')?.value.trim() },
        portfolio: { key: 'portfolio', name: 'Galerie / Portfolio', isFilled: () => !!document.getElementById('portfolio-title-final')?.value.trim() },
        testimonials: { key: 'testimonials', name: 'Témoignages', isFilled: () => !!document.getElementById('testimonial-1-name')?.value.trim() },
        faq: { key: 'faq', name: 'FAQ', isFilled: () => !!document.getElementById('faq-q-1')?.value.trim() }, // NOUVELLE SECTION
        booking: { key: 'booking', name: 'Prise de Rendez-vous', isFilled: () => !!document.getElementById('booking-title-final')?.value.trim() },
        contact: { key: 'contact', name: 'Contact & Accès', isFilled: () => !!document.getElementById('contact-title-final')?.value.trim() },
        footer: { key: 'footer', name: 'Pied de Page', isFilled: () => !!document.getElementById('footer-pitch')?.value.trim() },
    };

    function setupSync(inputId, outputId, optionalRowId = null) {
        const inputElement = document.getElementById(inputId);
        const outputElement = document.getElementById(outputId);
        const optionalRow = optionalRowId ? document.getElementById(optionalRowId) : null;

        if (inputElement && outputElement) {
            const update = () => {
                const value = (inputElement.type === 'radio' || inputElement.type === 'checkbox') ? inputElement.checked : inputElement.value;
                outputElement.textContent = value;
                if (optionalRow) {
                    optionalRow.style.display = (typeof value === 'string' && value.trim() !== '') || (typeof value === 'boolean' && value) ? 'table-row' : 'none';
                }
            };
            const eventType = (inputElement.type === 'radio' || inputElement.type === 'checkbox' || inputElement.type === 'file') ? 'change' : 'input';
            inputElement.addEventListener(eventType, update);
            update();
        }
    }

    // ... Toutes vos fonctions setupSync() et initializeSummaries() restent ici ...
    // ... Elles sont parfaitement compatibles avec le nouveau système ...
    // --- SECTION 1 : HÉROS ---
    setupSync('hero-title-1', 'summary-hero-title-1');
    setupSync('hero-subtitle-1', 'summary-hero-subtitle-1');
    setupSync('hero-title-2', 'summary-hero-title-2', 'summary-row-title-2');
    setupSync('hero-subtitle-2', 'summary-hero-subtitle-2', 'summary-row-subtitle-2');
    setupSync('hero-cta-primary', 'summary-hero-cta-primary');
    setupSync('hero-cta-secondary', 'summary-hero-cta-secondary', 'summary-row-cta-secondary');

    const heroVisualChoiceRadios = document.querySelectorAll('input[name="hero-visual-choice"]');
    const heroImageUploadInput = document.getElementById('hero-image-upload');
    const heroColorChoiceInput = document.getElementById('hero-color-choice');
    const heroVisualOutputElement = document.getElementById('summary-hero-visual');

    function updateHeroVisualSummary() {
        const selectedRadio = document.querySelector('input[name="hero-visual-choice"]:checked');
        if (!selectedRadio || !heroVisualOutputElement) return;

        if (selectedRadio.value === 'image') {
            if (heroImageUploadInput.files.length > 0) {
                heroVisualOutputElement.textContent = `Image fournie : ${heroImageUploadInput.files[0].name}`;
            } else {
                heroVisualOutputElement.textContent = 'Image choisie (en attente du fichier)';
            }
        } else if (selectedRadio.value === 'color') {
            heroVisualOutputElement.textContent = `Fond de couleur : ${heroColorChoiceInput.value || 'Non spécifié'}`;
        }
    }
    heroVisualChoiceRadios.forEach(radio => radio.addEventListener('change', updateHeroVisualSummary));
    heroImageUploadInput.addEventListener('change', updateHeroVisualSummary);
    heroColorChoiceInput.addEventListener('input', updateHeroVisualSummary);


    // --- SECTION 2 : À PROPOS ---
    setupSync('about-title-final', 'summary-about-title');
    setupSync('about-story-final', 'summary-about-story');

    const aboutImageUploadInput = document.getElementById('about-image-upload');
    const aboutImageOutputElement = document.getElementById('summary-about-image');
    if (aboutImageUploadInput && aboutImageOutputElement) {
        aboutImageUploadInput.addEventListener('change', function () {
            if (this.files.length > 0) {
                aboutImageOutputElement.textContent = `Fichier fourni : ${this.files[0].name}`;
            } else {
                aboutImageOutputElement.textContent = '';
            }
        });
    }

    const aboutCtaChoiceRadios = document.querySelectorAll('input[name="about-cta-choice"]');
    const aboutCtaDetailsDiv = document.getElementById('about-cta-details');
    const aboutCtaTextInput = document.getElementById('about-cta-text');
    const aboutCtaLinkInput = document.getElementById('about-cta-link');
    const aboutCtaOutputElement = document.getElementById('summary-about-cta');
    const aboutCtaOptionalRow = document.getElementById('summary-row-about-cta');

    function updateAboutCtaSummary() {
        if (!aboutCtaOutputElement || !aboutCtaOptionalRow) return;

        const choice = document.querySelector('input[name="about-cta-choice"]:checked').value;
        if (choice === 'yes') {
            aboutCtaDetailsDiv.style.display = 'block';
            const text = aboutCtaTextInput.value.trim();
            const link = aboutCtaLinkInput.value.trim();
            if (text) {
                aboutCtaOptionalRow.style.display = 'table-row';
                aboutCtaOutputElement.textContent = `Texte : "${text}" | Lien : ${link || 'non défini'}`;
            } else {
                aboutCtaOptionalRow.style.display = 'none';
                aboutCtaOutputElement.textContent = '';
            }
        } else {
            aboutCtaDetailsDiv.style.display = 'none';
            aboutCtaOptionalRow.style.display = 'none';
            aboutCtaOutputElement.textContent = '';
        }
    }
    aboutCtaChoiceRadios.forEach(radio => radio.addEventListener('change', updateAboutCtaSummary));
    aboutCtaTextInput.addEventListener('input', updateAboutCtaSummary);
    aboutCtaLinkInput.addEventListener('input', updateAboutCtaSummary);


    // --- SECTION 3 : SERVICES / OFFRES ---
    setupSync('services-title-final', 'summary-services-title');
    setupSync('services-cta-final', 'summary-services-cta');

    const servicesFormatRadios = document.querySelectorAll('input[name="services-format-choice"]');
    const servicesFormatOutput = document.getElementById('summary-services-format');
    function updateServicesFormatSummary() {
        const selectedRadio = document.querySelector('input[name="services-format-choice"]:checked');
        if (selectedRadio) {
            servicesFormatOutput.textContent = `Format ${selectedRadio.value}`;
        } else {
            servicesFormatOutput.textContent = 'Non spécifié';
        }
    }
    servicesFormatRadios.forEach(radio => radio.addEventListener('change', updateServicesFormatSummary));

    function setupOfferSync(offerNumber) {
        const nameInput = document.getElementById(`service-${offerNumber}-name`);
        const resultInput = document.getElementById(`service-${offerNumber}-result`);
        const targetInput = document.getElementById(`service-${offerNumber}-target`);
        const deliverablesInput = document.getElementById(`service-${offerNumber}-deliverables`);
        const priceInput = document.getElementById(`service-${offerNumber}-price`);
        const iconInput = document.getElementById(`service-${offerNumber}-icon`);

        const summaryOutput = document.getElementById(`summary-service-${offerNumber}`);
        const summaryRow = document.getElementById(`summary-row-service-${offerNumber}`);
        const iconLabel = document.getElementById(`icon-label-${offerNumber}`);

        const inputs = [nameInput, resultInput, targetInput, deliverablesInput, priceInput, iconInput];

        function updateSummary() {
            if (!nameInput || !summaryRow || !summaryOutput || !iconLabel) return;
            const name = nameInput.value.trim();
            if (name === '') {
                summaryRow.style.display = 'none';
                summaryOutput.textContent = '';
                iconLabel.textContent = `Nom Offre ${offerNumber}`;
                return;
            }

            summaryRow.style.display = 'table-row';
            iconLabel.textContent = name;

            const result = resultInput.value.trim();
            const target = targetInput.value.trim();
            const deliverables = deliverablesInput.value.trim();
            const price = priceInput.value.trim();
            const icon = iconInput ? iconInput.value.trim() : '';

            let summaryText = `Nom : ${name}\n`;
            if (result) summaryText += `Résultat : ${result}\n`;
            if (target) summaryText += `Pour qui : ${target}\n`;
            if (deliverables) summaryText += `Inclus : \n${deliverables}\n`;
            if (price) summaryText += `Prix : ${price}\n`;
            if (icon) summaryText += `Concept d'icône : ${icon}`;

            summaryOutput.textContent = summaryText.trim();
        }

        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', updateSummary);
            }
        });
        updateSummary(); // Initial call
    }

    setupOfferSync(1);
    setupOfferSync(2);
    setupOfferSync(3);


    // --- SECTION 4 : GALERIE / PORTFOLIO ---
    setupSync('portfolio-title-final', 'summary-portfolio-title');

    const portfolioGridRadios = document.querySelectorAll('input[name="portfolio-grid-choice"]');
    const portfolioGridOutput = document.getElementById('summary-portfolio-grid');
    function updatePortfolioGridSummary() {
        const selectedRadio = document.querySelector('input[name="portfolio-grid-choice"]:checked');
        if (selectedRadio) {
            portfolioGridOutput.textContent = `Grille de ${selectedRadio.value} images`;
        } else {
            portfolioGridOutput.textContent = 'Non spécifié';
        }
    }
    portfolioGridRadios.forEach(radio => radio.addEventListener('change', updatePortfolioGridSummary));

    const portfolioUploadInput = document.getElementById('portfolio-zip-upload');
    const portfolioFilesOutput = document.getElementById('summary-portfolio-files');
    if (portfolioUploadInput && portfolioFilesOutput) {
        portfolioUploadInput.addEventListener('change', function () {
            if (this.files.length > 0) {
                portfolioFilesOutput.textContent = `Fichier fourni : ${this.files[0].name}`;
            } else {
                portfolioFilesOutput.textContent = 'En attente du fichier .zip';
            }
        });
    }

    // --- SECTION 5 : TÉMOIGNAGES ---
    setupSync('testimonials-title-final', 'summary-testimonials-title');

    const testimonialsFormatRadios = document.querySelectorAll('input[name="testimonials-format-choice"]');
    const testimonialsFormatOutput = document.getElementById('summary-testimonials-format');
    function updateTestimonialsFormatSummary() {
        const selectedRadio = document.querySelector('input[name="testimonials-format-choice"]:checked');
        if (selectedRadio) {
            testimonialsFormatOutput.textContent = `Format ${selectedRadio.value}`;
        } else {
            testimonialsFormatOutput.textContent = 'Non spécifié';
        }
    }
    testimonialsFormatRadios.forEach(radio => radio.addEventListener('change', updateTestimonialsFormatSummary));

    function setupTestimonialSync(testimonialNumber) {
        const textInput = document.getElementById(`testimonial-${testimonialNumber}-text`);
        const nameInput = document.getElementById(`testimonial-${testimonialNumber}-name`);
        const titleInput = document.getElementById(`testimonial-${testimonialNumber}-title`);
        const photoInput = document.getElementById(`testimonial-${testimonialNumber}-photo`);

        const summaryOutput = document.getElementById(`summary-testimonial-${testimonialNumber}`);
        const summaryRow = document.getElementById(`summary-row-testimonial-${testimonialNumber}`);

        const inputs = [textInput, nameInput, titleInput, photoInput];

        function updateSummary() {
            if (!summaryRow || !summaryOutput) return;

            const text = textInput.value.trim();
            const name = nameInput.value.trim();

            if (name === '' && text === '') {
                summaryRow.style.display = 'none';
                summaryOutput.textContent = '';
                return;
            }

            summaryRow.style.display = 'table-row';

            const title = titleInput.value.trim();
            const photoFile = photoInput.files.length > 0 ? photoInput.files[0].name : 'Non fournie';

            let summaryText = `Nom : ${name}\n`;
            if (title) summaryText += `Titre : ${title}\n`;
            if (text) summaryText += `Texte : "${text}"\n`;
            summaryText += `Photo : ${photoFile}`;

            summaryOutput.textContent = summaryText.trim();
        }

        inputs.forEach(input => {
            if (input) {
                const eventType = input.type === 'file' ? 'change' : 'input';
                input.addEventListener(eventType, updateSummary);
            }
        });
        updateSummary(); // Initial call
    }

    setupTestimonialSync(1);
    setupTestimonialSync(2);
    setupTestimonialSync(3);

    // --- NOUVELLE SECTION 6 : FAQ ---
    setupSync('faq-title-final', 'summary-faq-title');

    function setupFaqSync() {
        const summaryOutput = document.getElementById('summary-faq-pairs');
        const summaryRow = document.getElementById('summary-row-faq-pairs');
        if (!summaryOutput || !summaryRow) return;

        const inputs = [];
        for (let i = 1; i <= 5; i++) {
            const qInput = document.getElementById(`faq-q-${i}`);
            const aInput = document.getElementById(`faq-a-${i}`);
            if (qInput && aInput) {
                inputs.push(qInput, aInput);
            }
        }

        function updateSummary() {
            const pairs = [];
            let hasContent = false;
            for (let i = 1; i <= 5; i++) {
                const question = document.getElementById(`faq-q-${i}`).value.trim();
                const answer = document.getElementById(`faq-a-${i}`).value.trim();

                if (question) {
                    hasContent = true;
                    let pairText = `Q${i}: ${question}`;
                    if (answer) {
                        pairText += `\nA${i}: ${answer}`;
                    }
                    pairs.push(pairText);
                }
            }

            if (hasContent) {
                summaryRow.style.display = 'table-row';
                summaryOutput.textContent = pairs.join('\n\n');
            } else {
                summaryRow.style.display = 'none';
                summaryOutput.textContent = '';
            }
        }

        inputs.forEach(input => input.addEventListener('input', updateSummary));
        updateSummary();
    }


    // --- SECTION 7 : PRISE DE RENDEZ-VOUS (Anciennement 6) ---
    setupSync('booking-title-final', 'summary-booking-title');
    setupSync('booking-subtitle-final', 'summary-booking-subtitle');
    setupSync('booking-event-name', 'summary-booking-event-name');
    setupSync('booking-event-duration', 'summary-booking-event-duration');
    setupSync('booking-event-description', 'summary-booking-event-description');
    setupSync('booking-embed-code', 'summary-booking-embed-code', 'summary-row-booking-code');

    function setupBookingQuestionsSync() {
        const q1 = document.getElementById('booking-q1');
        const q2 = document.getElementById('booking-q2');
        const q3 = document.getElementById('booking-q3');
        const summaryOutput = document.getElementById('summary-booking-questions');

        if (!q1 || !q2 || !q3 || !summaryOutput) return;

        const inputs = [q1, q2, q3];

        function updateSummary() {
            const questions = inputs
                .map(input => input.value.trim())
                .filter(value => value !== '')
                .map((value, index) => `${index + 1}. ${value}`);

            summaryOutput.textContent = questions.join('\n');
        }

        inputs.forEach(input => input.addEventListener('input', updateSummary));
        updateSummary(); // Initial call
    }
    setupBookingQuestionsSync();


    // --- SECTION 8 : CONTACT & ACCÈS (Anciennement 7) ---
    setupSync('contact-title-final', 'summary-contact-title');
    setupSync('contact-reception-email', 'summary-contact-reception-email');
    setupSync('contact-confirm-message', 'summary-contact-confirm-message');
    setupSync('contact-address', 'summary-contact-address');
    setupSync('contact-phone', 'summary-contact-phone');
    setupSync('contact-email', 'summary-contact-email');
    setupSync('contact-hours', 'summary-contact-hours');

    function setupContactSocialsSync() {
        const inputs = {
            Facebook: document.getElementById('contact-facebook'),
            Instagram: document.getElementById('contact-instagram'),
            LinkedIn: document.getElementById('contact-linkedin'),
            'Twitter / X': document.getElementById('contact-twitter'),
            Autre: document.getElementById('contact-other'),
        };
        const summaryOutput = document.getElementById('summary-contact-socials');
        if (!summaryOutput) return;

        function updateSummary() {
            const links = Object.entries(inputs)
                .map(([name, input]) => ({ name, value: input ? input.value.trim() : '' }))
                .filter(item => item.value !== '')
                .map(item => `${item.name}: ${item.value}`);

            summaryOutput.textContent = links.join('\n');
        }

        Object.values(inputs).forEach(input => {
            if (input) input.addEventListener('input', updateSummary);
        });
        updateSummary();
    }
    setupContactSocialsSync();

    function setupContactMapSync() {
        const radios = document.querySelectorAll('input[name="contact-map-choice"]');
        const addressInput = document.getElementById('contact-map-address');
        const summaryOutput = document.getElementById('summary-contact-map');
        if (!summaryOutput || radios.length === 0 || !addressInput) return;

        function updateSummary() {
            const choice = document.querySelector('input[name="contact-map-choice"]:checked');
            if (!choice) {
                summaryOutput.textContent = 'Non spécifié';
                return;
            }
            if (choice.value === 'yes') {
                const address = addressInput.value.trim();
                summaryOutput.textContent = `Oui${address ? ` - Adresse : ${address}` : ' (adresse non spécifiée)'}`;
            } else {
                summaryOutput.textContent = 'Non';
            }
        }

        radios.forEach(radio => radio.addEventListener('change', updateSummary));
        addressInput.addEventListener('input', updateSummary);
        updateSummary();
    }
    setupContactMapSync();

    // --- SECTION 9 : ARCHITECTURE (Anciennement 8) ---
    function setupArchitectureSync() {
        const planRadios = document.querySelectorAll('input[name="architecture-plan-choice"]');
        const customOrderContainer = document.getElementById('custom-order-inputs');
        const customOrderInputs = {
            about: document.getElementById('order-input-about'),
            services: document.getElementById('order-input-services'),
            portfolio: document.getElementById('order-input-portfolio'),
            testimonials: document.getElementById('order-input-testimonials'),
            faq: document.getElementById('order-input-faq'), // NOUVEAU
            booking: document.getElementById('order-input-booking'),
        };
        const summaryPlanOutput = document.getElementById('summary-architecture-plan');
        const summaryOrderOutput = document.getElementById('summary-architecture-order');
        const chosenSectionsList = document.getElementById('chosen-sections-list');

        if (!summaryPlanOutput || !summaryOrderOutput || !chosenSectionsList) return;

        function populateChosenSections() {
            chosenSectionsList.innerHTML = '';
            Object.values(sectionDefinitions).forEach(section => {
                if (section.isFilled()) {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="star-bullet">✦</span><div class="checklist-item-content"><strong>${section.name}</strong></div>`;
                    chosenSectionsList.appendChild(li);
                }
            });
            if (chosenSectionsList.children.length === 0) {
                chosenSectionsList.innerHTML = '<li>Aucune section remplie pour le moment.</li>';
            }
        }

        function getOrderString(orderArray) {
            const filledSections = orderArray.filter(key => sectionDefinitions[key] && sectionDefinitions[key].isFilled());
            const finalOrder = ['Héros', ...filledSections.map(key => sectionDefinitions[key].name)];
            if (sectionDefinitions.contact.isFilled() && !finalOrder.includes(sectionDefinitions.contact.name)) {
                finalOrder.push(sectionDefinitions.contact.name);
            }
            return finalOrder.map((name, index) => `${index + 1}. ${name}`).join('\n');
        }

        function updateSummary() {
            const selectedRadio = document.querySelector('input[name="architecture-plan-choice"]:checked');
            if (!selectedRadio) return;

            const choice = selectedRadio.value;
            customOrderContainer.style.display = choice === 'Custom' ? 'block' : 'none';
            Object.values(customOrderInputs).forEach(input => { if (input) input.disabled = choice !== 'Custom' });

            let planText = '';
            let orderText = '';

            switch (choice) {
                case 'A':
                    planText = 'Plan A : Le "Classique Persuasif"';
                    orderText = getOrderString(['services', 'portfolio', 'testimonials', 'faq', 'about', 'booking']);
                    break;
                case 'B':
                    planText = 'Plan B : La "Confiance d\'Abord"';
                    orderText = getOrderString(['about', 'services', 'testimonials', 'faq', 'booking']);
                    break;
                case 'C':
                    planText = 'Plan C : La "Preuve Immédiate"';
                    orderText = getOrderString(['portfolio', 'services', 'testimonials', 'faq', 'about', 'booking']);
                    break;
                case 'Custom':
                    planText = 'Plan Personnalisé';
                    const customOrder = Object.entries(customOrderInputs)
                        .map(([key, input]) => ({ key, order: parseInt(input.value, 10) || 99 }))
                        .filter(item => sectionDefinitions[item.key] && sectionDefinitions[item.key].isFilled())
                        .sort((a, b) => a.order - b.order)
                        .map(item => item.key);
                    orderText = getOrderString(customOrder);
                    break;
            }
            summaryPlanOutput.textContent = planText;
            summaryOrderOutput.textContent = orderText;
        }

        populateChosenSections();
        planRadios.forEach(radio => radio.addEventListener('change', updateSummary));
        Object.values(customOrderInputs).forEach(input => { if (input) input.addEventListener('input', updateSummary) });
        updateSummary(); // Initial call
    }

    // --- SECTION 10 : NAVIGATION (Anciennement 9) ---
    function setupNavigationSync() {
        const possibleLinksList = document.getElementById('nav-possible-links-list');
        const linkChoicesContainer = document.getElementById('nav-link-choices-container');
        const linkNamingContainer = document.getElementById('nav-link-naming-container');
        const ctaInput = document.getElementById('nav-cta-text');
        const summaryLinksOutput = document.getElementById('summary-nav-links');
        const summaryCtaOutput = document.getElementById('summary-nav-cta');

        if (!possibleLinksList || !linkChoicesContainer || !linkNamingContainer || !ctaInput || !summaryLinksOutput || !summaryCtaOutput) return;

        const navSections = [
            { key: 'about', name: 'À Propos', defaultText: 'À Propos' },
            { key: 'services', name: 'Services / Offres', defaultText: 'Services' },
            { key: 'portfolio', name: 'Galerie / Portfolio', defaultText: 'Portfolio' },
            { key: 'testimonials', name: 'Témoignages', defaultText: 'Témoignages' },
            { key: 'faq', name: 'FAQ', defaultText: 'FAQ' }, // NOUVEAU
            { key: 'booking', name: 'Prise de Rendez-vous', defaultText: 'Prendre RDV' },
            { key: 'contact', name: 'Contact & Accès', defaultText: 'Contact' }
        ];

        function updateNavSummary() {
            const selectedLinks = [];
            const checkboxes = linkChoicesContainer.querySelectorAll('input[type="checkbox"]:checked');

            checkboxes.forEach(cb => {
                const key = cb.value;
                const namingInput = document.getElementById(`nav-text-input-${key}`);
                if (namingInput) {
                    selectedLinks.push(namingInput.value.trim() || navSections.find(s => s.key === key).defaultText);
                }
            });

            summaryLinksOutput.textContent = selectedLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
            summaryCtaOutput.textContent = ctaInput.value.trim();
        }

        function updateLinkNamingInputs() {
            linkNamingContainer.innerHTML = '';
            const checkboxes = linkChoicesContainer.querySelectorAll('input[type="checkbox"]:checked');

            if (checkboxes.length > 0) {
                checkboxes.forEach(cb => {
                    const sectionKey = cb.value;
                    const section = navSections.find(s => s.key === sectionKey);
                    if (section) {
                        const namingItem = document.createElement('div');
                        namingItem.className = 'nav-naming-item';
                        namingItem.innerHTML = `
                            <p>Lien vers "${section.name}"</p>
                            <input type="text" id="nav-text-input-${section.key}" placeholder="Texte du lien (ex: ${section.defaultText})">
                        `;
                        linkNamingContainer.appendChild(namingItem);

                        const input = document.getElementById(`nav-text-input-${section.key}`);
                        input.addEventListener('input', updateNavSummary);
                    }
                });
            }
            updateNavSummary();
        }

        function initializeNavSection() {
            possibleLinksList.innerHTML = '';
            linkChoicesContainer.innerHTML = '';

            navSections.forEach(section => {
                if (sectionDefinitions[section.key] && sectionDefinitions[section.key].isFilled()) {
                    // Populate possible links list
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="star-bullet">✦</span><div class="checklist-item-content"><strong>${section.name}</strong></div>`;
                    possibleLinksList.appendChild(li);

                    // Populate checkbox choices
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'checkbox-group';
                    checkboxDiv.innerHTML = `
                        <input type="checkbox" id="nav-link-choice-${section.key}" name="nav-link-choice" value="${section.key}">
                        <label for="nav-link-choice-${section.key}">Lien vers "${section.name}"</label>
                    `;
                    linkChoicesContainer.appendChild(checkboxDiv);
                }
            });

            if (possibleLinksList.children.length === 0) {
                possibleLinksList.innerHTML = '<li>Aucune section pertinente remplie pour le moment.</li>';
            }

            linkChoicesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.addEventListener('change', updateLinkNamingInputs);
            });
        }

        initializeNavSection();
        ctaInput.addEventListener('input', updateNavSummary);
        updateNavSummary(); // Initial call
    }

    // --- SECTION 11 : FOOTER (Anciennement 10) ---
    function setupFooterSync() {
        // Simple syncs
        setupSync('footer-pitch', 'summary-footer-pitch');
        setupSync('footer-copyright', 'summary-footer-copyright');
        setupSync('footer-cta-text', 'summary-footer-cta');

        // Complex syncs
        const additionalLinkNameInput = document.getElementById('footer-additional-link-name');
        const additionalLinkUrlInput = document.getElementById('footer-additional-link-url');
        const summaryAdditionalLinkOutput = document.getElementById('summary-footer-additional-link');

        const creditRadios = document.querySelectorAll('input[name="footer-credit-choice"]');
        const summaryCreditOutput = document.getElementById('summary-footer-credit');

        const legalMentionsInput = document.getElementById('footer-legal-mentions');
        const legalPrivacyInput = document.getElementById('footer-legal-privacy');
        const summaryLegalStatusOutput = document.getElementById('summary-footer-legal-status');

        function updateFooterSummary() {
            // Additional Link
            const linkName = additionalLinkNameInput.value.trim();
            const linkUrl = additionalLinkUrlInput.value.trim();
            if (linkName || linkUrl) {
                summaryAdditionalLinkOutput.textContent = `Nom : ${linkName || 'Non défini'} | URL : ${linkUrl || 'Non définie'}`;
            } else {
                summaryAdditionalLinkOutput.textContent = 'Aucun';
            }

            // Credit Agreement
            const selectedCreditRadio = document.querySelector('input[name="footer-credit-choice"]:checked');
            summaryCreditOutput.textContent = selectedCreditRadio ? selectedCreditRadio.value.charAt(0).toUpperCase() + selectedCreditRadio.value.slice(1) : 'Non spécifié';

            // Legal Status
            const mentionsFilled = legalMentionsInput.value.trim() !== '';
            const privacyFilled = legalPrivacyInput.value.trim() !== '';
            if (mentionsFilled && privacyFilled) {
                summaryLegalStatusOutput.textContent = 'Oui, les deux textes sont fournis.';
            } else if (mentionsFilled || privacyFilled) {
                summaryLegalStatusOutput.textContent = 'Partiellement (un seul des deux textes est fourni).';
            } else {
                summaryLegalStatusOutput.textContent = 'Non (textes à venir).';
            }
        }

        [additionalLinkNameInput, additionalLinkUrlInput, legalMentionsInput, legalPrivacyInput].forEach(input => {
            if (input) input.addEventListener('input', updateFooterSummary);
        });
        creditRadios.forEach(radio => {
            if (radio) radio.addEventListener('change', updateFooterSummary);
        });

        updateFooterSummary(); // Initial call
    }


    // --- INITIALISATION DES RÉSUMÉS ---
    function initializeSummaries() {
        updateHeroVisualSummary();
        updateAboutCtaSummary();
        updateServicesFormatSummary();
        updatePortfolioGridSummary();
        const portfolioFilesOutput = document.getElementById('summary-portfolio-files');
        if (portfolioFilesOutput) portfolioFilesOutput.textContent = 'En attente du fichier .zip';
        updateTestimonialsFormatSummary();
        setupFaqSync(); // NOUVEL APPEL
        setupBookingQuestionsSync();
        setupContactSocialsSync();
        setupContactMapSync();
        setupArchitectureSync();
        setupNavigationSync();
        setupFooterSync();
    }

    // --- DÉMARRAGE DE L'APPLICATION ---
    initializeApp();

    // --- NOUVEAU : GESTION DE L'EXPORT JSON ---

    // Cette fonction est le cœur de l'export. Elle va lire chaque champ du formulaire
    // et construire un objet JavaScript bien structuré.
    function generateStructuredData() {
        const data = {};

        // Fonction simple pour récupérer la valeur d'un champ par son ID
        const getValue = (id) => document.getElementById(id)?.value.trim() || '';

        // Fonction pour récupérer le nom d'un fichier uploadé
        const getFileName = (id) => {
            const el = document.getElementById(id);
            return el && el.files.length > 0 ? el.files[0].name : '';
        };

        // Fonction pour récupérer la valeur d'un groupe de boutons radio
        const getRadioValue = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';

        // Fonction pour récupérer les choix de checkboxes
        const getCheckboxValues = (selector) => {
            const values = [];
            document.querySelectorAll(selector).forEach(cb => {
                if (cb.checked) {
                    const label = document.querySelector(`label[for="${cb.id}"]`);
                    values.push(label ? label.textContent.trim() : cb.id);
                }
            });
            return values;
        };

        // Section 1: Héros
        data.hero = {
            strategicReflection: {
                client: getValue('q1-client'),
                problem: getValue('q2-problem'),
                solution: getValue('q3-solution'),
                unique: getValue('q4-unique'),
            },
            proposal1: {
                title: getValue('hero-title-1'),
                subtitle: getValue('hero-subtitle-1'),
            },
            proposal2: {
                title: getValue('hero-title-2'),
                subtitle: getValue('hero-subtitle-2'),
            },
            cta: {
                primary: getValue('hero-cta-primary'),
                secondary: getValue('hero-cta-secondary'),
            },
            visual: {
                type: getRadioValue('hero-visual-choice'),
                imageFile: getFileName('hero-image-upload'),
                colorDescription: getValue('hero-color-choice'),
            }
        };

        // Section 2: À Propos
        data.about = {
            title: getValue('about-title-final'),
            story: getValue('about-story-final'),
            imageFile: getFileName('about-image-upload'),
            cta: {
                enabled: getRadioValue('about-cta-choice') === 'yes',
                text: getValue('about-cta-text'),
                link: getValue('about-cta-link'),
            }
        };

        // Section 3: Services
        data.services = {
            title: getValue('services-title-final'),
            format: getRadioValue('services-format-choice'),
            offers: [],
            finalCta: getValue('services-cta-final')
        };
        for (let i = 1; i <= 3; i++) {
            const name = getValue(`service-${i}-name`);
            if (name) { // On ajoute l'offre seulement si elle a un nom
                data.services.offers.push({
                    name: name,
                    result: getValue(`service-${i}-result`),
                    target: getValue(`service-${i}-target`),
                    deliverables: getValue(`service-${i}-deliverables`),
                    price: getValue(`service-${i}-price`),
                    iconConcept: getValue(`service-${i}-icon`),
                });
            }
        }

        // Section 4: Portfolio
        data.portfolio = {
            title: getValue('portfolio-title-final'),
            grid: getRadioValue('portfolio-grid-choice'),
            zipFile: getFileName('portfolio-zip-upload'),
        };

        // Section 5: Témoignages
        data.testimonials = {
            title: getValue('testimonials-title-final'),
            format: getRadioValue('testimonials-format-choice'),
            list: []
        };
        for (let i = 1; i <= 3; i++) {
            const name = getValue(`testimonial-${i}-name`);
            if (name) {
                data.testimonials.list.push({
                    name: name,
                    title: getValue(`testimonial-${i}-title`),
                    text: getValue(`testimonial-${i}-text`),
                    photoFile: getFileName(`testimonial-${i}-photo`),
                });
            }
        }

        // Section 6: FAQ
        data.faq = {
            title: getValue('faq-title-final'),
            pairs: []
        };
        for (let i = 1; i <= 5; i++) {
            const question = getValue(`faq-q-${i}`);
            if (question) {
                data.faq.pairs.push({
                    question: question,
                    answer: getValue(`faq-a-${i}`),
                });
            }
        }

        // Section 7: Prise de rendez-vous
        data.booking = {
            title: getValue('booking-title-final'),
            subtitle: getValue('booking-subtitle-final'),
            event: {
                name: getValue('booking-event-name'),
                duration: getValue('booking-event-duration'),
                description: getValue('booking-event-description'),
                questions: [getValue('booking-q1'), getValue('booking-q2'), getValue('booking-q3')].filter(q => q)
            },
            embedCode: getValue('booking-embed-code')
        };

        // Section 8: Contact
        data.contact = {
            title: getValue('contact-title-final'),
            form: {
                receptionEmail: getValue('contact-reception-email'),
                confirmationMessage: getValue('contact-confirm-message'),
            },
            details: {
                address: getValue('contact-address'),
                phone: getValue('contact-phone'),
                email: getValue('contact-email'),
                hours: getValue('contact-hours'),
            },
            socials: {
                facebook: getValue('contact-facebook'),
                instagram: getValue('contact-instagram'),
                linkedin: getValue('contact-linkedin'),
                twitter: getValue('contact-twitter'),
                other: getValue('contact-other'),
            },
            map: {
                enabled: getRadioValue('contact-map-choice') === 'yes',
                address: getValue('contact-map-address'),
            }
        };

        // Section 9: Architecture
        data.architecture = {
            plan: getRadioValue('architecture-plan-choice'),
            // Note: l'ordre final est calculé dynamiquement, on ne le stocke pas ici
            // car il dépend des sections remplies. Le "plan" est l'information clé.
        };

        // Section 10: Navigation
        const navLinks = [];
        document.querySelectorAll('input[name="nav-link-choice"]:checked').forEach(cb => {
            const key = cb.value;
            navLinks.push(getValue(`nav-text-input-${key}`));
        });
        data.navigation = {
            links: navLinks,
            cta: getValue('nav-cta-text'),
        };

        // Section 11: Footer
        data.footer = {
            pitch: getValue('footer-pitch'),
            additionalLink: {
                name: getValue('footer-additional-link-name'),
                url: getValue('footer-additional-link-url'),
            },
            cta: getValue('footer-cta-text'),
            copyright: getValue('footer-copyright'),
            creditAgreement: getRadioValue('footer-credit-choice'),
            legal: {
                mentions: getValue('footer-legal-mentions'),
                privacy: getValue('footer-legal-privacy'),
            }
        };

        return data;
    }

    // Cette fonction prend les données, les convertit en JSON et déclenche le téléchargement.
    function downloadJSON() {
        // 1. On récupère toutes les données sous forme d'objet structuré.
        const dataToSave = generateStructuredData();

        // 2. On convertit l'objet JavaScript en une chaîne de texte JSON.
        // Le 'null, 2' sert à joliment formater le fichier pour qu'il soit lisible.
        const jsonString = JSON.stringify(dataToSave, null, 2);

        // 3. On crée un "Blob", qui est un objet représentant des données brutes (notre texte JSON).
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 4. On crée une URL temporaire pour ce Blob.
        const url = URL.createObjectURL(blob);

        // 5. On crée un élément de lien <a> invisible.
        const a = document.createElement('a');
        a.href = url;
        // On définit le nom du fichier qui sera téléchargé.
        a.download = 'briefing-clartem-export.json';

        // 6. On simule un clic sur ce lien pour lancer le téléchargement.
        document.body.appendChild(a);
        a.click();

        // 7. On nettoie en supprimant le lien et l'URL temporaire.
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // APRÈS (Collez tout ce qui suit juste avant le code pour le bouton JSON)

    // --- NOUVEAU : GESTION DU RAPPORT DE SYNTHÈSE ---

    // Fonction pour générer une ligne de rapport (Question + Réponse)
    function generateReportField(label, value) {
        if (value === undefined || value === null || value === false) {
            return ''; // Ne pas afficher les champs non pertinents ou non cochés
        }
        if (value === true) {
            value = 'Oui';
        }
        if (typeof value === 'string' && value.trim() === '') {
             value = 'Non renseigné';
        }
        if (Array.isArray(value) && value.length === 0) {
            return ''; // Ne pas afficher les listes vides
        }
        
        const valueClass = (value === 'Non renseigné' || value === '') ? 'value empty' : 'value';
        
        // Si la valeur est un tableau, on la formate en liste
        if (Array.isArray(value)) {
            value = `<ul>${value.map(item => `<li>${item}</li>`).join('')}</ul>`;
        }

        return `
            <div class="report-field">
                <strong>${label}</strong>
                <div class="${valueClass}">${value}</div>
            </div>
        `;
    }
    
    // Fonction pour générer une section complète du rapport
    function generateReportSection(title, content) {
        if (!content || content.trim() === '') return ''; // Ne pas afficher les sections vides
        return `
            <div class="report-section">
                <h2>${title}</h2>
                ${content}
            </div>
        `;
    }

    // Fonction principale qui génère et ouvre le rapport
    function generateAndPrintReport() {
        const data = generateStructuredData(); // On réutilise la fonction existante !
        let reportHTML = '';

        // Section 1: Héros
        let heroContent = `
            ${generateReportField('Client idéal', data.hero.strategicReflection.client)}
            ${generateReportField('Problème N°1 / Désir profond', data.hero.strategicReflection.problem)}
            ${generateReportField('Solution apportée', data.hero.strategicReflection.solution)}
            ${generateReportField('Approche unique', data.hero.strategicReflection.unique)}
            <div class="report-subsection"><h3>Propositions de message</h3>
            ${generateReportField('Titre (Proposition 1)', data.hero.proposal1.title)}
            ${generateReportField('Sous-titre (Proposition 1)', data.hero.proposal1.subtitle)}
            ${generateReportField('Titre (Proposition 2)', data.hero.proposal2.title)}
            ${generateReportField('Sous-titre (Proposition 2)', data.hero.proposal2.subtitle)}
            </div>
            <div class="report-subsection"><h3>Appel à l'action & Visuel</h3>
            ${generateReportField('Bouton Principal', data.hero.cta.primary)}
            ${generateReportField('Bouton Secondaire', data.hero.cta.secondary)}
            ${generateReportField('Type de visuel', data.hero.visual.type)}
            ${generateReportField('Fichier image', data.hero.visual.imageFile)}
            ${generateReportField('Ambiance de couleur', data.hero.visual.colorDescription)}
            </div>
        `;
        reportHTML += generateReportSection('Section 1 : La Section "Héros"', heroContent);

        // Section 2: À Propos
        let aboutContent = `
            ${generateReportField('Titre de la section', data.about.title)}
            ${generateReportField('Récit', data.about.story)}
            ${generateReportField('Fichier image', data.about.imageFile)}
            ${generateReportField('Activer un bouton d\'action ?', data.about.cta.enabled)}
            ${generateReportField('Texte du bouton', data.about.cta.text)}
            ${generateReportField('Lien du bouton', data.about.cta.link)}
        `;
        reportHTML += generateReportSection('Section 2 : La Section "À Propos"', aboutContent);

        // Section 3: Services
        let servicesContent = `
            ${generateReportField('Titre de la section', data.services.title)}
            ${generateReportField('Format choisi', data.services.format)}
            ${data.services.offers.map((offer, index) => `
                <div class="report-subsection">
                    <h3>Offre ${index + 1}</h3>
                    ${generateReportField('Nom', offer.name)}
                    ${generateReportField('Résultat final', offer.result)}
                    ${generateReportField('Public cible', offer.target)}
                    ${generateReportField('Livrables', offer.deliverables)}
                    ${generateReportField('Prix', offer.price)}
                    ${generateReportField('Concept d\'icône', offer.iconConcept)}
                </div>
            `).join('')}
            ${generateReportField('Appel à l\'action final', data.services.finalCta)}
        `;
        reportHTML += generateReportSection('Section 3 : Services / Offres', servicesContent);

        // Section 4: Portfolio
        let portfolioContent = `
            ${generateReportField('Titre de la section', data.portfolio.title)}
            ${generateReportField('Format de la grille', data.portfolio.grid)}
            ${generateReportField('Fichier .zip fourni', data.portfolio.zipFile)}
        `;
        reportHTML += generateReportSection('Section 4 : Galerie / Portfolio', portfolioContent);

        // Section 5: Témoignages
        let testimonialsContent = `
            ${generateReportField('Titre de la section', data.testimonials.title)}
            ${generateReportField('Format choisi', data.testimonials.format)}
            ${data.testimonials.list.map((testimonial, index) => `
                <div class="report-subsection">
                    <h3>Témoignage ${index + 1}</h3>
                    ${generateReportField('Nom', testimonial.name)}
                    ${generateReportField('Titre / Profession', testimonial.title)}
                    ${generateReportField('Texte', testimonial.text)}
                    ${generateReportField('Fichier photo', testimonial.photoFile)}
                </div>
            `).join('')}
        `;
        reportHTML += generateReportSection('Section 5 : Témoignages', testimonialsContent);
        
        // Section 6: FAQ
        let faqContent = `
            ${generateReportField('Titre de la section', data.faq.title)}
            ${data.faq.pairs.map((pair, index) => `
                <div class="report-subsection">
                    <h3>Paire Q&R ${index + 1}</h3>
                    ${generateReportField('Question', pair.question)}
                    ${generateReportField('Réponse', pair.answer)}
                </div>
            `).join('')}
        `;
        reportHTML += generateReportSection('Section 6 : FAQ', faqContent);

        // Section 7: Rendez-vous
        let bookingContent = `
            ${generateReportField('Titre de la section', data.booking.title)}
            ${generateReportField('Sous-titre', data.booking.subtitle)}
            <div class="report-subsection"><h3>Détails de l'événement</h3>
            ${generateReportField('Nom de l\'événement', data.booking.event.name)}
            ${generateReportField('Durée', data.booking.event.duration)}
            ${generateReportField('Description', data.booking.event.description)}
            ${generateReportField('Questions posées', data.booking.event.questions)}
            </div>
            ${generateReportField('Code d\'intégration (si fourni)', data.booking.embedCode)}
        `;
        reportHTML += generateReportSection('Section 7 : Prise de Rendez-vous', bookingContent);
        
        // Section 8: Contact
        let contactContent = `
            ${generateReportField('Titre de la section', data.contact.title)}
            <div class="report-subsection"><h3>Formulaire</h3>
            ${generateReportField('Email de réception', data.contact.form.receptionEmail)}
            ${generateReportField('Message de confirmation', data.contact.form.confirmationMessage)}
            </div>
            <div class="report-subsection"><h3>Coordonnées</h3>
            ${generateReportField('Adresse', data.contact.details.address)}
            ${generateReportField('Téléphone', data.contact.details.phone)}
            ${generateReportField('Email', data.contact.details.email)}
            ${generateReportField('Horaires', data.contact.details.hours)}
            </div>
            <div class="report-subsection"><h3>Réseaux Sociaux</h3>
            ${generateReportField('Facebook', data.contact.socials.facebook)}
            ${generateReportField('Instagram', data.contact.socials.instagram)}
            ${generateReportField('LinkedIn', data.contact.socials.linkedin)}
            ${generateReportField('Twitter / X', data.contact.socials.twitter)}
            ${generateReportField('Autre', data.contact.socials.other)}
            </div>
            <div class="report-subsection"><h3>Carte</h3>
            ${generateReportField('Afficher une carte ?', data.contact.map.enabled)}
            ${generateReportField('Adresse pour la carte', data.contact.map.address)}
            </div>
        `;
        reportHTML += generateReportSection('Section 8 : Contact & Accès', contactContent);
        
        // Section 9: Architecture
        let architectureContent = `${generateReportField('Plan narratif choisi', data.architecture.plan)}`;
        reportHTML += generateReportSection('Section 9 : Architecture du Récit', architectureContent);
        
        // Section 10: Navigation
        let navigationContent = `
            ${generateReportField('Liens du menu', data.navigation.links)}
            ${generateReportField('Bouton d\'action final', data.navigation.cta)}
        `;
        reportHTML += generateReportSection('Section 10 : Menu de Navigation', navigationContent);

        // Section 11: Pied de Page
        let footerContent = `
            ${generateReportField('Pitch', data.footer.pitch)}
            <div class="report-subsection"><h3>Lien additionnel</h3>
            ${generateReportField('Nom du lien', data.footer.additionalLink.name)}
            ${generateReportField('URL du lien', data.footer.additionalLink.url)}
            </div>
            ${generateReportField('Bouton d\'action', data.footer.cta)}
            ${generateReportField('Copyright', data.footer.copyright)}
            ${generateReportField('Accord pour crédit "Clartem"', data.footer.creditAgreement)}
            <div class="report-subsection"><h3>Textes légaux</h3>
            ${generateReportField('Mentions Légales', data.footer.legal.mentions)}
            ${generateReportField('Politique de Confidentialité', data.footer.legal.privacy)}
            </div>
        `;
        reportHTML += generateReportSection('Section 11 : Pied de Page (Footer)', footerContent);

        // On assemble le HTML final de la page de rapport
        const finalPageHTML = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>Rapport de Synthèse - Briefing Clartem</title>
                <style>
                    /* On copie ici les styles CSS créés à l'étape 2.2 */
                    .report-body{font-family:'Georgia','Times New Roman',serif;line-height:1.6;color:#333;background-color:#fff;padding:2rem;max-width:800px;margin:2rem auto;box-shadow:0 0 15px rgba(0,0,0,.1)}.report-header{text-align:center;border-bottom:2px solid #eee;padding-bottom:1rem;margin-bottom:2rem}.report-header h1{font-size:2rem;color:#19224F;margin:0}.report-header p{font-style:italic;color:#777;margin-top:.5rem}.report-section{margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:1px solid #eee;page-break-inside:avoid}.report-section:last-child{border-bottom:none}.report-section h2{font-size:1.5rem;color:#19224F;margin-bottom:1.5rem;padding-bottom:.5rem;border-bottom:1px solid #ddd}.report-field{margin-bottom:1.2rem;page-break-inside:avoid}.report-field strong{display:block;font-size:1.1rem;color:#555;margin-bottom:.5rem}.report-field .value{background-color:#f9f9f9;padding:.8rem;border-radius:4px;border-left:3px solid #3498DB;white-space:pre-wrap;word-wrap:break-word}.report-field .value.empty{color:#999;font-style:italic;border-left-color:#ccc}.report-field .value ul{margin:0;padding-left:20px}.report-subsection{margin-top:1.5rem;padding:1rem;border:1px solid #e0e0e0;border-radius:6px;background-color:#fafafa}.report-subsection h3{font-size:1.2rem;color:#333;margin-top:0;margin-bottom:1rem}@media print{.report-body{box-shadow:none;margin:0;max-width:100%;padding:1cm}.report-header h1{font-size:18pt}.report-section h2{font-size:14pt}.report-field strong{font-size:11pt}.report-field .value{font-size:10pt;background-color:#f9f9f9!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
                </style>
            </head>
            <body class="report-body">
                <header class="report-header">
                    <h1>Rapport de Synthèse du Briefing</h1>
                    <p>Projet pour [Nom du Client] - Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                </header>
                <main>
                    ${reportHTML}
                </main>
                <script>
                    // Ce script se lance une fois la page chargée et ouvre la boite d'impression
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        // On ouvre un nouvel onglet et on y écrit notre HTML
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(finalPageHTML);
        reportWindow.document.close();
    }

    // On attache la fonction au clic du nouveau bouton de rapport
    const reportButton = document.getElementById('generate-report-button');
    if (reportButton) {
        reportButton.addEventListener('click', generateAndPrintReport);
    }

    // On attache notre fonction de téléchargement au clic du nouveau bouton.
    const jsonButton = document.getElementById('save-json-button');
    if (jsonButton) {
        jsonButton.addEventListener('click', downloadJSON);
    }
});