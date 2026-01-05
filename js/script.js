// --- CONFIGURATION & DATA ---

const tailwindConfig = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            colors: {
                'studio-black': '#0a0a0a',
                'studio-gray': '#1c1c1c',
                'studio-white': '#f5f5f5',
                'studio-gold': '#d4af37',
            }
        }
    }
};

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://rgeshbeiweqnnkbhgoya.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZXNoYmVpd2Vxbm5rYmhnb3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MzcxMTgsImV4cCI6MjA4MzIxMzExOH0.6N7jBP4C0KwHxYA8ymRT1UbN9kTyyQ2O3WV2Umvcdz4';

// PENTING: Ganti nama variabel jadi 'sb' agar tidak bentrok dengan library
let sb; 

try {
    // Cek apakah library sudah load di window
    if (typeof window.supabase !== 'undefined') {
         sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else if (typeof supabaseClient !== 'undefined') {
         sb = supabaseClient.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error("Supabase fail:", e);
}

// Variable global untuk menyimpan data project
let projectsData = {}; 

// Function Fetch Data
async function loadProjects() {
    // Gunakan 'sb' bukan 'supabase'
    if (!sb || SUPABASE_URL.includes('MASUKAN_URL')) {
        console.warn("Supabase belum disetting atau gagal load. Portfolio dinamis tidak akan muncul.");
        return;
    }

    try {
        // 1. Ambil data Projects (Gunakan 'sb')
        const { data: projData, error: projError } = await sb
            .from('projects')
            .select('*');

        if (projError) throw projError;

        // 2. Ambil data Images (Gunakan 'sb')
        const { data: imgData, error: imgError } = await sb
            .from('project_images')
            .select('*');

        if (imgError) throw imgError;

        // 3. Gabungkan data (Mapping)
        if (projData) {
            projData.forEach(proj => {
                const relatedImages = imgData
                    .filter(img => img.project_id === proj.id)
                    .map(img => ({
                        src: img.image_url,
                        aspect: img.aspect_ratio
                    }));

                projectsData[proj.slug] = {
                    title: proj.title,
                    category: proj.category,
                    images: relatedImages
                };
            });
            
            // 4. Render Grid Portfolio
            renderPortfolioGrid(projData, imgData);
        }

    } catch (err) {
        console.error("Gagal load portfolio:", err);
    }
}

// Function render thumbnail
function renderPortfolioGrid(projList, imgList) {
    const gridContainer = document.getElementById('portfolio-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = ''; 

    projList.forEach(proj => {
        const thumb = imgList.find(img => img.project_id === proj.id);
        const thumbUrl = thumb ? thumb.image_url : 'placeholder.jpg';

        const html = `
            <div class="portfolio-item group cursor-pointer relative bg-gray-800 aspect-[3/4]" 
                 data-category="${proj.category.toLowerCase()}" 
                 onclick="openProject('${proj.slug}')">
                <img src="${thumbUrl}" class="w-full h-full object-cover block" loading="lazy">
                <div class="absolute inset-0 portfolio-overlay flex items-center justify-center">
                    <span class="font-serif italic text-2xl text-white">${proj.title}</span>
                </div>
            </div>
        `;
        gridContainer.innerHTML += html;
    });
}

// Update fungsi openProject
function openProject(projectSlug) {
    const project = projectsData[projectSlug]; 
    if (!project) return;

    const titleEl = document.getElementById('modal-title');
    const catEl = document.getElementById('modal-category');
    if(titleEl) titleEl.textContent = project.title;
    if(catEl) catEl.textContent = project.category;
    
    const galleryContainer = document.getElementById('modal-gallery');
    if (!galleryContainer) return;

    const fragment = document.createDocumentFragment();

    project.images.forEach(img => {
        const div = document.createElement('div');
        div.className = `w-full ${img.aspect} bg-gray-800 overflow-hidden relative`;
        div.innerHTML = `<img src="${img.src}" class="w-full h-full object-cover" loading="lazy" decoding="async">`;
        fragment.appendChild(div);
    });

    galleryContainer.innerHTML = ''; 
    galleryContainer.appendChild(fragment);

    const modal = document.getElementById('project-modal');
    modal.classList.remove('hidden');
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo("#modal-gallery > div", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, delay: 0.2 });
}

function closeProject() {
    const modal = document.getElementById('project-modal');
    gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: () => modal.classList.add('hidden') });
}

