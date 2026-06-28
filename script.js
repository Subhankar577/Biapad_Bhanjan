// ==================================================
//  MEDICARE PLUS — Dynamic Medical Shop Application
// ==================================================

// ===================== DATA =====================

const DOCTORS = [
    {id:1,name:"Dr. Rajesh Sharma",specialty:"Cardiologist",qualification:"MD, DM (Cardiology), FACC",experience:18,fees:800,room:"101",phone:"+91 98765 00001",rating:4.9,reviews:342,about:"Renowned cardiologist with expertise in interventional cardiology, heart failure management, and preventive care.",languages:"English, Hindi",image:"fa-heart",schedule:{Monday:{time:"09:00 AM - 01:00 PM"},Wednesday:{time:"10:00 AM - 02:00 PM"},Friday:{time:"09:00 AM - 12:00 PM"},Saturday:{time:"04:00 PM - 07:00 PM"}}},
    {id:2,name:"Dr. Priya Mehta",specialty:"Dermatologist",qualification:"MD (Dermatology), DNB",experience:12,fees:600,room:"102",phone:"+91 98765 00002",rating:4.8,reviews:278,about:"Expert in cosmetic dermatology, skin allergies, acne treatment, and laser procedures.",languages:"English, Hindi, Gujarati",image:"fa-hand-sparkles",schedule:{Monday:{time:"02:00 PM - 06:00 PM"},Tuesday:{time:"10:00 AM - 02:00 PM"},Thursday:{time:"09:00 AM - 01:00 PM"},Saturday:{time:"10:00 AM - 01:00 PM"}}},
    {id:3,name:"Dr. Amit Kumar",specialty:"Orthopedic",qualification:"MS (Ortho), Fellowship Joint Replacement",experience:15,fees:700,room:"103",phone:"+91 98765 00003",rating:4.7,reviews:195,about:"Specialist in joint replacement, sports injuries, fracture management, and spine surgery.",languages:"English, Hindi",image:"fa-bone",schedule:{Tuesday:{time:"09:00 AM - 01:00 PM"},Wednesday:{time:"02:00 PM - 06:00 PM"},Friday:{time:"10:00 AM - 02:00 PM"},Sunday:{time:"10:00 AM - 01:00 PM"}}},
    {id:4,name:"Dr. Sneha Gupta",specialty:"Pediatrician",qualification:"MD (Pediatrics), IAP Fellow",experience:10,fees:500,room:"104",phone:"+91 98765 00004",rating:4.9,reviews:412,about:"Loving pediatrician specializing in newborn care, child nutrition, and vaccination schedules.",languages:"English, Hindi, Bengali",image:"fa-baby",schedule:{Monday:{time:"10:00 AM - 02:00 PM"},Tuesday:{time:"04:00 PM - 08:00 PM"},Wednesday:{time:"10:00 AM - 02:00 PM"},Thursday:{time:"04:00 PM - 08:00 PM"},Friday:{time:"10:00 AM - 01:00 PM"},Saturday:{time:"09:00 AM - 12:00 PM"}}},
    {id:5,name:"Dr. Vikram Singh",specialty:"Neurologist",qualification:"DM (Neurology), FRCP",experience:20,fees:1000,room:"105",phone:"+91 98765 00005",rating:4.8,reviews:267,about:"Senior neurologist with expertise in stroke, epilepsy, Parkinson's, and headache disorders.",languages:"English, Hindi, Punjabi",image:"fa-brain",schedule:{Monday:{time:"03:00 PM - 07:00 PM"},Wednesday:{time:"09:00 AM - 01:00 PM"},Thursday:{time:"02:00 PM - 06:00 PM"},Saturday:{time:"10:00 AM - 02:00 PM"}}},
    {id:6,name:"Dr. Anita Desai",specialty:"Gynecologist",qualification:"MS (OBG), DNB, FRCOG",experience:16,fees:700,room:"106",phone:"+91 98765 00006",rating:4.9,reviews:523,about:"Experienced gynecologist specializing in high-risk pregnancy, infertility, and laparoscopic surgery.",languages:"English, Hindi, Marathi",image:"fa-female",schedule:{Monday:{time:"09:00 AM - 12:00 PM"},Tuesday:{time:"02:00 PM - 06:00 PM"},Thursday:{time:"09:00 AM - 01:00 PM"},Friday:{time:"03:00 PM - 07:00 PM"},Saturday:{time:"10:00 AM - 01:00 PM"}}},
    {id:7,name:"Dr. Suresh Patel",specialty:"ENT Specialist",qualification:"MS (ENT), Fellowship Cochlear Implant",experience:14,fees:600,room:"107",phone:"+91 98765 00007",rating:4.6,reviews:189,about:"ENT specialist with expertise in sinus surgery, hearing problems, and cochlear implantation.",languages:"English, Hindi, Gujarati",image:"fa-ear-listen",schedule:{Tuesday:{time:"09:00 AM - 01:00 PM"},Wednesday:{time:"03:00 PM - 07:00 PM"},Friday:{time:"09:00 AM - 01:00 PM"},Sunday:{time:"10:00 AM - 02:00 PM"}}},
    {id:8,name:"Dr. Kavita Reddy",specialty:"Ophthalmologist",qualification:"MS (Ophthalmology), Fellowship Retina",experience:11,fees:600,room:"108",phone:"+91 98765 00008",rating:4.7,reviews:234,about:"Eye specialist expert in cataract surgery, LASIK, retinal disorders, and glaucoma.",languages:"English, Hindi, Telugu",image:"fa-eye",schedule:{Monday:{time:"10:00 AM - 02:00 PM"},Wednesday:{time:"09:00 AM - 12:00 PM"},Thursday:{time:"03:00 PM - 07:00 PM"},Saturday:{time:"09:00 AM - 01:00 PM"}}},
    {id:9,name:"Dr. Mohammad Ali",specialty:"General Physician",qualification:"MD (Medicine), FICP",experience:22,fees:400,room:"109",phone:"+91 98765 00009",rating:4.8,reviews:678,about:"Senior general physician expert in diabetes, hypertension, fever, infections, and preventive care.",languages:"English, Hindi, Urdu",image:"fa-stethoscope",schedule:{Monday:{time:"09:00 AM - 01:00 PM"},Tuesday:{time:"09:00 AM - 01:00 PM"},Wednesday:{time:"09:00 AM - 01:00 PM"},Thursday:{time:"09:00 AM - 01:00 PM"},Friday:{time:"09:00 AM - 01:00 PM"},Saturday:{time:"09:00 AM - 12:00 PM"},Sunday:{time:"10:00 AM - 12:00 PM"}}},
    {id:10,name:"Dr. Neeraj Joshi",specialty:"Dentist",qualification:"BDS, MDS (Orthodontics)",experience:9,fees:500,room:"110",phone:"+91 98765 00010",rating:4.7,reviews:312,about:"Expert dentist in orthodontics, dental implants, root canal, cosmetic dentistry, and smile makeovers.",languages:"English, Hindi",image:"fa-tooth",schedule:{Monday:{time:"04:00 PM - 08:00 PM"},Tuesday:{time:"10:00 AM - 02:00 PM"},Thursday:{time:"10:00 AM - 02:00 PM"},Friday:{time:"04:00 PM - 08:00 PM"},Saturday:{time:"02:00 PM - 06:00 PM"},Sunday:{time:"10:00 AM - 02:00 PM"}}},
    {id:11,name:"Dr. Pooja Verma",specialty:"Psychiatrist",qualification:"MD (Psychiatry), DPM",experience:13,fees:800,room:"111",phone:"+91 98765 00011",rating:4.9,reviews:198,about:"Compassionate psychiatrist specializing in anxiety, depression, OCD, PTSD, and addiction.",languages:"English, Hindi",image:"fa-head-side-virus",schedule:{Monday:{time:"02:00 PM - 06:00 PM"},Wednesday:{time:"02:00 PM - 06:00 PM"},Friday:{time:"02:00 PM - 06:00 PM"},Saturday:{time:"10:00 AM - 02:00 PM"}}},
    {id:12,name:"Dr. Rakesh Agarwal",specialty:"Urologist",qualification:"MCh (Urology), DNB",experience:17,fees:900,room:"112",phone:"+91 98765 00012",rating:4.6,reviews:156,about:"Experienced urologist in kidney stones, prostate problems, UTI, and minimally invasive surgery.",languages:"English, Hindi",image:"fa-kidneys",schedule:{Tuesday:{time:"03:00 PM - 07:00 PM"},Thursday:{time:"09:00 AM - 01:00 PM"},Saturday:{time:"03:00 PM - 06:00 PM"},Sunday:{time:"10:00 AM - 01:00 PM"}}}
];

