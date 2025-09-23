// --- CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES ---
const translations = {
    es: {
        dashboardTitle: "Análisis de Leads y Spend",
        filtersAppliedTitle: "Ver filtros aplicados",
        toggleFiltersTitle: "Mostrar/Ocultar Filtros",
        filtersHeader: "Filtros",
        timeLabel: "Tiempo (Año y Mes)",
        orgLabel: "Organización",
        geoLabel: "Región y País",
        typeLabel: "Type(s)",
        chartControlsLabel: "Controles del Gráfico",
        qtyOption: "Cantidades",
        yoyGrowthOption: "% Crecimiento YOY",
        momGrowthOption: "% Crecimiento MOM",
        shareOption: "% Share by Type",
        shareCalcLabel: "Calcular share sobre:",
        shareSelectedOption: "Total de Types Seleccionados",
        shareAllOption: "Total de Todos los Types",
        displayAccumulated: "Líneas Acumuladas",
        displaySeparated: "Líneas Separadas",
        groupLinesBtn: "Agrupar Líneas",
        showSpendLabel: "Mostrar Spend",
        spendMethodologyOption: "Offline $ per Lead Methodology",
        spendRealOption: "Real",
        modalTitle: "Gestionar Grupos de Líneas",
        modalCreateGroup: "Crear Nuevo Grupo",
        modalGroupName: "Nombre del Grupo:",
        modalGroupNamePlaceholder: "Ej: Publicidad Digital",
        modalSelectTypes: "Seleccionar Types para incluir:",
        modalCreateBtn: "Crear Grupo",
        modalExistingGroups: "Grupos Existentes",
        noFiltersActive: "No hay filtros activos.",
        yAxisPrimary: "Cantidad",
        yAxisGrowth: "% Crecimiento",
        yAxisSpend: "Monto Spend ($)",
        yAxisSecondary: "Eje Secundario",
        yAxisTertiary: "Eje Terciario",
        allOrg: "Todas",
        leadsAccumulated: "Leads Acumulado",
        resetAllFilters: "Limpiar Todos los Filtros", // <-- AÑADIDO
        // Claves para notificaciones
        filterDate: "Fecha", 
        filterOrg: "Org", 
        filterGeo: "Geo", 
        filterTypes: "Types",
        filterChartControl: "Control Gráfico", 
        filterDisplay: "Visualización", 
        filterGroupedLines: "Líneas Agrupadas", 
        filterSpendDisplay: "Spend Visible", 
        filterSpendType: "Tipo de Spend", 
        // Menús contextuales
        selectAll: "Seleccionar Todos",
        deselectAll: "Deselectar Todos",
        invertSelection: "Invertir Selección (este no)",
        isolateSelection: "Aislar Selección (solo este)",
        toggleLine: "Ocultar/Mostrar Línea",
        moveToPrimary: "Mover a Eje Principal",
        moveToSecondary: "Mover a Eje Secundario",
        moveToTertiary: "Mover a Eje Terciario"
    },
    en: {
        dashboardTitle: "Lead & Spend Analysis",
        filtersAppliedTitle: "View applied filters",
        toggleFiltersTitle: "Show/Hide Filters",
        filtersHeader: "Filters",
        timeLabel: "Time (Year & Month)",
        orgLabel: "Organization",
        geoLabel: "Region & Country",
        typeLabel: "Type(s)",
        chartControlsLabel: "Chart Controls",
        qtyOption: "Quantities",
        yoyGrowthOption: "YOY Growth %",
        momGrowthOption: "MOM Growth %",
        shareOption: "Share by Type %",
        shareCalcLabel: "Calculate share based on:",
        shareSelectedOption: "Total of Selected Types",
        shareAllOption: "Total of All Types",
        displayAccumulated: "Accumulated Lines",
        displaySeparated: "Separate Lines",
        groupLinesBtn: "Group Lines",
        showSpendLabel: "Show Spend",
        spendMethodologyOption: "Offline $ per Lead Methodology",
        spendRealOption: "Real",
        modalTitle: "Manage Line Groups",
        modalCreateGroup: "Create New Group",
        modalGroupName: "Group Name:",
        modalGroupNamePlaceholder: "Ex: Digital Advertising",
        modalSelectTypes: "Select Types to include:",
        modalCreateBtn: "Create Group",
        modalExistingGroups: "Existing Groups",
        noFiltersActive: "No active filters.",
        yAxisPrimary: "Quantity",
        yAxisGrowth: "Growth %",
        yAxisSpend: "Spend Amount ($)",
        yAxisSecondary: "Secondary Axis",
        yAxisTertiary: "Tertiary Axis",
        allOrg: "All",
        leadsAccumulated: "Leads Accumulated",
        resetAllFilters: "Clear All Filters", // <-- AÑADIDO
        // Claves para notificaciones
        filterDate: "Date",
        filterOrg: "Org",
        filterGeo: "Geo",
        filterTypes: "Types",
        filterChartControl: "Chart Control", 
        filterDisplay: "Display", 
        filterGroupedLines: "Grouped Lines", 
        filterSpendDisplay: "Spend Visible", 
        filterSpendType: "Spend Type", 
        // Context menus
        selectAll: "Select All",
        deselectAll: "Deselect All",
        invertSelection: "Invert Selection (not this one)",
        isolateSelection: "Isolate Selection (only this one)",
        toggleLine: "Show/Hide Line",
        moveToPrimary: "Move to Primary Axis",
        moveToSecondary: "Move to Secondary Axis",
        moveToTertiary: "Move to Tertiary Axis"
    }
};

const DOMElements = {
    mainContainer: document.getElementById('main-container'),
    chartContainer: document.getElementById('chart-container'),
    filtersPanel: document.getElementById('filters-panel'),
    filterToggleButton: document.getElementById('filter-toggle-btn'),
    resizer: document.getElementById('resizer'),
    fechaArbol: document.getElementById('filtro-fecha-arbol'),
    org: document.getElementById('filtro-org'),
    regionPaisArbol: document.getElementById('filtro-region-pais-arbol'),
    type: document.getElementById('filtro-type'),
    toggleSpend: document.getElementById('toggle-spend'),
    spendOptions: document.getElementById('spend-options'),
    displayOptionsContainer: document.getElementById('display-options-container'),
    shareOptionsContainer: document.getElementById('share-options-container'),
    spendToggleContainer: document.getElementById('spend-toggle-container'),
    canvas: document.getElementById('graficoTendencia').getContext('2d'),
    legendContextMenu: document.getElementById('legend-context-menu'),
    filterContextMenu: document.getElementById('filter-context-menu'),
    groupingModal: document.getElementById('groupingModal'),
    groupLinesBtn: document.getElementById('group-lines-btn'),
    groupTypesChecklist: document.getElementById('group-types-checklist'),
    groupNameInput: document.getElementById('group-name-input'),
    saveGroupBtn: document.getElementById('save-group-btn'),
    existingGroupsList: document.getElementById('existing-groups-list'),
    notificationsBtn: document.getElementById('notifications-btn'),
    filtersCountBadge: document.getElementById('filters-count-badge'),
    appliedFiltersDropdown: document.getElementById('applied-filters-dropdown'),
    languageToggle: document.getElementById('language-toggle'),
    languageSwitchContainer: document.querySelector('.language-switch-container'),
    // ===== ELEMENTOS PARA EL NUEVO MENÚ DE VISTAS GUARDADAS =====
    savedViewsMenu: document.getElementById('saved-views-menu'),
};

