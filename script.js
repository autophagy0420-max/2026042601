const API_URL_BASE = "https://open.neis.go.kr/hub/mealServiceDietInfo";
const OFFICE_CODE = "J10"; // Gyeonggi
const SCHOOL_CODE = "7530074";

const dateInput = document.getElementById('meal-date');
const resultsContainer = document.getElementById('meal-results');
const schoolNameEl = document.getElementById('school-name');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Set default date (using the one from user example or today)
    const defaultDate = "2026-04-24"; 
    dateInput.value = defaultDate;
    fetchMealData(defaultDate.replaceAll('-', ''));
});

// Event listener for date change
dateInput.addEventListener('change', (e) => {
    const selectedDate = e.target.value.replaceAll('-', '');
    if (selectedDate) {
        fetchMealData(selectedDate);
    }
});

async function fetchMealData(dateStr) {
    showLoading();
    
    // Construct full URL
    const url = `${API_URL_BASE}?ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${dateStr}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("네트워크 응답에 문제가 있습니다.");
        
        const xmlText = await response.text();
        parseAndDisplayMeal(xmlText);
    } catch (error) {
        console.error("Error fetching data:", error);
        showError("정보를 불러오는 중 오류가 발생했습니다.");
    }
}

function parseAndDisplayMeal(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    const rows = xmlDoc.getElementsByTagName("row");
    
    if (rows.length === 0) {
        showEmpty();
        return;
    }

    // Update school name if available in the first row
    const firstRow = rows[0];
    const schName = firstRow.getElementsByTagName("SCHUL_NM")[0]?.textContent;
    if (schName) {
        schoolNameEl.textContent = schName;
    }

    resultsContainer.innerHTML = ''; // Clear results

    // Loop through meals (Breakfast, Lunch, Dinner)
    Array.from(rows).forEach((row, index) => {
        const mealType = row.getElementsByTagName("MMEAL_SC_NM")[0]?.textContent;
        const menuHtml = row.getElementsByTagName("DDISH_NM")[0]?.textContent;
        const calories = row.getElementsByTagName("CAL_INFO")[0]?.textContent;
        const origin = row.getElementsByTagName("ORPLC_INFO")[0]?.textContent;

        const card = createMealCard(mealType, menuHtml, calories, origin, index);
        resultsContainer.appendChild(card);
    });
}

function createMealCard(type, menuHtml, calories, origin, index) {
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.style.animationDelay = `${index * 0.1}s`;

    // Clean menu text: remove (numbers) and replace <br/> with list items
    // The NEIS API often uses <br/> inside the DDISH_NM tag
    const cleanMenu = menuHtml
        .replace(/\([0-9.]+\)/g, '') // Remove allergen numbers like (1.2.5.)
        .split('<br/>')
        .map(item => item.trim())
        .filter(item => item !== '');

    card.innerHTML = `
        <h2>
            <span>${type}</span>
            <span class="calorie">${calories}</span>
        </h2>
        <ul class="menu-list">
            ${cleanMenu.map(item => `<li class="menu-item">${item}</li>`).join('')}
        </ul>
        <div class="origin-info">
            <strong>📍 원산지:</strong> ${origin.replace(/<br\/>/g, ', ')}
        </div>
    `;

    return card;
}

function showLoading() {
    resultsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>급식 정보를 가져오고 있습니다...</p>
        </div>
    `;
}

function showEmpty() {
    resultsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🍱</div>
            <p>해당 날짜에는 급식 정보가 없습니다.</p>
        </div>
    `;
}

function showError(msg) {
    resultsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <p>${msg}</p>
        </div>
    `;
}