const MEDICINES = [
    {id:1,name:"Paracetamol 500mg",category:"tablet",type:"Tablets",desc:"Fever & pain relief",price:30,mrp:45,icon:"fa-tablets"},
    {id:2,name:"Amoxicillin 250mg",category:"tablet",type:"Tablets",desc:"Antibiotic for infections",price:85,mrp:120,icon:"fa-capsules"},
    {id:3,name:"Cetirizine 10mg",category:"tablet",type:"Tablets",desc:"Allergy relief",price:25,mrp:40,icon:"fa-tablets"},
    {id:4,name:"Omeprazole 20mg",category:"tablet",type:"Tablets",desc:"Acidity & ulcer",price:65,mrp:90,icon:"fa-capsules"},
    {id:5,name:"Vitamin D3 Tabs",category:"tablet",type:"Tablets",desc:"Bone health supplement",price:180,mrp:250,icon:"fa-tablets"},
    {id:6,name:"Cough Syrup 100ml",category:"syrup",type:"Syrups",desc:"Dry & wet cough relief",price:95,mrp:130,icon:"fa-prescription-bottle"},
    {id:7,name:"Multivitamin Syrup",category:"syrup",type:"Syrups",desc:"Daily nutrition",price:150,mrp:200,icon:"fa-prescription-bottle"},
    {id:8,name:"Iron Tonic 200ml",category:"syrup",type:"Syrups",desc:"Hemoglobin booster",price:120,mrp:165,icon:"fa-prescription-bottle"},
    {id:9,name:"Digital Thermometer",category:"device",type:"Devices",desc:"Accurate temperature",price:250,mrp:400,icon:"fa-thermometer-half"},
    {id:10,name:"BP Monitor Digital",category:"device",type:"Devices",desc:"Home BP monitoring",price:1500,mrp:2200,icon:"fa-heartbeat"},
    {id:11,name:"Pulse Oximeter",category:"device",type:"Devices",desc:"SpO2 & pulse rate",price:800,mrp:1200,icon:"fa-lungs"},
    {id:12,name:"Glucometer Kit",category:"device",type:"Devices",desc:"Blood sugar testing",price:900,mrp:1500,icon:"fa-tint"},
    {id:13,name:"Hand Sanitizer 500ml",category:"personal",type:"Personal Care",desc:"99.9% germ protection",price:120,mrp:180,icon:"fa-pump-soap"},
    {id:14,name:"N95 Mask (Pack 5)",category:"personal",type:"Personal Care",desc:"5-layer protection",price:200,mrp:350,icon:"fa-head-side-mask"},
    {id:15,name:"Ashwagandha Caps",category:"ayurvedic",type:"Ayurvedic",desc:"Stress & immunity",price:250,mrp:350,icon:"fa-leaf"},
    {id:16,name:"Chyawanprash 500g",category:"ayurvedic",type:"Ayurvedic",desc:"Daily immunity booster",price:280,mrp:380,icon:"fa-seedling"}
];

const SERVICES = [
    {icon:"fa-pills",title:"Quality Medicines",desc:"Wide range of branded & generic medicines at affordable prices.",features:["Branded Medicines","Generic Alternatives","Surgical Items","Free Delivery 500+"]},
    {icon:"fa-user-md",title:"Doctor Consultation",desc:"Daily consultation with specialist doctors across all specializations.",features:["12+ Specializations","Experienced Doctors","Affordable Fees","Online Available"]},
    {icon:"fa-vials",title:"Lab Tests",desc:"Complete pathology & diagnostic lab testing with quick reports.",features:["Blood Tests","X-Ray & Imaging","Home Collection","Same Day Reports"]},
    {icon:"fa-heartbeat",title:"Health Checkup",desc:"Regular health checkup packages for individuals & families.",features:["Full Body Checkup","Heart Health Package","Diabetes Screening","Women's Health"]},
    {icon:"fa-truck",title:"Home Delivery",desc:"Get medicines delivered to your doorstep within hours.",features:["Same Day Delivery","Prescription Upload","Auto Refill","Free Above ₹500"]},
    {icon:"fa-video",title:"Online Consultation",desc:"Consult doctors via video call from comfort of your home.",features:["Video Consultation","E-Prescription","Follow-up Support","Chat Support"]}
];