let allData = [];
let chartInstance = null;
let contextMenuTarget = null;
let geoStructure = {};
const PAISES_ESPECIALES = ["Turkey", "Brazil", "United States", "Mexico", "Argentina"];
const COLOR_PALETTE = ['#00B0F0', '#92D050', '#FFC000', '#FF00FF', '#FF6600', '#FF3399', '#00FFFF', '#008080', '#002060', '#00FF00', '#A02B93', '#FF0000', '#FFFF00', '#00FF99', '#0070C0', '#CCFF33', '#CC3300', '#008000', '#0000FF', '#595959'];
const countryNomenclatures = { "Argentina": "AR", "Brazil": "BR", "Chile": "CL", "Colombia": "CO", "Mexico": "MX", "Peru": "PE", "United States": "US", "Turkey": "TR", "Spain": "ES" };

let typeColorMap = {};
let annotationPluginRegistered = false;
let datasetStates = {};
let lineGroups = {};

let filterActivationState = {
    date: true,
    org: true,
    geo: true,
    type: true,
    spend: true,
    groups: {}
};


// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    Papa.parse('data/Descarga_Spotfire.csv', {
        download: true, header: true, skipEmptyLines: true,
        complete: (results) => {
            allData = cleanData(results.data);
            populateFilters(allData);
            updateTypeFilterOrder();
            setupEventListeners();
            loadAndRenderSavedViews();
            DOMElements.fechaArbol.querySelectorAll('.parent-checkbox').forEach(updateTreeParentState);
            DOMElements.regionPaisArbol.querySelectorAll('.parent-checkbox').forEach(updateTreeParentState);
            setLanguage('en');
            setTimeout(() => updateDashboard(true), 50);
        }
    });
});

// --- LÓGICA DE LA INTERFAZ (UI) ---
function setupEventListeners() {
    DOMElements.filterToggleButton.addEventListener('click', () => {
        DOMElements.mainContainer.classList.toggle('filters-visible');
        DOMElements.filtersPanel.addEventListener('transitionend', () => { updateDashboard(); }, { once: true });
    });

    makeResizable(DOMElements.filtersPanel, DOMElements.resizer);

    document.addEventListener('click', (e) => {
        DOMElements.legendContextMenu.style.display = 'none';
        DOMElements.filterContextMenu.style.display = 'none';
        if (!DOMElements.notificationsBtn.contains(e.target) && !DOMElements.appliedFiltersDropdown.contains(e.target)) {
            DOMElements.appliedFiltersDropdown.classList.remove('visible');
        }
    });

    DOMElements.org.addEventListener('change', () => {
        filterActivationState.org = true;
        updateTypeFilterOrder();
        updateDashboard(true);
    });

    const radioButtons = DOMElements.filtersPanel.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(el => el.addEventListener('change', () => updateDashboard(true)));
    
    DOMElements.type.addEventListener('change', () => {
        filterActivationState.type = true;
        updateDashboard(true);
    });

    [DOMElements.fechaArbol, DOMElements.regionPaisArbol].forEach(tree => {
        tree.addEventListener('click', (e) => {
            const filterType = tree.dataset.filterType;
            if (e.target.type === 'checkbox') {
                filterActivationState[filterType] = true;
                handleTreeClick(e);
            } else {
                handleTreeClick(e);
            }
        });
    });

    DOMElements.toggleSpend.addEventListener('change', () => {
        filterActivationState.spend = DOMElements.toggleSpend.checked;
        DOMElements.spendOptions.style.display = DOMElements.toggleSpend.checked ? 'block' : 'none';
        updateDashboard(true);
    });
    
    DOMElements.notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOMElements.appliedFiltersDropdown.classList.toggle('visible');
    });

    DOMElements.appliedFiltersDropdown.addEventListener('click', (e) => {
        const target = e.target;

        // --- INICIO: Lógica para el nuevo botón de limpiar ---
        const resetButton = target.closest('#reset-all-filters-btn');
        if (resetButton) {
            resetAllFilters();
            return; // Detiene la ejecución para no interferir con otros listeners
        }
        // --- FIN: Lógica para el nuevo botón de limpiar ---

        if (target.type === 'checkbox' && target.closest('.filter-summary-switch')) {
            const filterType = target.dataset.filter;
            const groupName = target.dataset.groupName;
            const isChecked = target.checked;

            if (groupName) {
                filterActivationState.groups[groupName] = isChecked;
            } else {
                filterActivationState[filterType] = isChecked;
            }
            updateDashboard(false);
        }
        else if (target.classList.contains('remove-filter-btn')) {
            const groupName = target.dataset.groupName;
            if (groupName && lineGroups[groupName]) {
                delete lineGroups[groupName];
                delete filterActivationState.groups[groupName];
                updateExistingGroupsList();
                updateDashboard(true);
            }
        }
    });

    const filterContainers = document.querySelectorAll('[data-filter-type]');
    filterContainers.forEach(container => {
        container.addEventListener('contextmenu', showFilterContextMenu);
    });
    
    DOMElements.filterContextMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = e.target.closest('li')?.dataset.action;
        if (action && contextMenuTarget) {
            applyContextMenuAction(action, contextMenuTarget.type, contextMenuTarget.element, contextMenuTarget.clickedValue);
            DOMElements.filterContextMenu.style.display = 'none';
        }
    });

    DOMElements.languageToggle.addEventListener('change', () => {
        const lang = DOMElements.languageToggle.checked ? 'es' : 'en';
        setLanguage(lang);
    });

    // ===== LISTENER PARA EL NUEVO MENÚ DE VISTAS GUARDADAS =====
    DOMElements.savedViewsMenu.addEventListener('click', handleSavedViewsMenuClick);

    setupChartLegendContextMenu();
    setupGroupingModal();
}