// --- LOGIC FUNCTIONS ---

// 1. Navigation
function navigateTo(pageId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.getElementById(`link-${pageId}`);
    if(activeLink) activeLink.classList.add('active');

    const targetSection = document.getElementById(pageId);
    const currentSection = document.querySelector('.page-section.active');

    if(currentSection === targetSection) return; 

    if(currentSection) {
        gsap.to(currentSection, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                currentSection.classList.remove('active');
                if(targetSection) {
                    targetSection.classList.add('active');
                    window.scrollTo(0,0);
                    gsap.fromTo(targetSection, 
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
                    );
                }
            }
        });
    } else {
        if(targetSection) {
            targetSection.classList.add('active');
            gsap.fromTo(targetSection, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        }
    }
}

// 2. Filter Logic
function filterSelection(category) {
    const items = document.querySelectorAll('.portfolio-item');
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === category || (category === 'all' && btn.textContent.toLowerCase() === 'all')) {
            btn.classList.add('active');
        }
    });

    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            gsap.to(item, { display: 'block', opacity: 1, scale: 1, duration: 0.4 });
        } else {
            gsap.to(item, { opacity: 0, scale: 0.9, duration: 0.3, onComplete: () => { item.style.display = 'none'; }});
        }
    });
}

// 3. Mobile Menu
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-menu-icon');
    
    if (menu.classList.contains('pointer-events-none')) {
        menu.classList.remove('pointer-events-none', 'opacity-0');
        document.body.style.overflow = 'hidden'; 
        if(icon) {
            icon.classList.remove('fa-bars-staggered');
            icon.classList.add('fa-xmark');
            icon.style.transform = 'rotate(90deg)';
        }
    } else {
        menu.classList.add('pointer-events-none', 'opacity-0');
        document.body.style.overflow = ''; 
        if(icon) {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars-staggered');
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

// 4. Terms Modal
function toggleTerms() {
    const modal = document.getElementById('terms-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        gsap.fromTo(modal.children[1], { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" });
    } else {
        gsap.to(modal.children[1], { scale: 0.95, opacity: 0, duration: 0.2, onComplete: () => modal.classList.add('hidden') });
    }
}

// 5. WhatsApp Handler
function handleWA(e) {
    e.preventDefault();
    const inputs = e.target.elements;
    const text = `Halo Aksara, saya ${inputs[0].value} ingin booking untuk ${inputs[1].value} tanggal ${inputs[2].value}. Note: ${inputs[3].value}`;
    window.open(`https://wa.me/62881026774401?text=${encodeURIComponent(text)}`, '_blank');
}

// 6. Hero Slideshow
function startHeroSlideshow() {
    const slides = document.querySelectorAll('.hero-slide');
    if(slides.length === 0) return;

    let currentSlide = 0;
    
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === 0) slide.classList.add('active');
    });

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000); 
}

// --- INITIALIZATION ---
window.addEventListener('load', () => {
    // Config Tailwind
    if(typeof tailwind !== 'undefined') {
        tailwind.config = tailwindConfig;
    }
    
    // Inisialisasi Tampilan Awal
    const homeSection = document.getElementById("home");
    if(homeSection) {
        gsap.fromTo("#home", { opacity: 0 }, { opacity: 1, duration: 1 });
    }

    startHeroSlideshow();
    
    // Load Database Belakangan
    loadProjects(); 
});