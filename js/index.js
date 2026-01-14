/* =====================================================
   СЕМЕЙНОЕ ДРЕВО ОТРЯДА - ЛОГИКА
   Автор: Студент 2 курса
   Описание: Главный скрипт для работы сайта
   ===================================================== */


// ==========================================
//  ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================================

let people = [];
let groupNames = {}; // Хранит названия групп: { "2026-1": "Узкие взгляды", ... }

const DATA_FILE = 'data.txt';
const GROUPS_FILE = 'groups.txt';

const carouselState = {};


// ==========================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

function formatYear(year) {
    return `${year - 1}-${year}`;
}

/**
 * Форматирует номер группы (0 -> 10)
 */
function formatGroup(group) {
    return group === 0 ? 10 : group;
}

/**
 * Получает название группы по году и номеру
 * @param {number} year - год (например, 2026)
 * @param {number} group - номер группы (0-9)
 * @returns {string} - название или пустая строка
 */
function getGroupName(year, group) {
    const key = `${year}-${group}`;
    return groupNames[key] || '';
}

/**
 * Форматирует отображение группы с названием
 * @param {number} group - номер группы
 * @param {number} year - год (опционально, для получения названия)
 * @returns {string} - "Группа 5" или "Группа 5 «Название»"
 */
function formatGroupDisplay(group, year = null) {
    const num = formatGroup(group);
    if (year) {
        const name = getGroupName(year, group);
        if (name) {
            return `Группа ${num} «${name}»`;
        }
    }
    return `Группа ${num}`;
}

/**
 * Короткое отображение группы для карточек
 */
function formatGroupShort(group, year = null) {
    const num = formatGroup(group);
    if (year) {
        const name = getGroupName(year, group);
        if (name) {
            return `${num} «${name}»`;
        }
    }
    return `${num}`;
}