// ... El resto de las funciones (setLanguage, showFilterContextMenu, applyContextMenuAction, etc.) se mantienen igual que en la versión anterior ...
// Se omiten por brevedad, pero deben estar presentes en tu archivo final.
function setLanguage(lang) {
    const t = translations[lang];
    document.documentElement.lang = lang;
    DOMElements.languageToggle.checked = (lang === 'es');

    document.querySelector('.dashboard-title').textContent = t.dashboardTitle;
    DOMElements.notificationsBtn.title = t.filtersAppliedTitle;
    DOMElements.filterToggleButton.title = t.toggleFiltersTitle;
    document.querySelector('.filters-header').textContent = t.filtersHeader;
    document.querySelector('.filters-body .form-group:nth-of-type(1) .form-label').textContent = t.timeLabel;
    document.querySelector('label[for="filtro-org"]').textContent = t.orgLabel;
    document.querySelector('.filters-body .form-group:nth-of-type(3) .form-label').textContent = t.geoLabel;
    document.querySelector('label[for="filtro-type"]').textContent = t.typeLabel;
    const chartControlLabels = document.querySelectorAll('.filters-body > div > label.form-label');
    if(chartControlLabels.length > 0) chartControlLabels[0].textContent = t.chartControlsLabel;
    document.querySelector('label[for="opt-leads-cantidad"]').textContent = t.qtyOption;
    document.querySelector('label[for="opt-leads-yoy"]').textContent = t.yoyGrowthOption;
    document.querySelector('label[for="opt-leads-mom"]').textContent = t.momGrowthOption;
    document.querySelector('label[for="opt-leads-share"]').textContent = t.shareOption;
    document.querySelector('#share-options-container .form-label').textContent = t.shareCalcLabel;
    document.querySelector('label[for="opt-share-selected"]').textContent = t.shareSelectedOption;
    document.querySelector('label[for="opt-share-all"]').textContent = t.shareAllOption;
    document.querySelector('label[for="opt-type-acumulado"]').textContent = t.displayAccumulated;
    document.querySelector('label[for="opt-type-separado"]').textContent = t.displaySeparated;
    DOMElements.groupLinesBtn.textContent = t.groupLinesBtn;
    document.querySelector('label[for="toggle-spend"]').textContent = t.showSpendLabel;
    document.querySelector('label[for="opt-spend-methodology"]').textContent = t.spendMethodologyOption;
    document.querySelector('label[for="opt-spend-real"]').textContent = t.spendRealOption;
    document.getElementById('groupingModalLabel').textContent = t.modalTitle;
    document.querySelector('.col-md-6 h6').textContent = t.modalCreateGroup;
    document.querySelector('label[for="group-name-input"]').textContent = t.modalGroupName;
    DOMElements.groupNameInput.placeholder = t.modalGroupNamePlaceholder;
    document.querySelector('.col-md-6 .form-label:not([for])').textContent = t.modalSelectTypes;
    DOMElements.saveGroupBtn.textContent = t.modalCreateBtn;
    document.querySelectorAll('.col-md-6 h6')[1].textContent = t.modalExistingGroups;
    const allOption = DOMElements.org.querySelector('option[value="all"]');
    if (allOption) allOption.textContent = t.allOrg;
    document.getElementById('ctx-filter-select-all').textContent = t.selectAll;
    document.getElementById('ctx-filter-deselect-all').textContent = t.deselectAll;
    document.getElementById('ctx-filter-invert').textContent = t.invertSelection;
    document.getElementById('ctx-filter-isolate').textContent = t.isolateSelection;
    document.getElementById('ctx-legend-toggle').textContent = t.toggleLine;
    document.getElementById('ctx-legend-primary').textContent = t.moveToPrimary;
    document.getElementById('ctx-legend-secondary').textContent = t.moveToSecondary;
    document.getElementById('ctx-legend-tertiary').textContent = t.moveToTertiary;

    updateDashboard();
}

function showFilterContextMenu(e){e.preventDefault(),e.stopPropagation();const t=e.target.closest("[data-filter-type]"),l=t.dataset.filterType;let a=null;const n=e.target.closest("li, option");n&&("OPTION"===n.tagName?a=n.value:n.querySelector('input[type="checkbox"]')&&(a=n.querySelector('input[type="checkbox"]').dataset.value)),contextMenuTarget={type:l,element:t,clickedValue:a},DOMElements.filterContextMenu.style.display="block";const o=DOMElements.filterContextMenu.offsetWidth;DOMElements.filterContextMenu.style.left=`${e.clientX-o}px`,DOMElements.filterContextMenu.style.top=`${e.clientY}px`}function applyContextMenuAction(e,t,l,a){"date"===t||"geo"===t?(l.querySelectorAll('input[type="checkbox"]').forEach(t=>{let l=!1;"select-all"===e?l=!0:"deselect-all"===e?l=!1:"invert"===e?l=!t.checked:"isolate"===e&&(l=t.dataset.value===a),t.checked=l}),l.querySelectorAll(".parent-checkbox").forEach(updateTreeParentState)):"type"===t&&Array.from(l.options).forEach(t=>{let l=!1;"select-all"===e?l=!0:"deselect-all"===e?l=!1:"invert"===e?l=!t.selected:"isolate"===e&&(l=t.value===a),t.selected=l}),updateDashboard(!0)}function handleTreeClick(e){const t=e.target,l=t.closest("li");if(!l)return;if(t.classList.contains("toggle")||t.classList.contains("parent-label")){const e=l.querySelector(".toggle"),a=l.querySelector(".child-container");if(!a)return;const n=a.style.display==="block";return a.style.display=n?"none":"block",void(e.textContent=n?"[+]":"[-]")}if("checkbox"===t.type){const e=t.classList.contains("parent-checkbox");e&&l.querySelectorAll(".child-checkbox").forEach(e=>e.checked=t.checked);const a=e?t:l.closest(".child-container")?.parentElement.querySelector(".parent-checkbox");a&&updateTreeParentState(a),updateTypeFilterOrder(),updateDashboard(!0)}}function updateTreeParentState(e){const t=e.closest("li"),l=Array.from(t.querySelectorAll(".child-checkbox"));if(0===l.length)return;const a=l.filter(e=>e.checked).length,n=e.closest(".tree-item-label-container");0===a?(e.checked=!1,e.indeterminate=!1,n.classList.remove("indeterminate")):a===l.length?(e.checked=!0,e.indeterminate=!1,n.classList.remove("indeterminate")):(e.checked=!1,e.indeterminate=!0,n.classList.add("indeterminate"))}

// --- INICIO: NUEVA FUNCIÓN PARA LIMPIAR FILTROS ---
function resetAllFilters() {
    // Restablecer árboles de Fecha y Geo
    [DOMElements.fechaArbol, DOMElements.regionPaisArbol].forEach(tree => {
        tree.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
        tree.querySelectorAll('.parent-checkbox').forEach(updateTreeParentState);
    });

    // Restablecer selects
    DOMElements.org.value = 'all';
    Array.from(DOMElements.type.options).forEach(opt => opt.selected = true);

    // Restablecer controles del gráfico
    document.getElementById('opt-leads-cantidad').checked = true;
    document.getElementById('opt-type-acumulado').checked = true;

    // Ocultar y restablecer Spend
    DOMElements.toggleSpend.checked = false;
    DOMElements.spendOptions.style.display = 'none';
    document.getElementById('opt-spend-methodology').checked = true;

    // Limpiar estados internos
    lineGroups = {};
    datasetStates = {};
    Object.keys(filterActivationState).forEach(k => {
        filterActivationState[k] = k !== 'groups';
    });
    filterActivationState.groups = {};

    // Actualizar UI y Dashboard
    updateExistingGroupsList();
    updateTypeFilterOrder();
    updateDashboard(true);
}
// --- FIN: NUEVA FUNCIÓN PARA LIMPIAR FILTROS ---