const TESTIMONIALS = [
    {name:"Rajesh Sharma",initials:"RS",text:"Excellent service! The doctor schedule feature helped me plan my visit perfectly. Dr. Sharma was very helpful and caring.",rating:5,role:"Regular Patient"},
    {name:"Priya Patel",initials:"PP",text:"Best medical shop with great doctors. The online booking saves so much time! Medicine delivery is always on time.",rating:5,role:"Verified Patient"},
    {name:"Amit Kumar",initials:"AK",text:"Very well organized. Knowing which doctor is available on which day is extremely helpful for working professionals like me.",rating:4.5,role:"Regular Patient"},
    {name:"Sunita Devi",initials:"SD",text:"The pediatrician Dr. Sneha is amazing! My kids love visiting her. The whole staff is very friendly and professional.",rating:5,role:"Parent"},
    {name:"Vikash Singh",initials:"VS",text:"Home delivery of medicines is a lifesaver. Quality products at great prices. Highly recommended for senior citizens.",rating:5,role:"Senior Patient"},
    {name:"Neha Gupta",initials:"NG",text:"Booked appointment through website, got confirmed in 2 mins. The whole process is seamless. Love the dark mode too!",rating:4.5,role:"Tech-Savvy Patient"}
];

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ABOUT_FEATURES = [
    {icon:"fa-check-circle",title:"Licensed Pharmacy",desc:"Government licensed pharmacy with qualified pharmacists"},
    {icon:"fa-check-circle",title:"Qualified Doctors",desc:"All doctors are verified with 10+ years experience"},
    {icon:"fa-check-circle",title:"Affordable Prices",desc:"Best prices on medicines and consultation fees"},
    {icon:"fa-check-circle",title:"Patient First",desc:"We prioritize patient satisfaction and comfort"}
];

const CONTACT_INFO = [
    {icon:"fa-map-marker-alt",title:"Our Location",text:"123 Health Street, Medical Colony<br>New Delhi - 110001"},
    {icon:"fa-phone-alt",title:"Phone Numbers",text:"+91 98765 43210<br>+91 11 2345 6789"},
    {icon:"fa-envelope",title:"Email Address",text:"info@medicareplus.com<br>support@medicareplus.com"},
    {icon:"fa-clock",title:"Working Hours",text:"Mon-Sat: 8AM - 10PM<br>Sunday: 9AM - 6PM"}
];

// ===================== STATE =====================
let state = {
    theme: localStorage.getItem('theme') || 'light',
    doctorView: 'grid',
    scheduleView: 'table',
    selectedDay: DAYS[new Date().getDay()],
    currentPage: 1,
    perPage: 6,
    filteredDoctors: [...DOCTORS],
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
    medCategory: 'all',
    testimonialIndex: 0
};

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    applyTheme();
    startLiveClock();
    populateDropdowns();
    renderAll();
    setupScrollEffects();
    setupIntersectionObserver();
    createHeroParticles();
    startTestimonialSlider();
    setMinDate();
});

function initPreloader() {
    const fill = document.getElementById('preloaderFill');
    let w = 0;
    const interval = setInterval(() => {
        w += Math.random() * 15;
        if (w > 100) w = 100;
        fill.style.width = w + '%';
        if (w >= 100) {
            clearInterval(interval);
            setTimeout(() => document.getElementById('preloader').classList.add('done'), 400);
        }
    }, 120);
}

// ===================== THEME =====================
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    applyTheme();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const icon = document.getElementById('themeIcon');
    icon.className = state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===================== LIVE CLOCK =====================
function startLiveClock() {
    const el = document.getElementById('liveTime');
    const update = () => {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' | ' + now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };
    update();
    setInterval(update, 1000);
}

// ===================== DROPDOWNS =====================
function populateDropdowns() {
    const specialties = [...new Set(DOCTORS.map(d => d.specialty))].sort();
    const medCategories = [...new Set(MEDICINES.map(m => m.category))];

    // Filter dropdowns
    populateSelect('filterDay', DAYS.map(d => ({value:d,label:d})), 'all', 'All Days');
    populateSelect('filterSpecialty', specialties.map(s => ({value:s,label:s})), 'all', 'All Specialties');
    populateSelect('aptSpecialty', specialties.map(s => ({value:s,label:s})), '', 'Choose specialty');
    
    // Quick book
    const qs = document.getElementById('quickSpecialty');
    qs.innerHTML = '<option value="">Select Specialty</option>' + specialties.map(s => `<option value="${s}">${s}</option>`).join('');

    // Medicine tabs
    const mt = document.getElementById('medicineTabs');
    mt.innerHTML = `<button class="cat-tab active" onclick="setMedCategory('all',this)">All</button>` +
        medCategories.map(c => `<button class="cat-tab" onclick="setMedCategory('${c}',this)">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`).join('');

    // Auto-select today
    const todayName = getToday();
    document.getElementById('filterDay').value = todayName;
}

