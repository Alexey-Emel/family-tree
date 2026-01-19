/* =====================================================
   СЕМЕЙНОЕ ДРЕВО ОТРЯДА - ЛОГИКА
   Мобильная версия + древо предков
   ===================================================== */


// ==========================================
//  ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================================

let people = [];
let groupNames = {};

const DATA_FILE = 'data.txt';
const GROUPS_FILE = 'groups.txt';

const carouselState = {};


// ==========================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

function formatYear(year) {
    return `${year - 1}-${year}`;
}

function formatGroup(group) {
    return group === 0 ? 10 : group;
}

function getGroupName(year, group) {
    const key = `${year}-${group}`;
    return groupNames[key] || '';
}

function formatGroupDisplay(group, year = null) {
    const num = formatGroup(group);
    if (year) {
        const name = getGroupName(year, group);
        if (name) return `Группа ${num} «${name}»`;
    }
    return `Группа ${num}`;
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

function getGenerationWord(num) {
    if (num === 1) return 'поколение';
    if (num >= 2 && num <= 4) return 'поколения';
    return 'поколений';
}


// ==========================================
//  ПАРСИНГ ДАННЫХ
// ==========================================

function parseGroupNames(text) {
    const names = {};
    const lines = text.trim().split('\n');
    
    lines.forEach(line => {
        line = line.trim();
        if (!line || line.length < 4) return;
        
        const yearCode = parseInt(line.substring(0, 2));
        if (isNaN(yearCode)) return;
        const year = 2000 + yearCode;
        
        const group = parseInt(line[2]);
        if (isNaN(group)) return;
        
        const name = line.substring(3).trim();
        if (!name) return;
        
        names[`${year}-${group}`] = name;
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
//  ДРЕВО ПРЕДКОВ
// ==========================================

/**
 * Получает древо предков для человека
 * Возвращает массив уровней: [[сам], [родители], [бабушки/дедушки], ...]
 */
function getAncestorTree(personId) {
    const person = people.find(p => p.id === personId);
    if (!person) return [];
    
    const levels = [[{ person, role: 'self' }]];
    const visited = new Set([personId]);
    
    let currentLevel = [person];
    
    while (currentLevel.length > 0) {
        const nextLevel = [];
        
        currentLevel.forEach(p => {
            const parents = findParents(p);
            
            parents.forEach(parent => {
                if (!visited.has(parent.id)) {
                    visited.add(parent.id);
                    
                    // Определяем роль родителя
                    const role = getCuratorRole(parent, p.studyYear, p.studyGroup);
                    nextLevel.push({ person: parent, role });
                }
            });
        });
        
        if (nextLevel.length > 0) {
            levels.push(nextLevel);
            currentLevel = nextLevel.map(item => item.person);
        } else {
            break;
        }
    }
    
    return levels;
}

/**
 * Отрисовывает древо предков
 */
function renderAncestorTree(personId) {
    const container = document.getElementById('ancestorsResult');
    const levels = getAncestorTree(personId);
    
    if (levels.length === 0) {
        container.innerHTML = `
            <div class="no-connection">
                <h4>😔 Человек не найден</h4>
            </div>
        `;
        container.classList.add('show');
        return;
    }
    
    if (levels.length === 1) {
        container.innerHTML = `
            <div class="same-person">
                <h4>📭 Нет данных о предках</h4>
                <p>У этого человека не найдены кураторы</p>
            </div>
        `;
        container.classList.add('show');
        return;
    }
    
    const person = levels[0][0].person;
    const totalAncestors = levels.slice(1).reduce((sum, level) => sum + level.length, 0);
    
    let html = `
        <div class="result-info">
            <h4>🌳 Древо предков</h4>
            <p><strong>${getShortName(person)}</strong></p>
            <p>${levels.length - 1} ${getGenerationWord(levels.length - 1)}, ${totalAncestors} предков</p>
        </div>
        <div class="ancestors-tree">
    `;
    
    const levelNames = ['Я', 'Родители', 'Бабушки и дедушки', 'Прабабушки и прадедушки', 'Прапрабабушки и прапрадедушки'];
    
    levels.forEach((level, levelIndex) => {
        const levelName = levelNames[levelIndex] || `${levelIndex} поколение`;
        
        html += `
            <div class="ancestors-level">
                <div class="ancestors-level-label">${levelName}</div>
        `;
        
        level.forEach(({ person: p, role }) => {
            const year = getPersonYear(p);
            let roleClass = '';
            let roleText = '';
            
            if (levelIndex === 0) {
                roleClass = 'level-0';
            } else if (role === 'dad') {
                roleClass = 'dad';
                roleText = levelIndex === 1 ? 'Папа' : 'Дедушка';
            } else {
                roleClass = 'mom';
                roleText = levelIndex === 1 ? 'Мама' : 'Бабушка';
            }
            
            html += `
                <div class="ancestor-person ${roleClass}" onclick="showPersonById(${p.id})">
                    <div class="ancestor-person-name">${getShortName(p)}</div>
                    ${roleText ? `<div class="ancestor-person-role">${roleText}</div>` : ''}
                    ${year ? `<div class="ancestor-person-year">${formatYear(year)}</div>` : ''}
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Добавляем коннектор между уровнями
        if (levelIndex < levels.length - 1) {
            html += `
                <div class="ancestors-connector">
                    <div class="ancestors-connector-line"></div>
                </div>
            `;
        }
    });
    
    html += `</div>`;
    
    container.innerHTML = html;
    container.classList.add('show');
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
//  ОТРИСОВКА СВЯЗИ
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
            <p>${totalSteps} ${getStepsWord(totalSteps)} (↑${stepsUp} ↓${stepsDown})</p>
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
                <span>${stepsUp} ${getStepsWord(stepsUp)}</span>
            </div>
            <div class="branch-path">
    `;
    
    if (leftBranch.length === 0) {
        html += `<div class="branch-empty">—</div>`;
    } else {
        leftBranch.forEach((person, index) => {
            const year = getPersonYear(person);
            const isLast = index === leftBranch.length - 1;
            html += `
                <div class="branch-person ${isLast ? 'person-start' : ''}" onclick="showPersonById(${person.id})">
                    <div class="branch-person-name">${getShortName(person)}</div>
                    ${year ? `<div class="branch-person-year">${formatYear(year)}</div>` : ''}
                </div>
            `;
            if (index < leftBranch.length - 1) {
                html += `<div class="branch-arrow"><div class="branch-arrow-icon">↓</div></div>`;
            }
        });
    }
    html += `</div></div>`;
    
    // Правая ветка
    html += `
        <div class="tree-branch branch-right">
            <div class="branch-header">
                <span>↓</span>
                <span>${stepsDown} ${getStepsWord(stepsDown)}</span>
            </div>
            <div class="branch-path">
    `;
    
    if (rightBranch.length === 0) {
        html += `<div class="branch-empty">—</div>`;
    } else {
        rightBranch.forEach((person, index) => {
            const year = getPersonYear(person);
            const isLast = index === rightBranch.length - 1;
            html += `
                <div class="branch-person ${isLast ? 'person-end' : ''}" onclick="showPersonById(${person.id})">
                    <div class="branch-person-name">${getShortName(person)}</div>
                    ${year ? `<div class="branch-person-year">${formatYear(year)}</div>` : ''}
                </div>
            `;
            if (index < rightBranch.length - 1) {
                html += `<div class="branch-arrow"><div class="branch-arrow-icon">↓</div></div>`;
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
    
    dots.forEach((dot, i) => dot.classList.toggle('active', i === slideIndex));
    
    if (prevBtn) prevBtn.disabled = slideIndex === 0;
    if (nextBtn) nextBtn.disabled = slideIndex === totalSlides - 1;
}

function prevSlide(year) {
    goToSlide(year, (carouselState[year] || 0) - 1);
}

function nextSlide(year) {
    goToSlide(year, (carouselState[year] || 0) + 1);
}


// ==========================================
//  ПОИСК ЛЮДЕЙ (SEARCHABLE SELECT)
// ==========================================

let activeDropdown = null;
let highlightedIndex = -1;

function initSearchSelects() {
    setupSearchSelect('person1');
    setupSearchSelect('person2');
    setupSearchSelect('ancestorPerson');
    
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
        showDropdown(prefix, input.value.trim().toLowerCase());
        hidden.value = '';
        input.classList.remove('has-value');
        updateButtons();
    });
    
    input.addEventListener('focus', () => {
        showDropdown(prefix, input.value.trim().toLowerCase());
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
    
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name, 'ru')).slice(0, 30);
    
    if (filtered.length === 0) {
        dropdown.innerHTML = `<div class="search-select-empty">Никого не найдено</div>`;
    } else {
        dropdown.innerHTML = filtered.map(p => {
            const year = getPersonYear(p);
            const yearStr = year ? formatYear(year) : '';
            
            let groupStr = '';
            if (p.studyGroup !== null && p.studyYear) {
                const groupName = getGroupName(p.studyYear, p.studyGroup);
                groupStr = groupName 
                    ? `, гр. ${formatGroup(p.studyGroup)} «${groupName}»`
                    : `, гр. ${formatGroup(p.studyGroup)}`;
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
    options.forEach((opt, i) => opt.classList.toggle('highlighted', i === highlightedIndex));
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
    
    updateButtons();
}

function closeAllDropdowns() {
    document.querySelectorAll('.search-select-dropdown').forEach(d => d.classList.remove('show'));
    activeDropdown = null;
    highlightedIndex = -1;
}

function updateButtons() {
    const person1 = document.getElementById('person1Select')?.value;
    const person2 = document.getElementById('person2Select')?.value;
    const findBtn = document.getElementById('findConnectionBtn');
    if (findBtn) findBtn.disabled = !person1 || !person2;
    
    const ancestorPerson = document.getElementById('ancestorPersonSelect')?.value;
    const showBtn = document.getElementById('showAncestorsBtn');
    if (showBtn) showBtn.disabled = !ancestorPerson;
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
        container.innerHTML = `<div class="empty-state"><h3>📭 Данные не загружены</h3></div>`;
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
                const q = searchQuery.toLowerCase();
                curators = curators.filter(p => p.name.toLowerCase().includes(q));
                children = children.filter(p => p.name.toLowerCase().includes(q));
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
                    ${validGroups.map((_, i) => `<div class="year-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${year}, ${i})"></div>`).join('')}
                </div>
            </div>
        `;
        
        let carouselHTML = `
            <div class="carousel-container">
                <button class="carousel-btn carousel-btn-prev" onclick="prevSlide(${year})" ${validGroups.length <= 1 ? 'disabled' : ''}>‹</button>
                <div class="carousel-viewport">
                    <div class="carousel-track">
        `;
        
        validGroups.forEach(({ group, curators, children }) => {
            const total = curators.length + children.length;
            const groupName = getGroupName(year, group);
            
            carouselHTML += `
                <div class="carousel-slide">
                    <div class="group-card">
                        <div class="group-header">
                            <div class="group-number">👥 Группа ${formatGroup(group)}</div>
                            ${groupName ? `<div class="group-name">«${groupName}»</div>` : ''}
                            <div class="group-count">${total} человек</div>
                        </div>
                        <div class="family" id="family-${year}-${group}">
                            ${curators.length > 0 ? `<div class="parents" id="parents-${year}-${group}"></div>` : ''}
                            ${children.length > 0 ? `<div class="children" id="children-${year}-${group}"></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        carouselHTML += `</div></div>
            <button class="carousel-btn carousel-btn-next" onclick="nextSlide(${year})" ${validGroups.length <= 1 ? 'disabled' : ''}>›</button>
        </div>`;
        
        yearRow.innerHTML = yearHeader + carouselHTML;
        container.appendChild(yearRow);
        
        validGroups.forEach(({ group, curators, children }) => {
            const parentsEl = document.getElementById(`parents-${year}-${group}`);
            const childrenEl = document.getElementById(`children-${year}-${group}`);
            
            if (parentsEl) {
                curators.forEach(c => parentsEl.appendChild(createPersonCard(c, getCuratorRole(c, year, group))));
            }
            if (childrenEl) {
                children.forEach(c => childrenEl.appendChild(createPersonCard(c)));
            }
        });
    });

    if (!hasContent) {
        container.innerHTML = `<div class="empty-state"><h3>🔍 Ничего не найдено</h3></div>`;
    }
}


// ==========================================
//  МОДАЛЬНЫЕ ОКНА
// ==========================================

function showPersonModal(person) {
    const modal = document.getElementById('personModal');
    document.getElementById('modalAvatar').innerHTML = createAvatarContent(person);
    document.getElementById('modalName').textContent = person.name;

    let birthdayStr = '—';
    if (person.birthday) {
        birthdayStr = new Date(person.birthday).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    let studyStr = '';
    if (person.studyYear) {
        const groupName = getGroupName(person.studyYear, person.studyGroup);
        studyStr = groupName 
            ? `${formatYear(person.studyYear)}, гр. ${formatGroup(person.studyGroup)} «${groupName}»`
            : `${formatYear(person.studyYear)}, гр. ${formatGroup(person.studyGroup)}`;
    }

    let curatorStr = '';
    if (person.curatorHistory.length > 0) {
        curatorStr = person.curatorHistory.map(c => {
            const name = getGroupName(c.year, c.group);
            return name 
                ? `${formatYear(c.year)}, гр. ${formatGroup(c.group)} «${name}»`
                : `${formatYear(c.year)}, гр. ${formatGroup(c.group)}`;
        }).join('<br>');
    }

    document.getElementById('modalInfo').innerHTML = `
        <div class="info-row"><span class="info-label">📅 Дата рождения</span><span class="info-value">${birthdayStr}</span></div>
        <div class="info-row"><span class="info-label">📞 Телефон</span><span class="info-value">${person.phone || '—'}</span></div>
        <div class="info-row"><span class="info-label">💬 ВКонтакте</span>${person.vk ? `<a href="${person.vk}" target="_blank" class="info-link">Открыть</a>` : '<span class="info-value">—</span>'}</div>
        ${studyStr ? `<div class="info-row"><span class="info-label">📚 Обучение</span><span class="info-value">${studyStr}</span></div>` : ''}
        ${curatorStr ? `<div class="info-row info-row-multiline"><span class="info-label">👨‍👩‍👧 Куратор</span><span class="info-value">${curatorStr}</span></div>` : ''}
    `;

    // Кнопка "Показать предков"
    document.getElementById('modalActions').innerHTML = `
        <button class="btn btn-secondary" onclick="closePersonModal(); showAncestorsForPerson(${person.id})">
            🌳 Показать предков
        </button>
    `;

    const parents = findParents(person);
    let familyHTML = '';

    if (parents.length > 0) {
        familyHTML += `<h4>👨‍👩‍👧 Родители:</h4><div class="family-chips">`;
        parents.forEach(p => {
            const hasInfo = p.studyYear && p.studyGroup !== null;
            let chipInfo = '';
            if (hasInfo) {
                const name = getGroupName(p.studyYear, p.studyGroup);
                chipInfo = name 
                    ? `(${formatYear(p.studyYear)}, гр. ${formatGroup(p.studyGroup)} «${name}»)`
                    : `(${formatYear(p.studyYear)}, гр. ${formatGroup(p.studyGroup)})`;
            }
            familyHTML += `<div class="family-chip" onclick="${hasInfo ? `showParentGroup(${p.id})` : `showPersonById(${p.id})`}">
                <span>${getShortName(p)}</span>
                ${chipInfo ? `<span class="family-chip-sub">${chipInfo}</span>` : ''}
            </div>`;
        });
        familyHTML += `</div>`;
    }

    if (person.curatorHistory.length > 0) {
        familyHTML += `<h4 style="margin-top:15px;">👶 Курировал:</h4><div class="family-chips">`;
        person.curatorHistory.forEach(c => {
            const name = getGroupName(c.year, c.group);
            let text = `${formatYear(c.year)}, гр. ${formatGroup(c.group)}`;
            if (name) text += ` «${name}»`;
            familyHTML += `<div class="family-chip" onclick="showGroupModal(${c.year}, ${c.group})">${text}</div>`;
        });
        familyHTML += `</div>`;
    }

    document.getElementById('modalFamily').innerHTML = familyHTML || '<p style="color:var(--text-muted);margin-top:10px;">Нет связей</p>';
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
    if (parent?.studyYear && parent?.studyGroup !== null) {
        closePersonModal();
        showGroupModal(parent.studyYear, parent.studyGroup);
    }
}

function showGroupModal(year, group) {
    const modal = document.getElementById('groupModal');
    const groupName = getGroupName(year, group);
    
    document.getElementById('groupModalTitle').textContent = groupName 
        ? `Группа ${formatGroup(group)} «${groupName}»`
        : `Группа ${formatGroup(group)}`;
    document.getElementById('groupModalSubtitle').textContent = `${formatYear(year)} учебный год`;

    const curators = findCurators(year, group);
    const children = findChildren(year, group);

    let html = '';

    if (curators.length > 0) {
        html += `<div class="group-modal-section"><h4>👨‍👩‍👧 Кураторы</h4><div class="group-person-list">`;
        curators.forEach(c => {
            const role = getCuratorRole(c, year, group);
            html += `<div class="group-person-chip curator-${role}" onclick="closeGroupModal();showPersonById(${c.id})">${getShortName(c)} (${role === 'dad' ? 'Папа' : 'Мама'})</div>`;
        });
        html += `</div></div>`;
    }

    if (children.length > 0) {
        html += `<div class="group-modal-section"><h4>👥 Кандидаты (${children.length})</h4><div class="group-person-list">`;
        children.forEach(c => {
            html += `<div class="group-person-chip" onclick="closeGroupModal();showPersonById(${c.id})">${getShortName(c)}</div>`;
        });
        html += `</div></div>`;
    }

    document.getElementById('groupModalContent').innerHTML = html || '<p style="color:var(--text-muted);text-align:center;">Нет данных</p>';
    modal.classList.add('active');
}

function closeGroupModal() {
    document.getElementById('groupModal').classList.remove('active');
}

function showAncestorsForPerson(personId) {
    // Переключаемся на таб предков
    switchTab('ancestors');
    
    // Заполняем поле поиска
    const person = people.find(p => p.id === personId);
    if (person) {
        document.getElementById('ancestorPersonInput').value = getShortName(person);
        document.getElementById('ancestorPersonInput').classList.add('has-value');
        document.getElementById('ancestorPersonSelect').value = personId;
        updateButtons();
        
        // Показываем древо
        renderAncestorTree(personId);
    }
}


// ==========================================
//  ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ==========================================

function updateFilters() {
    const yearFilter = document.getElementById('yearFilter');
    const groupFilter = document.getElementById('groupFilter');
    
    yearFilter.innerHTML = '<option value="">Год</option>';
    groupFilter.innerHTML = '<option value="">Группа</option>';
    
    getAllYears().forEach(y => yearFilter.innerHTML += `<option value="${y}">${formatYear(y)}</option>`);
    getAllGroups().forEach(g => groupFilter.innerHTML += `<option value="${g}">Группа ${formatGroup(g)}</option>`);
}

function updateStats() {
    document.getElementById('statPeople').textContent = people.length;
    document.getElementById('statYears').textContent = getAllYears().length;
    document.getElementById('statCurators').textContent = people.filter(p => p.curatorHistory.length > 0).length;
    document.getElementById('statGroups').textContent = countUniqueYearGroups();
}


// ==========================================
//  ТАБЫ
// ==========================================

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`));
}


// ==========================================
//  ЗАГРУЗКА ДАННЫХ
// ==========================================

async function loadData() {
    try {
        try {
            const groupsResponse = await fetch(GROUPS_FILE);
            if (groupsResponse.ok) {
                groupNames = parseGroupNames(await groupsResponse.text());
            }
        } catch (e) {}
        
        const response = await fetch(DATA_FILE);
        if (!response.ok) throw new Error(`Файл не найден: ${DATA_FILE}`);
        
        people = parseFileData(await response.text());
        people.forEach((p, i) => p.id = i + 1);
        
        document.getElementById('statsSection').style.display = 'block';
        document.getElementById('tabsSection').style.display = 'block';
        document.getElementById('filtersSection').style.display = 'block';
        
        updateFilters();
        initSearchSelects();
        updateStats();
        renderTree();
        
    } catch (error) {
        console.error(error);
        document.getElementById('treeContainer').innerHTML = `
            <div class="error-state">
                <h3>❌ Ошибка загрузки</h3>
                <p>${error.message}</p>
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
    const showAncestorsBtn = document.getElementById('showAncestorsBtn');
    const allTreeBtn = document.querySelector('[data-filter="all"]');

    loadData();

    // Табы
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Поиск связи
    findConnectionBtn?.addEventListener('click', () => {
        const id1 = parseInt(document.getElementById('person1Select').value);
        const id2 = parseInt(document.getElementById('person2Select').value);
        renderPyramid(findConnectionThroughAncestor(id1, id2));
    });

    // Древо предков
    showAncestorsBtn?.addEventListener('click', () => {
        const id = parseInt(document.getElementById('ancestorPersonSelect').value);
        renderAncestorTree(id);
    });

    // Фильтры
    allTreeBtn?.addEventListener('click', () => {
        yearFilter.value = '';
        groupFilter.value = '';
        searchBox.value = '';
        renderTree();
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        allTreeBtn.classList.add('active');
    });

    yearFilter?.addEventListener('change', () => {
        renderTree(yearFilter.value, groupFilter.value, searchBox.value);
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    });

    groupFilter?.addEventListener('change', () => {
        renderTree(yearFilter.value, groupFilter.value, searchBox.value);
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    });

    let searchTimeout;
    searchBox?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderTree(yearFilter.value, groupFilter.value, searchBox.value);
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        }, 300);
    });

    // Закрытие модалок
    document.getElementById('personModal')?.addEventListener('click', e => {
        if (e.target.id === 'personModal') closePersonModal();
    });

    document.getElementById('groupModal')?.addEventListener('click', e => {
        if (e.target.id === 'groupModal') closeGroupModal();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closePersonModal();
            closeGroupModal();
            closeAllDropdowns();
        }
    });
});