function resetFilter(filterType) { if (filterType === 'date' || filterType === 'geo') { const tree = filterType === 'date' ? DOMElements.fechaArbol : DOMElements.regionPaisArbol; tree.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; }); tree.querySelectorAll('.parent-checkbox').forEach(updateTreeParentState); } else if (filterType === 'org') { DOMElements.org.value = 'all'; } else if (filterType === 'type') { Array.from(DOMElements.type.options).forEach(opt => opt.selected = true); } if (filterActivationState.hasOwnProperty(filterType)) { filterActivationState[filterType] = true; } updateDashboard(true); }

// --- INICIO: FUNCIÓN MODIFICADA ---
function updateAppliedFiltersNotification() {
    const filters = getFilterState();
    let activeSettings = [];
    const lang = DOMElements.languageToggle.checked ? 'es' : 'en';
    const t = translations[lang];

    const createItem = (label, summary, options = {}) => {
        const { filterType, groupName, isPermanent } = options;
        let controlHtml = '';
        if (!isPermanent) {
            const isActive = groupName ? filterActivationState.groups[groupName] : filterActivationState[filterType];
            controlHtml += `<label class="filter-summary-switch"><input type="checkbox" data-filter="${filterType || ''}" ${groupName ? `data-group-name="${groupName}"` : ''} ${isActive ? 'checked' : ''}><span class="slider"></span></label>`;
        }
        if (groupName) {
            controlHtml += `<span class="remove-filter-btn" data-group-name="${groupName}">&times;</span>`;
        }
        return `<div class="applied-filter-item"><span class="filter-summary-text"><strong>${label}:</strong> ${summary}</span>${controlHtml}</div>`;
    };

    const totalDateCheckboxes = DOMElements.fechaArbol.querySelectorAll('.month-checkbox').length;
    if (filters.dates.length < totalDateCheckboxes) {
        const datesByYear = _.groupBy(filters.dates, 'year');
        const summary = Object.entries(datesByYear).map(([year, months]) => `${year} (${months.map(m=>String(m.month).padStart(2,'0')).join(', ')})`).join('; ');
        activeSettings.push(createItem(t.filterDate, summary, { filterType: 'date' }));
    }

    if (filters.organization !== 'all') {
        activeSettings.push(createItem(t.filterOrg, filters.organization, { filterType: 'org' }));
    }

    const totalCountryCheckboxes = DOMElements.regionPaisArbol.querySelectorAll('.country-checkbox').length;
    if (filters.countries.length < totalCountryCheckboxes) {
        const summaryParts = Object.entries(_.groupBy(filters.countries, c => DOMElements.regionPaisArbol.querySelector(`[data-value="${c}"]`).dataset.region)).map(([region, countries]) => `${region} (${countries.map(c => countryNomenclatures[c] || c).join(', ')})`);
        activeSettings.push(createItem(t.filterGeo, summaryParts.join('; '), { filterType: 'geo' }));
    }

    if (filters.types.length < DOMElements.type.options.length) {
        const summary = filters.types.length > 5 ? `${filters.types.length} ${t.filterTypes}` : filters.types.join(', ');
        activeSettings.push(createItem(t.filterTypes, summary, { filterType: 'type' }));
    }

    let metricLabel = '';
    switch (filters.metricLeads) {
        case 'yoy': metricLabel = t.yoyGrowthOption; break;
        case 'mom': metricLabel = t.momGrowthOption; break;
        case 'share': metricLabel = t.shareOption; break;
        default: metricLabel = t.qtyOption; break;
    }
    activeSettings.push(createItem(t.filterChartControl, metricLabel, { isPermanent: true }));

    if (filters.metricLeads === 'share') {
        const shareCalcLabel = t.shareCalcLabel.replace(':', '');
        const shareCalcValue = filters.shareCalc === 'selected' ? t.shareSelectedOption : t.shareAllOption;
        activeSettings.push(createItem(shareCalcLabel, shareCalcValue, { isPermanent: true }));
    }

    if (filters.metricLeads !== 'share') {
        const displayLabel = filters.displayType === 'acumulado' ? t.displayAccumulated : t.displaySeparated;
        activeSettings.push(createItem(t.filterDisplay, displayLabel, { isPermanent: true }));
    }

    if (Object.keys(lineGroups).length > 0) {
        for (const groupName in lineGroups) {
            const summary = `<span style="color: #6c757d; font-size: 0.9em;">(${lineGroups[groupName].join(', ')})</span>`;
            activeSettings.push(createItem(groupName, summary, { groupName: groupName }));
        }
    }

    if (filters.showSpend) {
        const spendTypeLabel = filters.metricSpend === 'methodology' ? t.spendMethodologyOption : t.spendRealOption;
        activeSettings.push(createItem(t.filterSpendDisplay, spendTypeLabel, { filterType: 'spend' }));
    }
    
    let dropdownHTML = '';
    const hasActiveFilters = (filters.dates.length < totalDateCheckboxes ||
                              filters.organization !== 'all' ||
                              filters.countries.length < totalCountryCheckboxes ||
                              filters.types.length < DOMElements.type.options.length ||
                              Object.keys(lineGroups).length > 0);

    if (hasActiveFilters) {
        dropdownHTML += `<div class="reset-filters-container">
            <button id="reset-all-filters-btn">${t.resetAllFilters}</button>
        </div><hr class="dropdown-divider-custom">`;
    }
    
    DOMElements.filtersCountBadge.textContent = activeSettings.length;
    DOMElements.filtersCountBadge.style.display = activeSettings.length > 0 ? 'block' : 'none';

    if (activeSettings.length > 0) {
        dropdownHTML += activeSettings.join('');
    } else {
        dropdownHTML = `<div style="text-align:center; color: #6c757d; font-size:0.9rem;">${t.noFiltersActive}</div>`;
    }

    DOMElements.appliedFiltersDropdown.innerHTML = dropdownHTML;
}
// --- FIN: FUNCIÓN MODIFICADA ---