function populateSelect(id, options, defaultVal, defaultLabel) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="${defaultVal}">${defaultLabel}</option>` +
        options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

// ===================== RENDER ALL =====================
function renderAll() {
    applyFilters();
    renderTicker();
    renderDayTabs();
    renderSchedule();
    renderServices();
    renderMedicinesGrid();
    renderAbout();
    renderTestimonials();
    renderContact();
    renderFooter();
    updateCartUI();
    countUp();
}

// ===================== UTILITIES =====================
function getToday() { return DAYS[new Date().getDay()]; }
function getInitials(name) { return name.replace('Dr. ','').split(' ').map(n=>n[0]).join('').substring(0,2); }

function showToast(type, title, msg) {
    const icons = {success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast t-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><div class="toast-body"><strong>${title}</strong><span>${msg}</span></div><button class="toast-close-btn" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
}

// ===================== NAVIGATION =====================
function toggleMobileMenu() {
    const nav = document.getElementById('navCenter');
    const ham = document.getElementById('hamburger');
    nav.classList.toggle('active');
    ham.classList.toggle('active');
}

function setupScrollEffects() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const scrollTopBtn = document.getElementById('scrollTop');
        const scrollY = window.scrollY;

        // Navbar
        navbar.classList.toggle('scrolled', scrollY > 80);

        // Scroll top button + progress
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollY / docHeight) * 100;
        scrollTopBtn.classList.toggle('visible', scrollY > 500);
        const circle = document.getElementById('scrollProgressCircle');
        if (circle) circle.style.strokeDashoffset = 283 - (283 * progress / 100);

        // Active nav
        updateActiveNav();
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('navCenter').classList.remove('active');
            document.getElementById('hamburger').classList.remove('active');
        });
    });
}

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 200) current = sec.id;
    });
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-section') === current);
    });
}

function scrollToTop() { window.scrollTo({top:0,behavior:'smooth'}); }

// ===================== INTERSECTION OBSERVER =====================
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {threshold:0.1});
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
        document.querySelectorAll('.service-card,.doctor-card,.med-card,.test-card,.contact-card,.about-card').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }, 500);
}

// ===================== HERO PARTICLES =====================
function createHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        const size = Math.random() * 6 + 2;
        p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:rgba(0,119,182,${Math.random()*0.3+0.1});animation-duration:${Math.random()*6+4}s;animation-delay:${Math.random()*4}s;border-radius:50%;`;
        container.appendChild(p);
    }
}

// ===================== COUNT UP =====================
function countUp() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = +el.dataset.target;
                let current = 0;
                const step = target / 60;
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) { current = target; clearInterval(timer); }
                    el.textContent = Math.floor(current).toLocaleString();
                }, 25);
                observer.unobserve(el);
            }
        });
    }, {threshold:0.5});
    counters.forEach(c => observer.observe(c));
}

// ===================== TICKER =====================
function renderTicker() {
    const today = getToday();
    const todayDocs = DOCTORS.filter(d => d.schedule[today]);
    let items = todayDocs.map(d => 
        `<div class="ticker-item"><i class="fas fa-user-md"></i> ${d.name} (${d.specialty}) — ${d.schedule[today].time}</div>`
    ).join('');
    if (!items) items = '<div class="ticker-item"><i class="fas fa-info-circle"></i> No doctors available today</div>';
    document.getElementById('tickerScroll').innerHTML = items + items; // duplicate for loop
}

// ===================== FILTER & SEARCH =====================
function applyFilters() {
    const day = document.getElementById('filterDay').value;
    const specialty = document.getElementById('filterSpecialty').value;
    const name = document.getElementById('filterName').value.toLowerCase().trim();
    const sort = document.getElementById('sortBy').value;

    let docs = DOCTORS.filter(d => {
        const matchDay = day === 'all' || d.schedule[day];
        const matchSpec = specialty === 'all' || d.specialty === specialty;
        const matchName = !name || d.name.toLowerCase().includes(name);
        return matchDay && matchSpec && matchName;
    });

    // Sort
    switch (sort) {
        case 'rating': docs.sort((a,b) => b.rating - a.rating); break;
        case 'experience': docs.sort((a,b) => b.experience - a.experience); break;
        case 'fees-low': docs.sort((a,b) => a.fees - b.fees); break;
        case 'fees-high': docs.sort((a,b) => b.fees - a.fees); break;
        default: docs.sort((a,b) => a.name.localeCompare(b.name));
    }

    state.filteredDoctors = docs;
    state.currentPage = 1;
    renderDoctorCards();
    renderFilterTags();
    document.getElementById('resultCount').textContent = `Showing ${docs.length} of ${DOCTORS.length} doctors`;
}

function clearFilters() {
    document.getElementById('filterDay').value = 'all';
    document.getElementById('filterSpecialty').value = 'all';
    document.getElementById('filterName').value = '';
    document.getElementById('sortBy').value = 'name';
    applyFilters();
}

function renderFilterTags() {
    const tags = document.getElementById('searchTags');
    const day = document.getElementById('filterDay').value;
    const spec = document.getElementById('filterSpecialty').value;
    const name = document.getElementById('filterName').value.trim();
    let html = '';
    if (day !== 'all') html += `<span class="filter-tag">${day} <button onclick="document.getElementById('filterDay').value='all';applyFilters()">×</button></span>`;
    if (spec !== 'all') html += `<span class="filter-tag">${spec} <button onclick="document.getElementById('filterSpecialty').value='all';applyFilters()">×</button></span>`;
    if (name) html += `<span class="filter-tag">"${name}" <button onclick="document.getElementById('filterName').value='';applyFilters()">×</button></span>`;
    tags.innerHTML = html;
}

// ===================== DOCTORS =====================
function setDoctorView(view, btn) {
    state.doctorView = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderDoctorCards();
}