function getInitials(name) {
    return name
        .split(' ')
        .filter(word => word)
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function getShortName(person) {
    return `${person.lastName} ${person.firstName}`.trim() || person.name;
}

function getStepsWord(num) {
    if (num === 1) return 'шаг';
    if (num >= 2 && num <= 4) return 'шага';
    return 'шагов';
}

function getGroupsWord(num) {
    if (num === 1) return 'группа';
    if (num >= 2 && num <= 4) return 'группы';
    return 'групп';
}


// ==========================================
//  ПАРСИНГ ДАННЫХ ИЗ ФАЙЛА
// ==========================================

/**
 * Парсит файл с названиями групп
 * Формат строки: "261Узкие взгляды" -> год 2026, группа 1, название "Узкие взгляды"
 */
function parseGroupNames(text) {
    const names = {};
    const lines = text.trim().split('\n');
    
    lines.forEach(line => {
        line = line.trim();
        if (!line || line.length < 4) return;
        
        // Первые 2 символа - год (26 -> 2026)
        const yearCode = parseInt(line.substring(0, 2));
        if (isNaN(yearCode)) return;
        const year = 2000 + yearCode;
        
        // 3-й символ - номер группы
        const group = parseInt(line[2]);
        if (isNaN(group)) return;
        
        // Остальное - название
        const name = line.substring(3).trim();
        if (!name) return;
        
        const key = `${year}-${group}`;
        names[key] = name;
    });
    
    return names;
}

function parseExcelDate(dateStr) {
    if (!dateStr || !dateStr.startsWith('д')) return null;
    const excelDate = parseInt(dateStr.substring(1));
    if (isNaN(excelDate)) return null;
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
}

function parsePhone(phoneStr) {
    if (!phoneStr || !phoneStr.startsWith('н')) return '';
    return phoneStr.substring(1);
}

function parseVK(vkStr) {
    if (!vkStr || !vkStr.startsWith('в')) return '';
    return vkStr.substring(1);
}

function parsePhoto(photoStr) {
    if (!photoStr || !photoStr.startsWith('ф')) return '';
    return photoStr.substring(1);
}

function parseHistory(historyStr) {
    if (!historyStr || !historyStr.startsWith('ш')) {
        return { studyYear: null, studyGroup: null, curatorHistory: [] };
    }
    
    const code = historyStr.substring(1);
    const chunks = [];
    
    for (let i = 0; i < code.length; i += 4) {
        const chunk = code.substring(i, i + 4);
        if (chunk.length === 4) chunks.push(chunk);
    }
    
    let studyYear = null;
    let studyGroup = null;
    const curatorHistory = [];
    
    chunks.forEach(chunk => {
        const year = 2000 + parseInt(chunk.substring(0, 2));
        const group = parseInt(chunk[2]);
        const role = parseInt(chunk[3]);
        
        if (role === 1) {
            studyYear = year;
            studyGroup = group;
        } else if (role === 2) {
            curatorHistory.push({ year, group, role: 'dad' });
        } else if (role === 3) {
            curatorHistory.push({ year, group, role: 'mom' });
        }
    });
    
    return { studyYear, studyGroup, curatorHistory };
}

function parseFileData(text) {
    const lines = text.trim().split('\n');
    const parsed = [];
    
    lines.forEach((line, index) => {
        if (!line.trim()) return;
        if (line.includes('Фамилия') && line.includes('Имя')) return;
        
        const parts = line.split('|');
        if (parts.length < 3) return;
        
        const [lastName, firstName, middleName, birthday, phone, vk, history, photo] = parts;
        const parsedHistory = parseHistory(history?.trim());
        
        parsed.push({
            id: index + 1,
            name: `${lastName || ''} ${firstName || ''} ${middleName || ''}`.trim(),
            lastName: (lastName || '').trim(),
            firstName: (firstName || '').trim(),
            middleName: (middleName || '').trim(),
            phone: parsePhone(phone?.trim()),
            birthday: parseExcelDate(birthday?.trim()),
            vk: parseVK(vk?.trim()),
            photo: parsePhoto(photo?.trim()),
            studyYear: parsedHistory.studyYear,
            studyGroup: parsedHistory.studyGroup,
            curatorHistory: parsedHistory.curatorHistory
        });
    });
    
    return parsed;
}


// ==========================================
//  ФУНКЦИИ ПОИСКА
// ==========================================

function findCurators(year, group) {
    return people.filter(person => 
        person.curatorHistory.some(c => c.year === year && c.group === group)
    );
}

function findChildren(year, group) {
    return people.filter(person => 
        person.studyYear === year && person.studyGroup === group
    );
}

function findParents(person) {
    if (!person.studyYear || !person.studyGroup) return [];
    return findCurators(person.studyYear, person.studyGroup);
}

function getCuratorRole(person, year, group) {
    const entry = person.curatorHistory.find(c => c.year === year && c.group === group);
    return entry ? entry.role : 'dad';
}

function getPersonYear(person) {
    return person.studyYear || 
           (person.curatorHistory.length > 0 
               ? Math.min(...person.curatorHistory.map(c => c.year)) 
               : null);
}

function getAllYears() {
    const years = new Set();
    people.forEach(p => {
        if (p.studyYear) years.add(p.studyYear);
        p.curatorHistory.forEach(c => years.add(c.year));
    });
    return Array.from(years).sort((a, b) => b - a);
}

function getAllGroups() {
    const groups = new Set();
    people.forEach(p => {
        if (p.studyGroup !== null && p.studyGroup !== undefined) groups.add(p.studyGroup);
        p.curatorHistory.forEach(c => groups.add(c.group));
    });
    return Array.from(groups).sort((a, b) => {
        const aVal = a === 0 ? 10 : a;
        const bVal = b === 0 ? 10 : b;
        return aVal - bVal;
    });
}

function getGroupsForYear(year) {
    const groups = new Set();
    people.forEach(p => {
        if (p.studyYear === year && p.studyGroup !== null) groups.add(p.studyGroup);
        p.curatorHistory.forEach(c => {
            if (c.year === year) groups.add(c.group);
        });
    });
    return Array.from(groups).sort((a, b) => {
        const aVal = a === 0 ? 10 : a;
        const bVal = b === 0 ? 10 : b;
        return aVal - bVal;
    });
}

function countUniqueYearGroups() {
    const combinations = new Set();
    people.forEach(p => {
        if (p.studyYear && p.studyGroup !== null) {
            combinations.add(`${p.studyYear}-${p.studyGroup}`);
        }
        p.curatorHistory.forEach(c => {
            combinations.add(`${c.year}-${c.group}`);
        });
    });
    return combinations.size;
}


// ==========================================
//  ПОИСК СВЯЗИ МЕЖДУ ЛЮДЬМИ
// ==========================================

function getAncestors(person, visited = new Set()) {
    const ancestors = [];
    if (visited.has(person.id)) return ancestors;
    visited.add(person.id);
    
    const parents = findParents(person);
    parents.forEach(parent => {
        ancestors.push({ person: parent, depth: 1 });
        const parentAncestors = getAncestors(parent, visited);
        parentAncestors.forEach(a => {
            ancestors.push({ person: a.person, depth: a.depth + 1 });
        });
    });
    
    return ancestors;
}

function getPathToAncestor(person, ancestorId, visited = new Set()) {
    if (person.id === ancestorId) return [person];
    if (visited.has(person.id)) return null;
    visited.add(person.id);
    
    const parents = findParents(person);
    for (const parent of parents) {
        const path = getPathToAncestor(parent, ancestorId, new Set([...visited]));
        if (path) return [person, ...path];
    }
    return null;
}

function findConnectionThroughAncestor(person1Id, person2Id) {
    if (person1Id === person2Id) return { type: 'same' };
    
    const person1 = people.find(p => p.id === person1Id);
    const person2 = people.find(p => p.id === person2Id);
    if (!person1 || !person2) return null;

    const parents1 = findParents(person1);
    if (parents1.some(p => p.id === person2Id)) {
        return {
            type: 'ancestor',
            ancestor: person2,
            pathUp: [person1, person2],
            pathDown: []
        };
    }

    const parents2 = findParents(person2);
    if (parents2.some(p => p.id === person1Id)) {
        return {
            type: 'ancestor',
            ancestor: person1,
            pathUp: [person1],
            pathDown: [person2]
        };
    }

    const ancestors1 = getAncestors(person1);
    const ancestors2 = getAncestors(person2);
    ancestors1.unshift({ person: person1, depth: 0 });
    ancestors2.unshift({ person: person2, depth: 0 });

    let commonAncestor = null;
    let minTotalDepth = Infinity;

    for (const a1 of ancestors1) {
        for (const a2 of ancestors2) {
            if (a1.person.id === a2.person.id) {
                const totalDepth = a1.depth + a2.depth;
                if (totalDepth < minTotalDepth) {
                    minTotalDepth = totalDepth;
                    commonAncestor = a1.person;
                }
            }
        }
    }

    if (!commonAncestor) return null;

    const pathUp = getPathToAncestor(person1, commonAncestor.id, new Set()) || [person1];
    const pathToAncestor2 = getPathToAncestor(person2, commonAncestor.id, new Set()) || [person2];
    const pathDown = pathToAncestor2.reverse().slice(1);

    return { type: 'ancestor', ancestor: commonAncestor, pathUp, pathDown };
}


// ==========================================
//  ОТРИСОВКА ДЕРЕВА СВЯЗЕЙ
// ==========================================

function renderPyramid(connection) {
    const container = document.getElementById('connectionResult');
    
    if (!connection) {
        container.innerHTML = `
            <div class="no-connection">
                <h4>😔 Связь не найдена</h4>
                <p>Эти люди не связаны через кураторов</p>
            </div>
        `;
        container.classList.add('show');
        return;
    }

    if (connection.type === 'same') {
        container.innerHTML = `
            <div class="same-person">
                <h4>🤔 Это один и тот же человек</h4>
            </div>
        `;
        container.classList.add('show');
        return;
    }

    const { ancestor, pathUp, pathDown } = connection;
    const leftBranch = pathUp.slice(0, -1).reverse();
    const rightBranch = pathDown;
    const stepsUp = leftBranch.length;
    const stepsDown = rightBranch.length;
    const totalSteps = stepsUp + stepsDown;
    const ancestorYear = getPersonYear(ancestor);
    
    if (totalSteps === 1) {
        const isParentChild = stepsUp === 1;
        const otherPerson = isParentChild ? leftBranch[0] : rightBranch[0];
        const otherYear = getPersonYear(otherPerson);
        
        container.innerHTML = `
            <div class="result-info">
                <h4>✨ Прямая связь!</h4>
                <p>${isParentChild ? 'Ребёнок → Родитель' : 'Родитель → Ребёнок'}</p>
            </div>
            <div class="direct-connection">
                ${isParentChild ? `
                    <div class="branch-person person-start" onclick="showPersonById(${otherPerson.id})">
                        <div class="branch-person-name">${getShortName(otherPerson)}</div>
                        ${otherYear ? `<div class="branch-person-year">${formatYear(otherYear)}</div>` : ''}
                        <div class="branch-person-label">Ребёнок</div>
                    </div>
                    <div class="direct-arrow">
                        <div class="direct-arrow-icon">↑</div>
                        <div class="direct-arrow-label">родитель</div>
                    </div>
                    <div class="ancestor-card" onclick="showPersonById(${ancestor.id})">
                        <div class="ancestor-icon">⭐</div>
                        <div class="ancestor-name">${getShortName(ancestor)}</div>
                        ${ancestorYear ? `<div class="ancestor-year">${formatYear(ancestorYear)}</div>` : ''}
                    </div>
                ` : `
                    <div class="ancestor-card" onclick="showPersonById(${ancestor.id})">
                        <div class="ancestor-icon">⭐</div>
                        <div class="ancestor-name">${getShortName(ancestor)}</div>
                        ${ancestorYear ? `<div class="ancestor-year">${formatYear(ancestorYear)}</div>` : ''}
                    </div>
                    <div class="direct-arrow">
                        <div class="direct-arrow-icon">↓</div>
                        <div class="direct-arrow-label">ребёнок</div>
                    </div>
                    <div class="branch-person person-end" onclick="showPersonById(${otherPerson.id})">
                        <div class="branch-person-name">${getShortName(otherPerson)}</div>
                        ${otherYear ? `<div class="branch-person-year">${formatYear(otherYear)}</div>` : ''}
                        <div class="branch-person-label">Ребёнок</div>
                    </div>
                `}
            </div>
        `;
        container.classList.add('show');
        return;
    }

    let html = `
        <div class="result-info">
            <h4>✨ Связь найдена!</h4>
            <p>Общий предок: <strong>${getShortName(ancestor)}</strong></p>
            <p>Шагов: ${totalSteps} (↑${stepsUp} вверх, ↓${stepsDown} вниз)</p>
        </div>
        <div class="connection-tree">
            <div class="tree-ancestor">
                <div class="ancestor-card" onclick="showPersonById(${ancestor.id})">
                    <div class="ancestor-icon">⭐</div>
                    <div class="ancestor-name">${getShortName(ancestor)}</div>
                    ${ancestorYear ? `<div class="ancestor-year">${formatYear(ancestorYear)}</div>` : ''}
                </div>
            </div>
            <div class="tree-connector">
                <div class="connector-left"></div>
                <div class="connector-right"></div>
            </div>
            <div class="tree-branches">
    `;
    
    // Левая ветка
    html += `
        <div class="tree-branch branch-left">
            <div class="branch-header">
                <span>↑</span>
                <span>Путь к предку (${stepsUp} ${getStepsWord(stepsUp)})</span>
            </div>
            <div class="branch-path">
    `;
    
    if (leftBranch.length === 0) {
        html += `<div class="branch-empty">Прямой потомок</div>`;
    } else {
        leftBranch.forEach((person, index) => {
            const year = getPersonYear(person);
            const isLast = index === leftBranch.length - 1;
            html += `
                <div class="branch-person ${isLast ? 'person-start' : ''}" onclick="showPersonById(${person.id})">
                    <div class="branch-person-name">${getShortName(person)}</div>
                    ${year ? `<div class="branch-person-year">${formatYear(year)}</div>` : ''}
                    ${isLast ? '<div class="branch-person-label">Начало</div>' : ''}
                </div>
            `;
            if (index < leftBranch.length - 1) {
                html += `
                    <div class="branch-arrow">
                        <div class="branch-arrow-line"></div>
                        <div class="branch-arrow-icon">↓</div>
                        <div class="branch-arrow-label">ребёнок</div>
                    </div>
                `;
            }
        });
    }
    html += `</div></div>`;
    
    // Правая ветка
    html += `
        <div class="tree-branch branch-right">
            <div class="branch-header">
                <span>↓</span>
                <span>Путь от предка (${stepsDown} ${getStepsWord(stepsDown)})</span>
            </div>
            <div class="branch-path">
    `;
    
    if (rightBranch.length === 0) {
        html += `<div class="branch-empty">Прямой предок</div>`;
    } else {
        rightBranch.forEach((person, index) => {
            const year = getPersonYear(person);
            const isLast = index === rightBranch.length - 1;
            html += `
                <div class="branch-person ${isLast ? 'person-end' : ''}" onclick="showPersonById(${person.id})">
                    <div class="branch-person-name">${getShortName(person)}</div>
                    ${year ? `<div class="branch-person-year">${formatYear(year)}</div>` : ''}
                    ${isLast ? '<div class="branch-person-label">Конец</div>' : ''}
                </div>
            `;
            if (index < rightBranch.length - 1) {
                html += `
                    <div class="branch-arrow">
                        <div class="branch-arrow-line"></div>
                        <div class="branch-arrow-icon">↓</div>
                        <div class="branch-arrow-label">ребёнок</div>
                    </div>
                `;
            }
        });
    }
    html += `</div></div></div></div>`;

    container.innerHTML = html;
    container.classList.add('show');
}


// ==========================================
//  КАРУСЕЛЬ
// ==========================================

function goToSlide(year, slideIndex) {
    const track = document.querySelector(`[data-year="${year}"] .carousel-track`);
    const dots = document.querySelectorAll(`[data-year="${year}"] .year-dot`);
    const prevBtn = document.querySelector(`[data-year="${year}"] .carousel-btn-prev`);
    const nextBtn = document.querySelector(`[data-year="${year}"] .carousel-btn-next`);
    
    if (!track) return;
    
    const totalSlides = track.children.length;
    
    if (slideIndex < 0) slideIndex = 0;
    if (slideIndex >= totalSlides) slideIndex = totalSlides - 1;
    
    carouselState[year] = slideIndex;
    track.style.transform = `translateX(-${slideIndex * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === slideIndex);
    });
    
    if (prevBtn) prevBtn.disabled = slideIndex === 0;
    if (nextBtn) nextBtn.disabled = slideIndex === totalSlides - 1;
}

function prevSlide(year) {
    const current = carouselState[year] || 0;
    goToSlide(year, current - 1);
}

function nextSlide(year) {
    const current = carouselState[year] || 0;
    goToSlide(year, current + 1);
}


// ==========================================
//  ПОИСК ЛЮДЕЙ (SEARCHABLE SELECT)
// ==========================================

let activeDropdown = null;
let highlightedIndex = -1;

function initSearchSelects() {
    setupSearchSelect('person1');
    setupSearchSelect('person2');
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-select')) {
            closeAllDropdowns();
        }
    });
}

function setupSearchSelect(prefix) {
    const input = document.getElementById(`${prefix}Input`);
    const hidden = document.getElementById(`${prefix}Select`);
    const dropdown = document.getElementById(`${prefix}Dropdown`);
    
    if (!input || !hidden || !dropdown) return;
    
    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        showDropdown(prefix, query);
        hidden.value = '';
        input.classList.remove('has-value');
        updateFindButton();
    });
    
    input.addEventListener('focus', () => {
        const query = input.value.trim().toLowerCase();
        showDropdown(prefix, query);
    });
    
    input.addEventListener('keydown', (e) => {
        const options = dropdown.querySelectorAll('.search-select-option');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1);
            updateHighlight(dropdown, options);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight(dropdown, options);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && options[highlightedIndex]) {
                selectPerson(prefix, options[highlightedIndex].dataset.id);
            }
        } else if (e.key === 'Escape') {
            closeAllDropdowns();
            input.blur();
        }
    });
}

function showDropdown(prefix, query) {
    const dropdown = document.getElementById(`${prefix}Dropdown`);
    if (!dropdown) return;
    
    let filtered = people;
    if (query) {
        filtered = people.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.lastName.toLowerCase().includes(query) ||
            p.firstName.toLowerCase().includes(query)
        );
    }
    
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    filtered = filtered.slice(0, 50);
    
    if (filtered.length === 0) {
        dropdown.innerHTML = `<div class="search-select-empty">Никого не найдено</div>`;
    } else {
        dropdown.innerHTML = filtered.map(p => {
            const year = getPersonYear(p);
            const yearStr = year ? formatYear(year) : '';
            
            let groupStr = '';
            if (p.studyGroup !== null && p.studyGroup !== undefined && p.studyYear) {
                const groupName = getGroupName(p.studyYear, p.studyGroup);
                if (groupName) {
                    groupStr = `, гр. ${formatGroup(p.studyGroup)} «${groupName}»`;
                } else {
                    groupStr = `, гр. ${formatGroup(p.studyGroup)}`;
                }
            }
            
            return `
                <div class="search-select-option" data-id="${p.id}" onclick="selectPerson('${prefix}', ${p.id})">
                    <div class="search-select-option-name">${getShortName(p)}</div>
                    ${yearStr ? `<div class="search-select-option-info">${yearStr}${groupStr}</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    dropdown.classList.add('show');
    activeDropdown = prefix;
    highlightedIndex = -1;
}

function updateHighlight(dropdown, options) {
    options.forEach((opt, i) => {
        opt.classList.toggle('highlighted', i === highlightedIndex);
    });
    
    if (highlightedIndex >= 0 && options[highlightedIndex]) {
        options[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
}

function selectPerson(prefix, personId) {
    const input = document.getElementById(`${prefix}Input`);
    const hidden = document.getElementById(`${prefix}Select`);
    const dropdown = document.getElementById(`${prefix}Dropdown`);
    
    const person = people.find(p => p.id === parseInt(personId));
    if (!person) return;
    
    input.value = getShortName(person);
    input.classList.add('has-value');
    hidden.value = person.id;
    
    dropdown.classList.remove('show');
    activeDropdown = null;
    
    updateFindButton();
}

function closeAllDropdowns() {
    document.querySelectorAll('.search-select-dropdown').forEach(d => {
        d.classList.remove('show');
    });
    activeDropdown = null;
    highlightedIndex = -1;
}

function updateFindButton() {
    const person1 = document.getElementById('person1Select').value;
    const person2 = document.getElementById('person2Select').value;
    const btn = document.getElementById('findConnectionBtn');
    
    btn.disabled = !person1 || !person2;
}


// ==========================================
//  ОТРИСОВКА ИНТЕРФЕЙСА
// ==========================================

function createAvatarContent(person) {
    if (person.photo) {
        return `<img src="${person.photo}" alt="${person.name}" onerror="this.parentElement.innerHTML='${getInitials(person.name)}'">`;
    }
    return getInitials(person.name);
}

function createPersonCard(person, role = '') {
    const card = document.createElement('div');
    card.className = `person-card ${role}`;
    card.dataset.personId = person.id;
    
    card.innerHTML = `
        <div class="person-avatar">${createAvatarContent(person)}</div>
        <div class="person-name">${getShortName(person)}</div>
        ${role ? `<div class="person-role">${role === 'dad' ? 'Папа' : 'Мама'}</div>` : ''}
    `;
    
    card.addEventListener('click', () => showPersonModal(person));
    return card;
}

function renderTree(filterYear = null, filterGroup = null, searchQuery = '') {
    const container = document.getElementById('treeContainer');
    container.innerHTML = '';

    if (people.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📭 Данные не загружены</h3>
                <p>Проверьте наличие файла data.txt</p>
            </div>
        `;
        return;
    }

    const years = getAllYears();
    let hasContent = false;
    
    years.forEach(year => {
        if (filterYear && year !== parseInt(filterYear)) return;

        const groupsForYear = getGroupsForYear(year);
        let validGroups = [];
        
        groupsForYear.forEach(group => {
            if (filterGroup && group !== parseInt(filterGroup)) return;
            
            let curators = findCurators(year, group);
            let children = findChildren(year, group);
            
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                curators = curators.filter(p => p.name.toLowerCase().includes(query));
                children = children.filter(p => p.name.toLowerCase().includes(query));
            }
            
            if (curators.length > 0 || children.length > 0) {
                validGroups.push({ group, curators, children });
            }
        });
        
        if (validGroups.length === 0) return;
        
        hasContent = true;
        
        if (!carouselState[year]) carouselState[year] = 0;
        
        const yearRow = document.createElement('div');
        yearRow.className = 'year-row';
        yearRow.dataset.year = year;
        
        let yearHeader = `
            <div class="year-header">
                <div class="year-title">
                    <span class="year-title-icon">📅</span>
                    <span>${formatYear(year)}</span>
                    <span class="year-groups-count">(${validGroups.length} ${getGroupsWord(validGroups.length)})</span>
                </div>
                <div class="year-dots">
        `;
        
        validGroups.forEach((_, index) => {
            yearHeader += `<div class="year-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${year}, ${index})"></div>`;
        });
        
        yearHeader += `</div></div>`;
        
        let carouselHTML = `
            <div class="carousel-container">
                <button class="carousel-btn carousel-btn-prev" onclick="prevSlide(${year})" ${validGroups.length <= 1 ? 'disabled' : ''}>
                    ‹
                </button>
                <div class="carousel-viewport">
                    <div class="carousel-track">
        `;
        
        validGroups.forEach(({ group, curators, children }) => {
            const totalPeople = curators.length + children.length;
            const groupName = getGroupName(year, group);
            
            carouselHTML += `
                <div class="carousel-slide">
                    <div class="group-card">
                        <div class="group-header">
                            <div class="group-number">
                                <span>👥</span>
                                <span>Группа ${formatGroup(group)}</span>
                            </div>
                            ${groupName ? `<div class="group-name">«${groupName}»</div>` : ''}
                            <div class="group-count">${totalPeople} человек</div>
                        </div>
                        <div class="family" id="family-${year}-${group}">
            `;
            
            if (curators.length > 0) {
                carouselHTML += `<div class="parents" id="parents-${year}-${group}"></div>`;
            }
            
            if (children.length > 0) {
                carouselHTML += `<div class="children" id="children-${year}-${group}"></div>`;
            }
            
            carouselHTML += `</div></div></div>`;
        });
        
        carouselHTML += `
                    </div>
                </div>
                <button class="carousel-btn carousel-btn-next" onclick="nextSlide(${year})" ${validGroups.length <= 1 ? 'disabled' : ''}>
                    ›
                </button>
            </div>
        `;
        
        yearRow.innerHTML = yearHeader + carouselHTML;
        container.appendChild(yearRow);
        
        validGroups.forEach(({ group, curators, children }) => {
            const parentsContainer = document.getElementById(`parents-${year}-${group}`);
            const childrenContainer = document.getElementById(`children-${year}-${group}`);
            
            if (parentsContainer) {
                curators.forEach(curator => {
                    const role = getCuratorRole(curator, year, group);
                    parentsContainer.appendChild(createPersonCard(curator, role));
                });
            }
            
            if (childrenContainer) {
                children.forEach(child => {
                    childrenContainer.appendChild(createPersonCard(child));
                });
            }
        });
    });

    if (!hasContent) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>🔍 Ничего не найдено</h3>
                <p>Попробуй изменить параметры поиска</p>
            </div>
        `;
    }
}


// ==========================================
//  МОДАЛЬНЫЕ ОКНА
// ==========================================

function showPersonModal(person) {
    const modal = document.getElementById('personModal');
    const avatar = document.getElementById('modalAvatar');
    const name = document.getElementById('modalName');
    const info = document.getElementById('modalInfo');
    const family = document.getElementById('modalFamily');

    avatar.innerHTML = createAvatarContent(person);
    name.textContent = person.name;

    let birthdayStr = '—';
    if (person.birthday) {
        const birthday = new Date(person.birthday);
        birthdayStr = birthday.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Формируем строку обучения с названием группы
    let studyStr = '';
    if (person.studyYear) {
        const groupName = getGroupName(person.studyYear, person.studyGroup);
        if (groupName) {
            studyStr = `${formatYear(person.studyYear)}, группа ${formatGroup(person.studyGroup)} «${groupName}»`;
        } else {
            studyStr = `${formatYear(person.studyYear)}, группа ${formatGroup(person.studyGroup)}`;
        }
    }

    // Формируем строку кураторства с названиями групп
    let curatorStr = '';
    if (person.curatorHistory.length > 0) {
        curatorStr = person.curatorHistory.map(c => {
            const groupName = getGroupName(c.year, c.group);
            if (groupName) {
                return `${formatYear(c.year)}, гр. ${formatGroup(c.group)} «${groupName}»`;
            }
            return `${formatYear(c.year)}, гр. ${formatGroup(c.group)}`;
        }).join('<br>');
    }

    info.innerHTML = `
        <div class="info-row">
            <span class="info-label">📅 Дата рождения</span>
            <span class="info-value">${birthdayStr}</span>
        </div>
        <div class="info-row">
            <span class="info-label">📞 Телефон</span>
            <span class="info-value">${person.phone || '—'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">💬 ВКонтакте</span>
            ${person.vk 
                ? `<a href="${person.vk}" target="_blank" class="info-link">Открыть профиль</a>`
                : '<span class="info-value">—</span>'
            }
        </div>
        ${studyStr ? `
        <div class="info-row">
            <span class="info-label">📚 Обучение</span>
            <span class="info-value">${studyStr}</span>
        </div>
        ` : ''}
        ${curatorStr ? `
        <div class="info-row info-row-multiline">
            <span class="info-label">👨‍👩‍👧 Куратор</span>
            <span class="info-value">${curatorStr}</span>
        </div>
        ` : ''}
    `;

    const parents = findParents(person);
    let familyHTML = '';

    if (parents.length > 0) {
        familyHTML += `<h4>👨‍👩‍👧 Родители:</h4><div class="family-chips">`;
        parents.forEach(p => {
            const hasStudyInfo = p.studyYear && p.studyGroup !== null;
            let chipInfo = '';
            if (hasStudyInfo) {
                const groupName = getGroupName(p.studyYear, p.studyGroup);
                if (groupName) {
                    chipInfo = `(${formatYear(p.studyYear)}, гр. ${formatGroup(p.studyGroup)} «${groupName}»)`;
                } else {
                    chipInfo = `(${formatYear(p.studyYear)}, гр. ${formatGroup(p.studyGroup)})`;
                }
            }
            familyHTML += `
                <div class="family-chip" onclick="${hasStudyInfo ? `showParentGroup(${p.id})` : `showPersonById(${p.id})`}">
                    <span>${getShortName(p)}</span>
                    ${chipInfo ? `<span class="family-chip-sub">${chipInfo}</span>` : ''}
                </div>
            `;
        });
        familyHTML += `</div>`;
    }

    if (person.curatorHistory.length > 0) {
        familyHTML += `<h4 style="margin-top: 20px;">👶 Курировал группы:</h4><div class="family-chips">`;
        person.curatorHistory.forEach(c => {
            const groupName = getGroupName(c.year, c.group);
            let chipText = `${formatYear(c.year)}, гр. ${formatGroup(c.group)}`;
            if (groupName) {
                chipText += ` «${groupName}»`;
            }
            familyHTML += `
                <div class="family-chip" onclick="showGroupModal(${c.year}, ${c.group})">
                    ${chipText}
                </div>
            `;
        });
        familyHTML += `</div>`;
    }

    if (!familyHTML) {
        familyHTML = '<p style="color: var(--text-muted); margin-top: 10px;">Нет связей в базе данных</p>';
    }

    family.innerHTML = familyHTML;
    modal.classList.add('active');
}

function closePersonModal() {
    document.getElementById('personModal').classList.remove('active');
}

function showPersonById(id) {
    const person = people.find(p => p.id === id);
    if (person) showPersonModal(person);
}

function showParentGroup(parentId) {
    const parent = people.find(p => p.id === parentId);
    if (parent && parent.studyYear && parent.studyGroup !== null) {
        closePersonModal();
        showGroupModal(parent.studyYear, parent.studyGroup);
    }
}

function showGroupModal(year, group) {
    const modal = document.getElementById('groupModal');
    const title = document.getElementById('groupModalTitle');
    const subtitle = document.getElementById('groupModalSubtitle');
    const content = document.getElementById('groupModalContent');

    const groupName = getGroupName(year, group);
    
    if (groupName) {
        title.textContent = `Группа ${formatGroup(group)} «${groupName}»`;
    } else {
        title.textContent = `Группа ${formatGroup(group)}`;
    }
    subtitle.textContent = `${formatYear(year)} учебный год`;

    const curators = findCurators(year, group);
    const children = findChildren(year, group);

    let contentHTML = '';

    if (curators.length > 0) {
        contentHTML += `
            <div class="group-modal-section">
                <h4>👨‍👩‍👧 Кураторы</h4>
                <div class="group-person-list">
        `;
        curators.forEach(curator => {
            const role = getCuratorRole(curator, year, group);
            contentHTML += `
                <div class="group-person-chip curator-${role}" onclick="closeGroupModal(); showPersonById(${curator.id})">
                    ${getShortName(curator)} (${role === 'dad' ? 'Папа' : 'Мама'})
                </div>
            `;
        });
        contentHTML += `</div></div>`;
    }

    if (children.length > 0) {
        contentHTML += `
            <div class="group-modal-section">
                <h4>👥 Кандидаты (${children.length} чел.)</h4>
                <div class="group-person-list">
        `;
        children.forEach(child => {
            contentHTML += `
                <div class="group-person-chip" onclick="closeGroupModal(); showPersonById(${child.id})">
                    ${getShortName(child)}
                </div>
            `;
        });
        contentHTML += `</div></div>`;
    }

    if (!curators.length && !children.length) {
        contentHTML = '<p style="color: var(--text-muted); text-align: center;">Нет данных об этой группе</p>';
    }

    content.innerHTML = contentHTML;
    modal.classList.add('active');
}

function closeGroupModal() {
    document.getElementById('groupModal').classList.remove('active');
}


// ==========================================
//  ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ==========================================

function updateFilters() {
    const yearFilter = document.getElementById('yearFilter');
    const groupFilter = document.getElementById('groupFilter');
    
    yearFilter.innerHTML = '<option value="">Год</option>';
    groupFilter.innerHTML = '<option value="">Группа</option>';
    
    getAllYears().forEach(year => {
        yearFilter.innerHTML += `<option value="${year}">${formatYear(year)}</option>`;
    });

    getAllGroups().forEach(group => {
        groupFilter.innerHTML += `<option value="${group}">Группа ${formatGroup(group)}</option>`;
    });
}

function updateStats() {
    document.getElementById('statPeople').textContent = people.length;
    document.getElementById('statYears').textContent = getAllYears().length;
    document.getElementById('statCurators').textContent = people.filter(p => p.curatorHistory.length > 0).length;
    document.getElementById('statGroups').textContent = countUniqueYearGroups();
}


// ==========================================
//  ЗАГРУЗКА ДАННЫХ
// ==========================================

async function loadData() {
    try {
        // Загружаем названия групп (если файл есть)
        try {
            const groupsResponse = await fetch(GROUPS_FILE);
            if (groupsResponse.ok) {
                const groupsText = await groupsResponse.text();
                groupNames = parseGroupNames(groupsText);
                console.log(`Загружено ${Object.keys(groupNames).length} названий групп`);
            }
        } catch (e) {
            console.log('Файл groups.txt не найден, названия групп не будут отображаться');
        }
        
        // Загружаем основные данные
        const response = await fetch(DATA_FILE);
        
        if (!response.ok) {
            throw new Error(`Файл не найден: ${DATA_FILE}`);
        }
        
        const text = await response.text();
        people = parseFileData(text);
        people.forEach((p, i) => p.id = i + 1);
        
        document.getElementById('statsSection').style.display = 'block';
        document.getElementById('connectionSection').style.display = 'block';
        document.getElementById('filtersSection').style.display = 'block';
        
        updateFilters();
        initSearchSelects();
        updateStats();
        renderTree();
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        
        document.getElementById('treeContainer').innerHTML = `
            <div class="error-state">
                <h3>❌ Ошибка загрузки</h3>
                <p>${error.message}</p>
                <p style="margin-top: 10px; color: var(--text-secondary);">
                    Убедитесь, что файл data.txt находится в корневой папке проекта
                </p>
            </div>
        `;
    }
}


// ==========================================
//  ИНИЦИАЛИЗАЦИЯ
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const yearFilter = document.getElementById('yearFilter');
    const groupFilter = document.getElementById('groupFilter');
    const searchBox = document.getElementById('searchBox');
    const findConnectionBtn = document.getElementById('findConnectionBtn');
    const allTreeBtn = document.querySelector('[data-filter="all"]');

    loadData();

    findConnectionBtn.addEventListener('click', () => {
        const id1 = parseInt(document.getElementById('person1Select').value);
        const id2 = parseInt(document.getElementById('person2Select').value);
        const connection = findConnectionThroughAncestor(id1, id2);
        renderPyramid(connection);
    });

    allTreeBtn.addEventListener('click', () => {
        yearFilter.value = '';
        groupFilter.value = '';
        searchBox.value = '';
        renderTree();
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        allTreeBtn.classList.add('active');
    });

    yearFilter.addEventListener('change', () => {
        renderTree(yearFilter.value, groupFilter.value, searchBox.value);
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    });

    groupFilter.addEventListener('change', () => {
        renderTree(yearFilter.value, groupFilter.value, searchBox.value);
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    });

    let searchTimeout;
    searchBox.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderTree(yearFilter.value, groupFilter.value, searchBox.value);
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        }, 300);
    });

    document.getElementById('personModal').addEventListener('click', (e) => {
        if (e.target.id === 'personModal') closePersonModal();
    });

    document.getElementById('groupModal').addEventListener('click', (e) => {
        if (e.target.id === 'groupModal') closeGroupModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePersonModal();
            closeGroupModal();
            closeAllDropdowns();
        }
    });
});