function populateFilters(data){const e=_.chain(data).groupBy("year").mapValues(e=>_.sortBy(_.uniq(e.map(e=>e.month)))).value();let t="<ul>";Object.keys(e).sort((e,t)=>t-e).forEach(l=>{t+=`<li><div class="tree-item-label-container"><span class="toggle">[-]</span><input type="checkbox" class="parent-checkbox year-checkbox" data-value="${l}" checked><span class="parent-label label-text">${l}</span></div><ul class="child-container" style="display: block;">${e[l].map(e=>`<li><div class="tree-item-label-container"><input type="checkbox" class="child-checkbox month-checkbox" data-year="${l}" data-month="${e}" data-value="${l}-${e}" checked><span class="label-text">${String(e).padStart(2,"0")}</span></div></li>`).join("")}</ul></li>`}),t+="</ul>",DOMElements.fechaArbol.innerHTML=t,DOMElements.fechaArbol.querySelectorAll(".child-container").forEach((e,t)=>{t>0&&(e.style.display="none")}),DOMElements.fechaArbol.querySelectorAll(".toggle").forEach((e,t)=>{t>0&&(e.textContent="[+]")});const l=_.sortBy(_.uniq(data.map(e=>e.organization)));DOMElements.org.innerHTML='<option value="all">Todas</option>'+l.map(e=>`<option value="${e}">${e}</option>`).join(""),geoStructure=_.chain(data).groupBy("region").mapValues(e=>_.sortBy(_.uniq(e.map(e=>e.country)))).value();let a="<ul>";Object.keys(geoStructure).sort().forEach(e=>{a+=`<li><div class="tree-item-label-container"><span class="toggle">[+]</span><input type="checkbox" class="parent-checkbox region-checkbox" data-value="${e}" checked><span class="parent-label label-text">${e}</span></div><ul class="child-container">${geoStructure[e].map(t=>`<li><div class="tree-item-label-container"><input type="checkbox" class="child-checkbox country-checkbox" data-region="${e}" data-value="${t}" checked><span class="label-text">${t}</span></div></li>`).join("")}</ul></li>`}),a+="</ul>",DOMElements.regionPaisArbol.innerHTML=a;const n=_.sortBy(_.uniq(data.map(e=>e.type)));DOMElements.type.innerHTML=n.map(e=>`<option value="${e}">${e}</option>`).join(""),Array.from(DOMElements.type.options).forEach(e=>e.selected=!0)}
function getFilterState(){const e=[];DOMElements.fechaArbol.querySelectorAll(".month-checkbox:checked").forEach(t=>{e.push({year:parseInt(t.dataset.year),month:parseInt(t.dataset.month)})});const t=[];return DOMElements.regionPaisArbol.querySelectorAll(".country-checkbox:checked").forEach(e=>{t.push(e.dataset.value)}),{dates:e,organization:DOMElements.org.value,countries:t,types:Array.from(DOMElements.type.selectedOptions).map(e=>e.value),metricLeads:document.querySelector('input[name="metric-leads"]:checked').value,displayType:document.querySelector('input[name="display-type"]:checked').value,showSpend:DOMElements.toggleSpend.checked,metricSpend:document.querySelector('input[name="metric-spend"]:checked').value,shareCalc:document.querySelector('input[name="share-calc"]:checked').value}}
function updateDashboard(e=!1){const t=getFilterState();e&&updateAppliedFiltersNotification(),updateControlStates(t);const l=applyFilters(allData,t),a=prepareDataForChart(l,t);renderChart(a,t)}function makeResizable(e,t){let l=!1;t.addEventListener("mousedown",a=>{l=!0,document.body.style.cursor="ew-resize";const n=a=>{if(!l)return;const t=window.innerWidth-a.clientX;e.style.width=`${t}px`,null==chartInstance||chartInstance.resize()},o=()=>{l=!1,document.body.style.cursor="default",document.removeEventListener("mousemove",n),document.removeEventListener("mouseup",o)};document.addEventListener("mousemove",n),document.addEventListener("mouseup",o)})}
function updateControlStates(e){const t=e.metricLeads==="share",l=e.displayType==="acumulado";DOMElements.shareOptionsContainer.style.display=t?"block":"none",DOMElements.displayOptionsContainer.querySelectorAll("input").forEach(e=>e.disabled=t),DOMElements.displayOptionsContainer.style.opacity=t?.5:1,DOMElements.displayOptionsContainer.style.pointerEvents=t?"none":"auto",DOMElements.groupLinesBtn.disabled=l&&!t,DOMElements.groupLinesBtn.style.opacity=l&&!t?.5:1,DOMElements.groupLinesBtn.style.pointerEvents=l&&!t?"none":"auto",DOMElements.spendToggleContainer.querySelector("input").disabled=t,DOMElements.spendToggleContainer.style.opacity=t?.5:1,DOMElements.spendToggleContainer.style.pointerEvents=t?"none":"auto",t&&(DOMElements.toggleSpend.checked=!1,DOMElements.spendOptions.style.display="none")}
function cleanData(e){return e.map(e=>({year:parseInt(e.Year_,10),month:parseInt(e.Month_,10),organization:e.Organization,region:e.Region,country:e.Country,type:e.Type,leads:((t=e["Leads Eligible - Total"])=>"string"!=typeof t||!t?Number(t)||0:parseFloat(t.replace(/[^0-9.-]+/g,""))||0)(),spendMethodology:((t=e["Offline Spend per Leads Methodology"])=>"string"!=typeof t||!t?Number(t)||0:parseFloat(t.replace(/[^0-9.-]+/g,""))||0)(),spendReal:((t=e["Offline Spend Real"])=>"string"!=typeof t||!t?Number(t)||0:parseFloat(t.replace(/[^0-9.-]+/g,""))||0)()}));var t}
function updateTypeFilterOrder(){const e=getFilterState(),t=allData.filter(t=>e.dates.some(l=>l.year===t.year&&l.month===t.month)&&("all"===e.organization||t.organization===e.organization)&&e.countries.includes(t.country)),l=_.chain(t).groupBy("type").map((e,t)=>({type:t,totalLeads:_.sumBy(e,"leads")})).filter(e=>e.totalLeads>0).sortBy("totalLeads").reverse().map("type").value(),a=_.sortBy(_.uniq(allData.map(e=>e.type))),n=[...l,..._.difference(a,l)],o=new Set(Array.from(DOMElements.type.selectedOptions).map(e=>e.value));DOMElements.type.innerHTML="",n.forEach(e=>{const t=document.createElement("option");t.value=e,t.innerText=e,o.has(e)&&(t.selected=!0),DOMElements.type.appendChild(t)})}
function setupChartLegendContextMenu() { DOMElements.legend = { onClick: (e, t, l) => { const a = l.chart, n = getFilterState(); if ("share" === n.metricLeads) { const e = a.data.datasets[t.datasetIndex]; datasetStates[e.label] || (datasetStates[e.label] = { hidden: !1 }), datasetStates[e.label].hidden = !datasetStates[e.label].hidden, updateDashboard() } else { e.native.stopImmediatePropagation(); const l = a.data.datasets[t.datasetIndex], o = l.label.includes("Offline $"), s = n.metricLeads === "cantidad", i = o && s; DOMElements.legendContextMenu.querySelectorAll('li[data-action^="move-"]').forEach(e => e.classList.toggle("disabled", i)), DOMElements.legendContextMenu.style.display = "block"; const d = DOMElements.legendContextMenu.offsetWidth; DOMElements.legendContextMenu.style.left = `${e.native.clientX-d}px`, DOMElements.legendContextMenu.style.top = `${e.native.clientY}px`, DOMElements.legendContextMenu.dataset.datasetIndex = t.datasetIndex } }, labels: { generateLabels: chart => { const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart); const filters = getFilterState(); originalLabels.forEach(label => { const dataset = chart.data.datasets[label.datasetIndex]; if (datasetStates[dataset.label] && datasetStates[dataset.label].hidden) { label.hidden = true; } if (filters.metricLeads !== 'share') { if (dataset.yAxisID === 'ySecondary') { label.text += ' (Sec.)'; } else if (dataset.yAxisID === 'yTertiary') { label.text += ' (Ter.)'; } } }); return originalLabels; } } }; DOMElements.legendContextMenu.addEventListener("click", e => { e.stopPropagation(); const t = e.target.closest("li"); if (!t || t.classList.contains("disabled")) return; const l = t.dataset.action, a = parseInt(DOMElements.legendContextMenu.dataset.datasetIndex), n = chartInstance.data.datasets[a]; datasetStates[n.label] || (datasetStates[n.label] = { hidden: !1, yAxisID: n.yAxisID }), "toggle" === l ? datasetStates[n.label].hidden = !datasetStates[n.label].hidden : "move-to-primary" === l ? datasetStates[n.label].yAxisID = "yLeads" : "move-to-secondary" === l ? datasetStates[n.label].yAxisID = "ySecondary" : "move-to-tertiary" === l && (datasetStates[n.label].yAxisID = "yTertiary"), DOMElements.legendContextMenu.style.display = "none", updateDashboard() }); }
function setupGroupingModal() { DOMElements.groupingModal && DOMElements.groupingModal.addEventListener("shown.bs.modal", updateGroupingModalChecklist); DOMElements.saveGroupBtn.addEventListener("click", () => { const groupName = DOMElements.groupNameInput.value.trim(); const selectedTypes = Array.from(DOMElements.groupTypesChecklist.querySelectorAll("input:checked")).map(cb => cb.value); if (groupName && selectedTypes.length >= 2) { lineGroups[groupName] = selectedTypes; filterActivationState.groups[groupName] = true; DOMElements.groupNameInput.value = ""; DOMElements.groupTypesChecklist.querySelectorAll("input:checked").forEach(cb => cb.checked = false); updateExistingGroupsList(); updateDashboard(true); } else { alert("Por favor, ingresa un nombre para el grupo y selecciona al menos dos Types."); } }); DOMElements.existingGroupsList.addEventListener("click", e => { if (e.target.classList.contains("delete-group-btn")) { const groupName = e.target.dataset.groupName; delete lineGroups[groupName]; delete filterActivationState.groups[groupName]; updateExistingGroupsList(); updateDashboard(true); } }); }
function updateGroupingModalChecklist() { const allUniqueTypes = _.sortBy(_.uniq(allData.map(d => d.type))); DOMElements.groupTypesChecklist.innerHTML = allUniqueTypes.map(type => `<div class="form-check"><input class="form-check-input" type="checkbox" value="${type}" id="check-group-${type}"><label class="form-check-label" for="check-group-${type}">${type}</label></div>`).join(""); }
function updateExistingGroupsList(){let e="";for(const t in lineGroups)e+=`<div class="existing-group-item"><span class="delete-group-btn" data-group-name="${t}">&times;</span><div class="group-name">${t}</div><div class="group-types">${lineGroups[t].join(", ")}</div></div>`;DOMElements.existingGroupsList.innerHTML=e||"<p>Aún no se han creado grupos.</p>"}
function applyFilters(data, filters) { let filteredData = data; if (filterActivationState.org) { filteredData = filteredData.filter(d => filters.organization === 'all' || d.organization === filters.organization); } if (filterActivationState.geo) { filteredData = filteredData.filter(d => filters.countries.includes(d.country)); } const metric = filters.metricLeads; if (metric === 'share' || metric === 'cantidad') { const dateSet = new Set(filters.dates.map(d => `${d.year}-${d.month}`)); return filterActivationState.date ? filteredData.filter(d => dateSet.has(`${d.year}-${d.month}`)) : filteredData; } const requiredDates = new Set(); filters.dates.forEach(d => { requiredDates.add(`${d.year}-${d.month}`); if (metric === 'yoy') requiredDates.add(`${d.year - 1}-${d.month}`); if (metric === 'mom') { const prev = new Date(d.year, d.month - 1, 1); prev.setMonth(prev.getMonth() - 1); requiredDates.add(`${prev.getFullYear()}-${prev.getMonth() + 1}`); } }); return filteredData.filter(d => requiredDates.has(`${d.year}-${d.month}`)); }
function prepareDataForChart(data, filters) { const groupingKey = d => `${d.year}-${String(d.month).padStart(2, '0')}`; let chartLabels = filterActivationState.date ? _.sortBy(_.uniq(filters.dates.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`))) : _.sortBy(_.uniq(data.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`))); const lang = DOMElements.languageToggle.checked ? 'es' : 'en'; const t = translations[lang]; if (filters.metricLeads === 'share') { const itemsToProcess = []; const selectedTypes = new Set(filterActivationState.type ? filters.types : _.uniq(allData.map(d => d.type))); const processedTypes = new Set(); const totalCalculationData = (filters.shareCalc === 'all') ? data : data.filter(d => selectedTypes.has(d.type)); const monthlyTotals = _.chain(totalCalculationData).groupBy(groupingKey).mapValues(g => _.sumBy(g, 'leads')).value(); for (const groupName in lineGroups) { if (filterActivationState.groups[groupName]) { const members = lineGroups[groupName]; if (members.some(type => selectedTypes.has(type))) { itemsToProcess.push({ name: groupName, isGroup: true, members: members }); members.forEach(type => processedTypes.add(type)); } } } selectedTypes.forEach(type => { if (!processedTypes.has(type)) { itemsToProcess.push({ name: type, isGroup: false }); } }); const datasets = []; itemsToProcess.forEach((item, index) => { const typesToSum = item.isGroup ? item.members : [item.name]; const itemDataByMonth = _.chain(data).filter(d => typesToSum.includes(d.type)).groupBy(groupingKey).mapValues(g => _.sumBy(g, 'leads')).value(); const dataPoints = chartLabels.map(label => { const totalForMonth = monthlyTotals[label] || 0; if (totalForMonth === 0) return 0; const itemLeads = itemDataByMonth[label] || 0; return (itemLeads / totalForMonth) * 100; }); datasets.push({ label: item.name, data: dataPoints, backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length], hidden: datasetStates[item.name] ? datasetStates[item.name].hidden : false }); }); return { labels: chartLabels, datasets }; } const groupedData = _.groupBy(data, groupingKey); let datasets = []; let itemsToProcess; if (filters.displayType === 'acumulado') { itemsToProcess = [{ name: 'accumulated_key', isGroup: false }]; } else { const selectedTypes = new Set(filterActivationState.type ? filters.types : _.uniq(allData.map(d => d.type))); const processedTypes = new Set(); const finalDisplayItems = []; for (const groupName in lineGroups) { if (filterActivationState.groups[groupName]) { const members = lineGroups[groupName]; finalDisplayItems.push({ name: groupName, isGroup: true, members: members }); members.forEach(type => processedTypes.add(type)); } } selectedTypes.forEach(type => { if (!processedTypes.has(type)) { finalDisplayItems.push({ name: type, isGroup: false }); } }); itemsToProcess = finalDisplayItems; } itemsToProcess.forEach((itemInfo, index) => { const item = itemInfo.name; const monthlyValues = { leads: {} }; Object.keys(groupedData).forEach(label => { const group = groupedData[label]; let itemsToSum; if (item === 'accumulated_key') { itemsToSum = filterActivationState.type ? group.filter(d => filters.types.includes(d.type)) : group; } else if (itemInfo.isGroup) { itemsToSum = group ? group.filter(d => itemInfo.members.includes(d.type)) : []; } else { itemsToSum = group ? group.filter(d => d.type === item) : []; } monthlyValues.leads[label] = _.sumBy(itemsToSum, 'leads'); }); const dataPoints = chartLabels.map(label => { const [year, month] = label.split('-').map(Number); const currentValue = monthlyValues.leads[label] || 0; if (filters.metricLeads === 'yoy') { const prevYearValue = monthlyValues.leads[`${year - 1}-${String(month).padStart(2, '0')}`]; return (prevYearValue !== undefined && prevYearValue !== 0) ? ((currentValue - prevYearValue) / prevYearValue) * 100 : null; } if (filters.metricLeads === 'mom') { let prevYear = year, prevMonth = month - 1; if (prevMonth === 0) { prevMonth = 12; prevYear--; } const prevMonthValue = monthlyValues.leads[`${prevYear}-${String(prevMonth).padStart(2, '0')}`]; return (prevMonthValue !== undefined && prevMonthValue !== 0) ? ((currentValue - prevMonthValue) / prevMonthValue) * 100 : null; } return currentValue; }); const itemColor = typeColorMap[item] || COLOR_PALETTE[index % COLOR_PALETTE.length]; if (!typeColorMap[item]) typeColorMap[item] = itemColor; const datasetLabel = item === 'accumulated_key' ? t.leadsAccumulated : `Leads ${item}`; const leadsDataset = { label: datasetLabel, data: dataPoints, borderColor: itemColor, yAxisID: 'yLeads', tension: 0.1 }; if (datasetStates[leadsDataset.label]) { Object.assign(leadsDataset, datasetStates[leadsDataset.label]); } datasets.push(leadsDataset); }); if (filterActivationState.spend && filters.showSpend) { const groupedSpendData = _.groupBy(data, d => `${d.year}-${String(d.month).padStart(2, '0')}`); const monthlySpendTotals = _.mapValues(groupedSpendData, rows => _.sumBy(rows, filters.metricSpend === 'methodology' ? 'spendMethodology' : 'spendReal')); const spendDataPoints = chartLabels.map(label => { const [year, month] = label.split('-').map(Number); const currentValue = monthlySpendTotals[label] || 0; if (filters.metricLeads === 'yoy') { const prevYearValue = monthlySpendTotals[`${year - 1}-${String(month).padStart(2, '0')}`]; return (prevYearValue !== undefined && prevYearValue !== 0) ? ((currentValue - prevYearValue) / prevYearValue) * 100 : null; } if (filters.metricLeads === 'mom') { let prevYear = year, prevMonth = month - 1; if (prevMonth === 0) { prevMonth = 12; prevYear--; } const prevMonthValue = monthlySpendTotals[`${prevYear}-${String(prevMonth).padStart(2, '0')}`]; return (prevMonthValue !== undefined && prevMonthValue !== 0) ? ((currentValue - prevMonthValue) / prevMonthValue) * 100 : null; } return currentValue; }); const spendLabel = filters.metricSpend === 'methodology' ? t.spendMethodologyOption : t.spendRealOption; const spendDataset = { label: spendLabel, data: spendDataPoints, borderColor: '#dc3545', borderDash: [5, 5], yAxisID: filters.metricLeads === 'cantidad' ? 'ySpend' : 'yLeads', tension: 0.1 }; if (datasetStates[spendLabel]) Object.assign(spendDataset, datasetStates[spendLabel]); datasets.push(spendDataset); } return { labels: chartLabels, datasets }; }
function renderChart(chartData, filters) { if (chartInstance) { chartInstance.destroy(); } if (window.ChartAnnotation && !annotationPluginRegistered) { Chart.register(window.ChartAnnotation); annotationPluginRegistered = true; } const isShareMode = filters.metricLeads === 'share'; const isPercentage = ['yoy', 'mom'].includes(filters.metricLeads); const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }); const chartType = isShareMode ? 'bar' : 'line'; let chartOptions = { responsive: true, maintainAspectRatio: false, interaction: { mode: isShareMode ? 'point' : 'index', intersect: false }, plugins: { legend: DOMElements.legend, tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.parsed.y !== null) { const value = context.raw; if (isShareMode) { label += `${value.toFixed(2)}%`; } else { const isDatasetPercentage = context.dataset.yAxisID !== 'ySpend' || !['cantidad'].includes(filters.metricLeads); if (isDatasetPercentage && isPercentage) { label += `${Math.round(value)}%`; } else { label += (context.dataset.yAxisID === 'ySpend' ? '$' : '') + numberFormatter.format(value); } } } return label; } } } }, scales: {} }; if (isShareMode) { let maxAxisY = 0; if (chartData.labels.length > 0 && chartData.datasets.length > 0) { for (let i = 0; i < chartData.labels.length; i++) { let monthlyTotal = 0; chartData.datasets.forEach(dataset => { if (!dataset.hidden) { monthlyTotal += (dataset.data[i] || 0); } }); if (monthlyTotal > maxAxisY) { maxAxisY = monthlyTotal; } } } maxAxisY = Math.min(100, Math.ceil(maxAxisY * 1.1)); if (maxAxisY === 0) maxAxisY = 10; chartOptions.scales = { x: { stacked: true }, y: { stacked: true, max: maxAxisY, title: { display: true, text: '% Share' }, ticks: { callback: (value) => `${value}%` } } }; } else { const yearAnnotations = {}; if (chartData.labels.length > 1) { let lastYear = chartData.labels[0].substring(0, 4); chartData.labels.forEach((label, index) => { const currentYear = label.substring(0, 4); if (currentYear !== lastYear) { yearAnnotations[`line${currentYear}`] = { type: 'line', xMin: index - 0.5, xMax: index - 0.5, borderColor: 'rgba(0, 0, 0, 0.2)', borderWidth: 1, borderDash: [6, 6] }; } lastYear = currentYear; }); } const yAxesUsed = new Set(chartData.datasets.filter(d => !(datasetStates[d.label] && datasetStates[d.label].hidden)).map(d => d.yAxisID)); const axisTickFormatter = (value) => { if (isPercentage && value === 0) return '0%'; if (Math.abs(value) < 1 && value !== 0 && isPercentage) return ''; if (Math.floor(value) !== value && isPercentage) return ''; return isPercentage ? `${Math.round(value)}%` : numberFormatter.format(value); }; const spendTickFormatter = (value) => `$${numberFormatter.format(value)}`; const lang = DOMElements.languageToggle.checked ? 'es' : 'en'; const t = translations[lang]; chartOptions.plugins.annotation = { annotations: annotationPluginRegistered ? yearAnnotations : {} }; chartOptions.scales = { yLeads: { type: 'linear', display: true, position: 'left', title: { display: true, text: isPercentage ? t.yAxisGrowth : t.yAxisPrimary }, ticks: { callback: axisTickFormatter } }, ySpend: { type: 'linear', display: yAxesUsed.has('ySpend'), position: 'right', title: { display: true, text: t.yAxisSpend }, grid: { drawOnChartArea: false }, ticks: { callback: spendTickFormatter } }, ySecondary: { type: 'linear', display: yAxesUsed.has('ySecondary'), position: 'right', title: { display: true, text: t.yAxisSecondary }, grid: { drawOnChartArea: false }, ticks: { callback: axisTickFormatter } }, yTertiary: { type: 'linear', display: yAxesUsed.has('yTertiary'), position: 'right', title: { display: true, text: t.yAxisTertiary }, grid: { drawOnChartArea: false }, ticks: { callback: axisTickFormatter } } }; } chartInstance = new Chart(DOMElements.canvas, { type: chartType, data: chartData, options: chartOptions }); }