function renderDoctorCards() {
    const container = document.getElementById('doctorsContainer');
    const today = getToday();
    const start = (state.currentPage - 1) * state.perPage;
    const paginated = state.filteredDoctors.slice(start, start + state.perPage);

    container.className = `doctors-container ${state.doctorView}-view`;

    if (!paginated.length) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-3)"><i class="fas fa-user-md-slash" style="font-size:50px;display:block;margin-bottom:15px"></i><p style="font-size:16px">No doctors found matching your criteria</p></div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    container.innerHTML = paginated.map(doc => {
        const isToday = !!doc.schedule[today];
        const days = Object.keys(doc.schedule);
        return `
        <div class="doctor-card" onclick="openDoctorModal(${doc.id})">
            <div class="doc-card-top">
                <div class="doc-avatar"><i class="fas ${doc.image}"></i></div>
                <h3>${doc.name}</h3>
                <span class="doc-specialty-tag">${doc.specialty}</span>
                <div class="doc-rating"><i class="fas fa-star"></i> ${doc.rating}</div>
            </div>
            <div class="doc-card-body">
                <div class="doc-info-item"><i class="fas fa-graduation-cap"></i><span>${doc.qualification}</span></div>
                <div class="doc-info-item"><i class="fas fa-briefcase"></i><span><strong>${doc.experience} Years</strong> Experience</span></div>
                <div class="doc-info-item"><i class="fas fa-rupee-sign"></i><span>Fee: <strong>₹${doc.fees}</strong></span></div>
                <div class="doc-info-item"><i class="fas fa-star" style="color:#ffd700"></i><span><strong>${doc.rating}</strong> (${doc.reviews} reviews)</span></div>
                <div class="doc-info-item"><i class="fas fa-calendar-alt"></i><span>Available:</span></div>
                <div class="doc-days">${days.map(d => `<span class="day-chip ${d===today?'today':''}">${d.slice(0,3)}</span>`).join('')}</div>
                <div class="doc-today-status ${isToday?'available':'unavailable'}">
                    <i class="fas fa-${isToday?'check':'times'}-circle"></i>
                    ${isToday ? 'Today: ' + doc.schedule[today].time : 'Not available today'}
                </div>
            </div>
            <div class="doc-card-actions" onclick="event.stopPropagation()">
                <button class="btn btn-primary btn-sm" onclick="openDoctorModal(${doc.id})"><i class="fas fa-info-circle"></i> Details</button>
                <button class="btn btn-outline btn-sm" onclick="bookFromDoctor(${doc.id})"><i class="fas fa-calendar-check"></i> Book</button>
            </div>
        </div>`;
    }).join('');

    renderPagination();
    setTimeout(() => setupIntersectionObserver(), 100);
}

function renderPagination() {
    const total = Math.ceil(state.filteredDoctors.length / state.perPage);
    if (total <= 1) { document.getElementById('pagination').innerHTML = ''; return; }
    let html = '';
    if (state.currentPage > 1) html += `<button class="page-btn" onclick="goToPage(${state.currentPage-1})"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= total; i++) {
        html += `<button class="page-btn ${i===state.currentPage?'active':''}" onclick="goToPage(${i})">${i}</button>`;
    }
    if (state.currentPage < total) html += `<button class="page-btn" onclick="goToPage(${state.currentPage+1})"><i class="fas fa-chevron-right"></i></button>`;
    document.getElementById('pagination').innerHTML = html;
}

function goToPage(page) {
    state.currentPage = page;
    renderDoctorCards();
    document.getElementById('doctors').scrollIntoView({behavior:'smooth',block:'start'});
}

// ===================== DOCTOR MODAL =====================
function openDoctorModal(id) {
    const doc = DOCTORS.find(d => d.id === id);
    if (!doc) return;
    const today = getToday();
    const body = document.getElementById('doctorModalBody');

    const schedRows = Object.entries(doc.schedule).map(([day,info]) =>
        `<tr class="${day===today?'today-row':''}"><td>${day}${day===today?' (Today)':''}</td><td>${info.time}</td><td><span class="status-pill s-available">Available</span></td></tr>`
    ).join('');

    body.innerHTML = `
        <div class="modal-doc-header">
            <div class="modal-doc-avatar"><i class="fas ${doc.image}"></i></div>
            <div class="modal-doc-info">
                <h2>${doc.name}</h2>
                <p>${doc.specialty} | ${doc.qualification}</p>
                <div class="stars">${'<i class="fas fa-star"></i>'.repeat(Math.floor(doc.rating))}${doc.rating%1?'<i class="fas fa-star-half-alt"></i>':''}<span>${doc.rating} (${doc.reviews} reviews)</span></div>
            </div>
        </div>
        <div class="modal-section">
            <h3><i class="fas fa-user"></i> About</h3>
            <p style="font-size:14px;color:var(--text-2);line-height:1.7">${doc.about}</p>
        </div>
        <div class="modal-section">
            <h3><i class="fas fa-info-circle"></i> Information</h3>
            <div class="detail-cards">
                <div class="detail-card-item"><i class="fas fa-briefcase"></i><span><strong>Exp:</strong> ${doc.experience} Years</span></div>
                <div class="detail-card-item"><i class="fas fa-rupee-sign"></i><span><strong>Fee:</strong> ₹${doc.fees}</span></div>
                <div class="detail-card-item"><i class="fas fa-door-open"></i><span><strong>Room:</strong> ${doc.room}</span></div>
                <div class="detail-card-item"><i class="fas fa-phone"></i><span><strong>Ph:</strong> ${doc.phone}</span></div>
                <div class="detail-card-item"><i class="fas fa-language"></i><span><strong>Lang:</strong> ${doc.languages}</span></div>
                <div class="detail-card-item"><i class="fas fa-stethoscope"></i><span><strong>Spec:</strong> ${doc.specialty}</span></div>
            </div>
        </div>
        <div class="modal-section">
            <h3><i class="fas fa-calendar-alt"></i> Weekly Schedule</h3>
            <table class="mini-schedule"><thead><tr><th>Day</th><th>Timing</th><th>Status</th></tr></thead><tbody>${schedRows}</tbody></table>
        </div>
        <div class="modal-footer-actions">
            <button class="btn btn-primary" onclick="bookFromDoctor(${doc.id});closeModal('doctorModal')"><i class="fas fa-calendar-check"></i> Book Appointment</button>
            <a href="tel:${doc.phone}" class="btn btn-outline"><i class="fas fa-phone"></i> Call</a>
        </div>`;

    document.getElementById('doctorModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}

// Close on overlay click
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => { m.classList.remove('active'); });
        document.body.style.overflow = '';
    }
});

// ===================== SCHEDULE =====================
function renderDayTabs() {
    const today = getToday();
    document.getElementById('dayTabs').innerHTML = DAYS.map(day =>
        `<button class="day-tab ${day===state.selectedDay?'active':''}" onclick="selectDay('${day}',this)">
            <i class="fas fa-calendar-day"></i> ${day.slice(0,3)}
            ${day===today?'<span class="today-dot">T</span>':''}
        </button>`
    ).join('');

    const todayCount = DOCTORS.filter(d => d.schedule[today]).length;
    document.getElementById('todayBanner').innerHTML = `<span class="today-pill"><i class="fas fa-calendar-check"></i> Today is ${today} — ${todayCount} Doctor(s) Available</span>`;
}

function selectDay(day, btn) {
    state.selectedDay = day;
    document.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSchedule();
}

function setScheduleView(view, btn) {
    state.scheduleView = view;
    document.querySelectorAll('.sched-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSchedule();
}

function renderSchedule() {
    const day = state.selectedDay;
    const today = getToday();
    const docs = DOCTORS.filter(d => d.schedule[day]).sort((a,b) => a.schedule[day].time.localeCompare(b.schedule[day].time));

    if (state.scheduleView === 'table') {
        document.getElementById('scheduleTable').classList.remove('hidden');
        document.getElementById('scheduleTimeline').classList.add('hidden');

        if (!docs.length) {
            document.getElementById('scheduleTable').innerHTML = '<div style="text-align:center;padding:50px;color:var(--text-3)"><i class="fas fa-calendar-times" style="font-size:40px;display:block;margin-bottom:10px"></i>No doctors on ' + day + '</div>';
            return;
        }

        document.getElementById('scheduleTable').innerHTML = `
        <table class="sched-table">
            <thead><tr><th>⏰ Time</th><th>👨‍⚕️ Doctor</th><th>🩺 Specialty</th><th>🏥 Room</th><th>💰 Fee</th><th>📊 Status</th><th>📅 Action</th></tr></thead>
            <tbody>${docs.map(doc => {
                let status = 'Available', statusClass = 's-available';
                if (day === today) {
                    const now = new Date().getHours();
                    const parts = doc.schedule[day].time.split(' - ');
                    const endH = parseInt(parts[1]);
                    const isPM = parts[1].includes('PM');
                    const end24 = isPM && endH !== 12 ? endH + 12 : endH;
                    if (now >= end24) { status = 'Completed'; statusClass = 's-done'; }
                    else {
                        const startH = parseInt(parts[0]);
                        const startPM = parts[0].includes('PM');
                        const start24 = startPM && startH !== 12 ? startH + 12 : startH;
                        if (now >= start24) { status = 'In Session'; statusClass = 's-session'; }
                    }
                }
                return `<tr>
                    <td><strong>${doc.schedule[day].time}</strong></td>
                    <td><div class="doc-name-cell"><div class="table-avatar">${getInitials(doc.name)}</div><strong>${doc.name}</strong></div></td>
                    <td>${doc.specialty}</td>
                    <td>Room ${doc.room}</td>
                    <td><strong>₹${doc.fees}</strong></td>
                    <td><span class="status-pill ${statusClass}">${status}</span></td>
                    <td><button class="tbl-book-btn ${statusClass==='s-done'?'disabled':'active'}" ${statusClass==='s-done'?'disabled':''} onclick="bookFromDoctor(${doc.id})">${statusClass==='s-done'?'Done':'Book'}</button></td>
                </tr>`;
            }).join('')}</tbody>
        </table>`;
    } else {
        // Timeline
        document.getElementById('scheduleTable').classList.add('hidden');
        document.getElementById('scheduleTimeline').classList.remove('hidden');

        if (!docs.length) {
            document.getElementById('scheduleTimeline').innerHTML = '<div style="text-align:center;padding:50px;color:var(--text-3)">No doctors on ' + day + '</div>';
            return;
        }

        document.getElementById('scheduleTimeline').innerHTML = `<div class="timeline-container">${docs.map(doc => `
            <div class="timeline-item">
                <div class="timeline-time"><i class="fas fa-clock"></i> ${doc.schedule[day].time}</div>
                <div class="timeline-doc">
                    <div class="table-avatar">${getInitials(doc.name)}</div>
                    <div class="timeline-doc-info"><h4>${doc.name}</h4><span>${doc.specialty}</span></div>
                </div>
                <div class="timeline-meta">
                    <span><i class="fas fa-door-open"></i> Room ${doc.room}</span>
                    <span><i class="fas fa-rupee-sign"></i> ₹${doc.fees}</span>
                    <span><i class="fas fa-star" style="color:#ffd700"></i> ${doc.rating}</span>
                </div>
            </div>
        `).join('')}</div>`;
    }
}

// ===================== SERVICES =====================
function renderServices() {
    document.getElementById('servicesGrid').innerHTML = SERVICES.map(s => `
        <div class="service-card">
            <div class="service-icon"><i class="fas ${s.icon}"></i></div>
            <h3>${s.title}</h3>
            <p>${s.desc}</p>
            <ul class="service-list">${s.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}</ul>
        </div>
    `).join('');
}

// ===================== MEDICINES =====================
function setMedCategory(cat, btn) {
    state.medCategory = cat;
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMedicinesGrid();
}

function filterMedicines() { renderMedicinesGrid(); }

function renderMedicinesGrid() {
    const search = (document.getElementById('medSearch')?.value || '').toLowerCase().trim();
    let meds = MEDICINES.filter(m => {
        const matchCat = state.medCategory === 'all' || m.category === state.medCategory;
        const matchSearch = !search || m.name.toLowerCase().includes(search);
        return matchCat && matchSearch;
    });

    document.getElementById('medicinesGrid').innerHTML = meds.length ? meds.map(m => {
        const discount = Math.round((1 - m.price/m.mrp)*100);
        return `
        <div class="med-card">
            <div class="med-img"><i class="fas ${m.icon}"></i></div>
            <div class="med-body">
                <span class="med-cat">${m.type}</span>
                <h4>${m.name}</h4>
                <p>${m.desc}</p>
                <div class="med-footer">
                    <span class="med-price">₹${m.price} <small>₹${m.mrp}</small></span>
                    <button class="med-cart-btn" onclick="addToCart(${m.id})" title="Add to cart"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>`;
    }).join('') : '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-3)">No medicines found</div>';
}

// ===================== CART =====================
function addToCart(medId) {
    const med = MEDICINES.find(m => m.id === medId);
    if (!med) return;
    const existing = state.cart.find(c => c.id === medId);
    if (existing) { existing.qty++; }
    else { state.cart.push({...med, qty: 1}); }
    saveCart();
    updateCartUI();
    showToast('success', 'Added to Cart', `${med.name} added`);
}

function removeFromCart(medId) {
    state.cart = state.cart.filter(c => c.id !== medId);
    saveCart();
    updateCartUI();
}

function updateCartQty(medId, delta) {
    const item = state.cart.find(c => c.id === medId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { removeFromCart(medId); return; }
    saveCart();
    updateCartUI();
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }

function updateCartUI() {
    const count = state.cart.reduce((sum, c) => sum + c.qty, 0);
    const total = state.cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    document.getElementById('cartCount').textContent = count;

    const isEmpty = state.cart.length === 0;
    document.getElementById('cartEmpty').classList.toggle('hidden', !isEmpty);
    document.getElementById('cartFooter').classList.toggle('hidden', isEmpty);
    document.getElementById('cartTotal').textContent = '₹' + total.toLocaleString();

    document.getElementById('cartItems').innerHTML = state.cart.map(c => `
        <div class="cart-item">
            <div class="cart-item-img"><i class="fas ${c.icon}"></i></div>
            <div class="cart-item-info"><h4>${c.name}</h4><span>₹${c.price} × ${c.qty} = ₹${c.price*c.qty}</span></div>
            <div class="cart-qty">
                <button onclick="updateCartQty(${c.id},-1)">−</button>
                <span>${c.qty}</span>
                <button onclick="updateCartQty(${c.id},1)">+</button>
            </div>
            <button class="cart-remove" onclick="removeFromCart(${c.id})"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
    document.getElementById('cartOverlay').classList.toggle('active');
}