// ===== LÓGICA PARA GESTIONAR VISTAS CON LOCALSTORAGE EN EL MENÚ =====

const SAVED_VIEWS_KEY = 'dashboard_saved_views';

function loadAndRenderSavedViews() {
    const views = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]');
    renderSavedViewsMenu(views);
}

function saveCurrentView() {
    const viewName = prompt("Ingresa un nombre para la vista actual:", `Vista ${new Date().toLocaleDateString()}`);
    if (!viewName) return;

    const currentState = {
        id: `view_${Date.now()}`,
        name: viewName,
        savedAt: new Date().toISOString(),
        filters: getFilterState(),
        lineGroups: JSON.parse(JSON.stringify(lineGroups)),
        datasetStates: JSON.parse(JSON.stringify(datasetStates)),
        filterActivationState: JSON.parse(JSON.stringify(filterActivationState))
    };

    const views = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]');
    views.push(currentState);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
    
    renderSavedViewsMenu(views);
    alert(`Vista '${viewName}' guardada!`);
}

function renderSavedViewsMenu(views) {
    const menu = DOMElements.savedViewsMenu;
    
    let itemsHTML = `
        <li>
            <a class="dropdown-item fw-bold" href="#" data-view-action="save">
                + Guardar Vista Actual
            </a>
        </li>
        <li><hr class="dropdown-divider"></li>
    `;

    if (views.length === 0) {
        itemsHTML += '<li><span class="dropdown-item-text text-muted">No hay vistas guardadas.</span></li>';
    } else {
        itemsHTML += views.map(view => `
            <li class="saved-view-list-item">
                <a class="dropdown-item" href="#" data-view-id="${view.id}">${view.name}</a>
                <button class="delete-view-btn" data-view-id="${view.id}" title="Eliminar vista">&times;</button>
            </li>
        `).join('');
    }

    menu.innerHTML = itemsHTML;
}

function handleSavedViewsMenuClick(e) {
    const target = e.target;
    const viewId = target.dataset.viewId;
    const viewAction = target.dataset.viewAction;

    if (viewAction === 'save') {
        e.preventDefault();
        saveCurrentView();
        return;
    }

    if (!viewId) return;
    
    e.preventDefault();
    const views = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]');
    
    if (target.classList.contains('delete-view-btn')) {
        const updatedViews = views.filter(v => v.id !== viewId);
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updatedViews));
        renderSavedViewsMenu(updatedViews);
    } else if (target.classList.contains('dropdown-item')) {
        const viewToLoad = views.find(v => v.id === viewId);
        if (viewToLoad) {
            applyState(viewToLoad);
        }
    }
}
    
function applyState(state) {
    const { filters, lineGroups: loadedGroups, datasetStates: loadedStates, filterActivationState: loadedActivation } = state;

    Object.keys(lineGroups).forEach(key => delete lineGroups[key]);
    Object.keys(datasetStates).forEach(key => delete datasetStates[key]);
    
    const dateSet = new Set(filters.dates.map(d => `${d.year}-${d.month}`));
    DOMElements.fechaArbol.querySelectorAll('.month-checkbox').forEach(cb => cb.checked = dateSet.has(`${cb.dataset.year}-${cb.dataset.month}`));
    DOMElements.fechaArbol.querySelectorAll('.parent-checkbox').forEach(updateTreeParentState);
    
    DOMElements.org.value = filters.organization;

    const countrySet = new Set(filters.countries);
    DOMElements.regionPaisArbol.querySelectorAll('.country-checkbox').forEach(cb => cb.checked = countrySet.has(cb.dataset.value));
    DOMElements.regionPaisArbol.querySelectorAll('.parent-checkbox').forEach(updateTreeParentState);

    const typeSet = new Set(filters.types);
    Array.from(DOMElements.type.options).forEach(opt => opt.selected = typeSet.has(opt.value));

    document.querySelector(`input[name="metric-leads"][value="${filters.metricLeads}"]`).checked = true;
    document.querySelector(`input[name="display-type"][value="${filters.displayType}"]`).checked = true;
    document.querySelector(`input[name="share-calc"][value="${filters.shareCalc}"]`).checked = true;

    DOMElements.toggleSpend.checked = filters.showSpend;
    DOMElements.spendOptions.style.display = filters.showSpend ? 'block' : 'none';
    document.querySelector(`input[name="metric-spend"][value="${filters.metricSpend}"]`).checked = true;

    Object.assign(lineGroups, loadedGroups);
    Object.assign(datasetStates, loadedStates);
    if (loadedActivation) {
        Object.assign(filterActivationState, loadedActivation);
    } else {
        Object.keys(filterActivationState).forEach(k => {
            if (k !== 'groups') filterActivationState[k] = true;
        });
        filterActivationState.groups = {};
    }

    updateExistingGroupsList();
    updateDashboard(true);
}