function checkout() {
    if (!state.cart.length) return;
    showToast('success','🛒 Order Placed!','Your order has been placed successfully!');
    state.cart = [];
    saveCart();
    updateCartUI();
    toggleCart();
}

// ===================== APPOINTMENT =====================
function setMinDate() {
    const d = document.getElementById('aptDate');
    if (d) d.min = new Date().toISOString().split('T')[0];
}

function bookFromDoctor(id) {
    const doc = DOCTORS.find(d => d.id === id);
    if (!doc) return;
    document.getElementById('appointment').scrollIntoView({behavior:'smooth'});
    setTimeout(() => {
        document.getElementById('aptSpecialty').value = doc.specialty;
        updateFormDoctors();
        setTimeout(() => { document.getElementById('aptDoctor').value = doc.id; updateFormSlots(); }, 100);
        nextFormStep(2);
    }, 600);
}

function updateQuickDoctors() {
    const spec = document.getElementById('quickSpecialty').value;
    const sel = document.getElementById('quickDoctor');
    const docs = DOCTORS.filter(d => d.specialty === spec);
    sel.innerHTML = '<option value="">Select Doctor</option>' + docs.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

function quickBook() {
    const docId = document.getElementById('quickDoctor').value;
    if (!docId) { showToast('warning','Select Doctor','Please select specialty and doctor first'); return; }
    bookFromDoctor(+docId);
}

function updateFormDoctors() {
    const spec = document.getElementById('aptSpecialty').value;
    const sel = document.getElementById('aptDoctor');
    const preview = document.getElementById('selectedDocPreview');
    const docs = DOCTORS.filter(d => d.specialty === spec);
    sel.innerHTML = '<option value="">Choose doctor</option>' + docs.map(d => `<option value="${d.id}">${d.name} (${d.experience}yr, ₹${d.fees})</option>`).join('');
    preview.classList.add('hidden');
}

function updateFormSlots() {
    const docId = +document.getElementById('aptDoctor').value;
    const dateVal = document.getElementById('aptDate').value;
    const timeSel = document.getElementById('aptTime');
    const preview = document.getElementById('selectedDocPreview');
    
    const doc = DOCTORS.find(d => d.id === docId);
    if (doc) {
        preview.classList.remove('hidden');
        preview.innerHTML = `<div class="sdp-avatar"><i class="fas ${doc.image}"></i></div><div class="sdp-info"><h4>${doc.name}</h4><p>${doc.specialty} | ₹${doc.fees} | ${doc.experience} yrs | Room ${doc.room}</p></div>`;
    } else { preview.classList.add('hidden'); }

    if (doc && dateVal) {
        const dayName = DAYS[new Date(dateVal).getDay()];
        if (doc.schedule[dayName]) {
            const t = doc.schedule[dayName].time;
            timeSel.innerHTML = `<option value="${t}">${t}</option>`;
        } else {
            timeSel.innerHTML = `<option value="">Doctor not available on ${dayName}</option>`;
        }
    } else {
        timeSel.innerHTML = '<option value="">Select doctor & date first</option>';
    }
}

function nextFormStep(step) {
    // Validate current step
    if (step === 2) {
        const name = document.getElementById('aptName').value;
        const phone = document.getElementById('aptPhone').value;
        const age = document.getElementById('aptAge').value;
        const gender = document.querySelector('input[name="gender"]:checked');
        if (!name || !phone || !age || !gender) {
            showToast('warning','Missing Fields','Please fill all required fields');
            return;
        }
        if (phone.length !== 10) { showToast('warning','Invalid Phone','Enter valid 10-digit phone'); return; }
    }
    if (step === 3) {
        const spec = document.getElementById('aptSpecialty').value;
        const doc = document.getElementById('aptDoctor').value;
        const date = document.getElementById('aptDate').value;
        const time = document.getElementById('aptTime').value;
        if (!spec || !doc || !date || !time) {
            showToast('warning','Missing Fields','Please select all doctor & time fields');
            return;
        }
        renderReview();
    }

    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('formStep' + step).classList.add('active');
    document.querySelectorAll('.form-step').forEach((s,i) => {
        s.classList.remove('active','done');
        if (i + 1 < step) s.classList.add('done');
        if (i + 1 === step) s.classList.add('active');
    });
}

function renderReview() {
    const doc = DOCTORS.find(d => d.id === +document.getElementById('aptDoctor').value);
    const dateVal = document.getElementById('aptDate').value;
    const dateFormatted = dateVal ? new Date(dateVal).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '';
    
    document.getElementById('reviewCard').innerHTML = `
        <div class="review-row"><span>Patient</span><strong>${document.getElementById('aptName').value}</strong></div>
        <div class="review-row"><span>Phone</span><strong>${document.getElementById('aptPhone').value}</strong></div>
        <div class="review-row"><span>Age / Gender</span><strong>${document.getElementById('aptAge').value} / ${document.querySelector('input[name="gender"]:checked')?.value}</strong></div>
        <div class="review-row"><span>Doctor</span><strong>${doc?.name || ''}</strong></div>
        <div class="review-row"><span>Specialty</span><strong>${doc?.specialty || ''}</strong></div>
        <div class="review-row"><span>Date</span><strong>${dateFormatted}</strong></div>
        <div class="review-row"><span>Time</span><strong>${document.getElementById('aptTime').value}</strong></div>
        <div class="review-row"><span>Fee</span><strong>₹${doc?.fees || ''}</strong></div>
        <div class="review-row"><span>Room</span><strong>Room ${doc?.room || ''}</strong></div>`;
}

function submitAppointment(e) {
    e.preventDefault();
    const doc = DOCTORS.find(d => d.id === +document.getElementById('aptDoctor').value);
    const bookingId = 'MC' + Date.now().toString().slice(-8);
    
    document.getElementById('successContent').innerHTML = `
        <div class="success-icon-lg"><i class="fas fa-check-circle"></i></div>
        <h2>Booking Confirmed! 🎉</h2>
        <p>Your appointment has been booked successfully.</p>
        <div class="booking-summary">
            <div class="review-row"><span>Booking ID</span><strong>${bookingId}</strong></div>
            <div class="review-row"><span>Patient</span><strong>${document.getElementById('aptName').value}</strong></div>
            <div class="review-row"><span>Doctor</span><strong>${doc?.name}</strong></div>
            <div class="review-row"><span>Date</span><strong>${new Date(document.getElementById('aptDate').value).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</strong></div>
            <div class="review-row"><span>Time</span><strong>${document.getElementById('aptTime').value}</strong></div>
            <div class="review-row"><span>Fee</span><strong>₹${doc?.fees}</strong></div>
        </div>
        <button class="btn btn-primary btn-block" onclick="closeModal('successModal');resetAppointmentForm()"><i class="fas fa-check"></i> Done</button>`;
    
    document.getElementById('successModal').classList.add('active');
    showToast('success','🎉 Booked!','Appointment confirmed');
}

function resetAppointmentForm() {
    document.getElementById('appointmentForm').reset();
    document.getElementById('selectedDocPreview').classList.add('hidden');
    nextFormStep(1);
}

// ===================== ABOUT =====================
function renderAbout() {
    document.getElementById('aboutFeatures').innerHTML = ABOUT_FEATURES.map(f => `
        <div class="about-feat"><i class="fas ${f.icon}" style="color:var(--secondary)"></i><div><h4>${f.title}</h4><p>${f.desc}</p></div></div>
    `).join('');
}

// ===================== TESTIMONIALS =====================
function renderTestimonials() {
    const slider = document.getElementById('testimonialSlider');
    slider.innerHTML = TESTIMONIALS.map(t => `
        <div class="test-card">
            <div class="test-stars">${'<i class="fas fa-star"></i>'.repeat(Math.floor(t.rating))}${t.rating%1?'<i class="fas fa-star-half-alt"></i>':''}</div>
            <blockquote>"${t.text}"</blockquote>
            <div class="test-author">
                <div class="test-avatar">${t.initials}</div>
                <div class="test-author-info"><h4>${t.name}</h4><span>${t.role}</span></div>
            </div>
        </div>
    `).join('');

    // Slider dots
    const dotsCount = Math.ceil(TESTIMONIALS.length / 3);
    document.getElementById('sliderDots').innerHTML = Array.from({length: dotsCount}, (_, i) =>
        `<span class="slider-dot ${i===0?'active':''}" onclick="slideTestimonials(${i})"></span>`
    ).join('');
}

function startTestimonialSlider() {
    setInterval(() => {
        state.testimonialIndex = (state.testimonialIndex + 1) % Math.ceil(TESTIMONIALS.length / 3);
        slideTestimonials(state.testimonialIndex);
    }, 5000);
}

function slideTestimonials(index) {
    state.testimonialIndex = index;
    const slider = document.getElementById('testimonialSlider');
    const cardWidth = slider.querySelector('.test-card')?.offsetWidth || 300;
    slider.scrollTo({left: index * cardWidth * 3, behavior: 'smooth'});
    document.querySelectorAll('.slider-dot').forEach((d,i) => d.classList.toggle('active', i === index));
}

// ===================== CONTACT =====================
function renderContact() {
    document.getElementById('contactGrid').innerHTML = CONTACT_INFO.map(c => `
        <div class="contact-card">
            <div class="contact-icon"><i class="fas ${c.icon}"></i></div>
            <h4>${c.title}</h4>
            <p>${c.text}</p>
        </div>
    `).join('');
}

// ===================== FOOTER =====================
function renderFooter() {
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    const specialties = [...new Set(DOCTORS.map(d => d.specialty))].slice(0,6);
    
    document.getElementById('footerGrid').innerHTML = `
        <div class="footer-col">
            <div class="footer-logo"><i class="fas fa-plus-circle"></i> Medi<strong>Care</strong> Plus</div>
            <p>Your trusted partner for medicines, doctor consultations, and complete healthcare needs since 2009.</p>
            <div class="footer-socials">
                <a href="#"><i class="fab fa-facebook-f"></i></a>
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
                <a href="#"><i class="fab fa-youtube"></i></a>
                <a href="#"><i class="fab fa-linkedin-in"></i></a>
            </div>
        </div>
        <div class="footer-col">
            <h3>Quick Links</h3>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#doctors">Our Doctors</a></li>
                <li><a href="#schedule">Schedule</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#appointment">Book Appointment</a></li>
                <li><a href="#contact">Contact Us</a></li>
            </ul>
        </div>
        <div class="footer-col">
            <h3>Specialties</h3>
            <ul>${specialties.map(s => `<li><a href="#doctors">${s}</a></li>`).join('')}</ul>
        </div>
        <div class="footer-col">
            <h3>Newsletter</h3>
            <p>Subscribe for health tips & doctor updates.</p>
            <form class="newsletter-form" onsubmit="event.preventDefault();showToast('success','Subscribed!','Thank you for subscribing');">
                <input type="email" placeholder="Your email" required>
                <button type="submit"><i class="fas fa-paper-plane"></i></button>
            </form>
        </div>`;
}