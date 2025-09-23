// --- CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES ---
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
        const resetButton = target.closest('#reset-all-filters-btn');
        if (resetButton) {
            resetAllFilters();
            return;
        }

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
        } else if (target.classList.contains('remove-filter-btn')) {
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

    DOMElements.savedViewsMenu.addEventListener('click', handleSavedViewsMenuClick);
    setupChartLegendContextMenu();
    setupGroupingModal();
}

function showFilterContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    const container = e.target.closest('[data-filter-type]');
    const type = container.dataset.filterType;
    let clickedValue = null;
    const targetListItem = e.target.closest('li, option');
    if (targetListItem) {
        if (targetListItem.tagName === 'OPTION') {
            clickedValue = targetListItem.value;
        } else if (targetListItem.querySelector('input[type="checkbox"]')) {
            clickedValue = targetListItem.querySelector('input[type="checkbox"]').dataset.value;
        }
    }
    contextMenuTarget = { type: type, element: container, clickedValue: clickedValue };
    DOMElements.filterContextMenu.style.display = 'block';
    const menuWidth = DOMElements.filterContextMenu.offsetWidth;
    DOMElements.filterContextMenu.style.left = `${e.clientX - menuWidth}px`;
    DOMElements.filterContextMenu.style.top = `${e.clientY}px`;
}

function applyContextMenuAction(action, type, element, clickedValue) {
    if (type === 'date' || type === 'geo') {
        element.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            let newCheckedState = false;
            switch (action) {
                case 'select-all': newCheckedState = true; break;
                case 'deselect-all': newCheckedState = false; break;
                case 'invert': newCheckedState = (checkbox.dataset.value !== clickedValue); break;
                case 'isolate': newCheckedState = (checkbox.dataset.value === clickedValue); break;
            }
            checkbox.checked = newCheckedState;
        });
        element.querySelectorAll(".parent-checkbox").forEach(updateTreeParentState);
    } else if (type === 'type') {
        Array.from(element.options).forEach(option => {
            let newSelectedState = false;
            switch (action) {
                case 'select-all': newSelectedState = true; break;
                case 'deselect-all': newSelectedState = false; break;
                case 'invert': newSelectedState = (option.value !== clickedValue); break;
                case 'isolate': newSelectedState = (option.value === clickedValue); break;
            }
            option.selected = newSelectedState;
        });
    }
    updateDashboard(true);
}

function handleTreeClick(e) {
    const target = e.target;
    const listItem = target.closest('li');
    if (!listItem) return;

    if (target.classList.contains('toggle') || target.classList.contains('parent-label')) {
        const toggle = listItem.querySelector('.toggle');
        const childContainer = listItem.querySelector('.child-container');
        if (!childContainer) return;
        const isVisible = childContainer.style.display === 'block';
        childContainer.style.display = isVisible ? 'none' : 'block';
        if (toggle) toggle.textContent = isVisible ? '[-]' : '[+]';
        return;
    }

    if (target.type === 'checkbox') {
        const isParent = target.classList.contains('parent-checkbox');
        if (isParent) {
            listItem.querySelectorAll('.child-checkbox').forEach(child => child.checked = target.checked);
        }
        const parentCheckbox = isParent ? target : listItem.closest('.child-container')?.parentElement.querySelector('.parent-checkbox');
        if (parentCheckbox) {
            updateTreeParentState(parentCheckbox);
        }
        updateTypeFilterOrder();
        updateDashboard(true);
    }
}

function updateTreeParentState(parentCheckbox) {
    const parentLi = parentCheckbox.closest('li');
    const childCheckboxes = Array.from(parentLi.querySelectorAll('.child-checkbox'));
    if (childCheckboxes.length === 0) return;

    const checkedCount = childCheckboxes.filter(cb => cb.checked).length;
    const labelContainer = parentCheckbox.closest('.tree-item-label-container');

    if (checkedCount === 0) {
        parentCheckbox.checked = false;
        parentCheckbox.indeterminate = false;
        labelContainer.classList.remove('indeterminate');
    } else if (checkedCount === childCheckboxes.length) {
        parentCheckbox.checked = true;
        parentCheckbox.indeterminate = false;
        labelContainer.classList.remove('indeterminate');
    } else {
        parentCheckbox.checked = false;
        parentCheckbox.indeterminate = true;
        labelContainer.classList.add('indeterminate');
    }
}

function resetAllFilters() {
    [DOMElements.fechaArbol, DOMElements.regionPaisArbol].forEach(tree => {
        tree.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
        tree.querySelectorAll('.parent-checkbox').forEach(updateTreeParentState);
    });
    DOMElements.org.value = 'all';
    Array.from(DOMElements.type.options).forEach(opt => opt.selected = true);
    document.getElementById('opt-leads-cantidad').checked = true;
    document.getElementById('opt-type-acumulado').checked = true;
    DOMElements.toggleSpend.checked = false;
    DOMElements.spendOptions.style.display = 'none';
    document.getElementById('opt-spend-methodology').checked = true;
    lineGroups = {};
    datasetStates = {};
    Object.keys(filterActivationState).forEach(k => {
        filterActivationState[k] = k !== 'groups';
    });
    filterActivationState.groups = {};
    updateExistingGroupsList();
    updateTypeFilterOrder();
    updateDashboard(true);
}

function updateAppliedFiltersNotification() {
    const filters = getFilterState();
    let toggleableItems = [];
    let permanentItems = [];

    const createItem = (label, summary, options = {}) => {
        const { filterType, groupName, isPermanent } = options;
        let controlHtml = '';
        if (!isPermanent) {
            const isActive = groupName ? (filterActivationState.groups[groupName] !== false) : filterActivationState[filterType];
            controlHtml += `<label class="filter-summary-switch"><input type="checkbox" data-filter="${filterType || ''}" ${groupName ? `data-group-name="${groupName}"` : ''} ${isActive ? 'checked' : ''}><span class="slider"></span></label>`;
        }
        return `<div class="applied-filter-item"><span class="filter-summary-text"><strong>${label}:</strong> ${summary}</span><div class="filter-item-controls">${controlHtml}</div></div>`;
    };

    const totalDateCheckboxes = DOMElements.fechaArbol.querySelectorAll('.month-checkbox').length;
    if (filters.dates.length < totalDateCheckboxes) {
        const datesByYear = _.groupBy(filters.dates, 'year');
        const summary = Object.entries(datesByYear).map(([year, months]) => `${year} (${months.map(m=>String(m.month).padStart(2,'0')).join(', ')})`).join('; ');
        toggleableItems.push(createItem("Date", summary, { filterType: 'date' }));
    }

    if (filters.organization !== 'all') {
        toggleableItems.push(createItem("Org", filters.organization, { filterType: 'org' }));
    }

    const totalCountryCheckboxes = DOMElements.regionPaisArbol.querySelectorAll('.country-checkbox').length;
    if (filters.countries.length < totalCountryCheckboxes) {
        const summaryParts = Object.entries(_.groupBy(filters.countries, c => DOMElements.regionPaisArbol.querySelector(`[data-value="${c}"]`).dataset.region)).map(([region, countries]) => `${region} (${countries.map(c => countryNomenclatures[c] || c).join(', ')})`);
        toggleableItems.push(createItem("Geo", summaryParts.join('; '), { filterType: 'geo' }));
    }

    if (filters.types.length < DOMElements.type.options.length) {
        const summary = filters.types.join(', ');
        toggleableItems.push(createItem("Types", summary, { filterType: 'type' }));
    }

    let metricLabel = '';
    switch (filters.metricLeads) {
        case 'yoy': metricLabel = "YOY Growth %"; break;
        case 'mom': metricLabel = "MOM Growth %"; break;
        case 'share': metricLabel = "Share by Type %"; break;
        default: metricLabel = "Quantities"; break;
    }
    permanentItems.push(createItem("Chart Control", metricLabel, { isPermanent: true }));

    if (filters.metricLeads === 'share') {
        const shareCalcValue = filters.shareCalc === 'selected' ? "Total of Selected Types" : "Total of All Types";
        permanentItems.push(createItem("Share calculated on", shareCalcValue, { isPermanent: true }));
    }

    if (filters.metricLeads !== 'share') {
        const displayLabel = filters.displayType === 'acumulado' ? "Accumulated Lines" : "Separate Lines";
        permanentItems.push(createItem("Display", displayLabel, { isPermanent: true }));
    }

    Object.keys(lineGroups).forEach(groupName => {
        const summary = `<span style="color: #6c757d; font-size: 0.9em;">(${lineGroups[groupName].join(', ')})</span>`;
        toggleableItems.push(createItem(groupName, summary, { groupName: groupName }));
    });

    if (filters.showSpend) {
        const spendTypeLabel = filters.metricSpend === 'methodology' ? "Offline $ per Lead Methodology" : "Real";
        toggleableItems.push(createItem("Spend Display", spendTypeLabel, { filterType: 'spend' }));
    }
    
    const activeSettings = [...toggleableItems, ...permanentItems];
    
    let dropdownHTML = '';
    const hasActiveFilters = (filters.dates.length < totalDateCheckboxes || filters.organization !== 'all' || filters.countries.length < totalCountryCheckboxes || filters.types.length < DOMElements.type.options.length || Object.keys(lineGroups).length > 0);

    if (hasActiveFilters) {
        dropdownHTML += `<div class="reset-filters-container">
            <button id="reset-all-filters-btn">Clear All Filters</button>
        </div><hr class="dropdown-divider-custom">`;
    }
    
    DOMElements.filtersCountBadge.textContent = activeSettings.length;
    DOMElements.filtersCountBadge.style.display = activeSettings.length > 0 ? 'block' : 'none';

    if (activeSettings.length > 0) {
        dropdownHTML += activeSettings.map(item => item).join('');
    } else {
        dropdownHTML = `<div style="text-align:center; color: #6c757d; font-size:0.9rem;">No active filters.</div>`;
    }

    DOMElements.appliedFiltersDropdown.innerHTML = dropdownHTML;
}

function populateFilters(data) {
    const yearsMonths = _.chain(data).groupBy('year').mapValues(g => _.sortBy(_.uniq(g.map(item => item.month)))).value();
    let dateHtml = '<ul>';
    Object.keys(yearsMonths).sort((a, b) => b - a).forEach(year => {
        dateHtml += `<li><div class="tree-item-label-container"><span class="toggle">[-]</span><input type="checkbox" class="parent-checkbox year-checkbox" data-value="${year}" checked><span class="parent-label label-text">${year}</span></div><ul class="child-container" style="display: block;">`;
        dateHtml += yearsMonths[year].map(month => `<li><div class="tree-item-label-container"><input type="checkbox" class="child-checkbox month-checkbox" data-year="${year}" data-month="${month}" data-value="${year}-${month}" checked><span class="label-text">${String(month).padStart(2, '0')}</span></div></li>`).join('');
        dateHtml += '</ul></li>';
    });
    dateHtml += '</ul>';
    DOMElements.fechaArbol.innerHTML = dateHtml;
    DOMElements.fechaArbol.querySelectorAll('.child-container').forEach((el, index) => { if (index > 0) el.style.display = 'none'; });
    DOMElements.fechaArbol.querySelectorAll('.toggle').forEach((el, index) => { if (index > 0) el.textContent = '[+]'; });

    const organizations = _.sortBy(_.uniq(data.map(d => d.organization)));
    DOMElements.org.innerHTML = `<option value="all">All</option>` + organizations.map(org => `<option value="${org}">${org}</option>`).join('');

    geoStructure = _.chain(data).groupBy('region').mapValues(g => _.sortBy(_.uniq(g.map(item => item.country)))).value();
    let geoHtml = '<ul>';
    Object.keys(geoStructure).sort().forEach(region => {
        geoHtml += `<li><div class="tree-item-label-container"><span class="toggle">[+]</span><input type="checkbox" class="parent-checkbox region-checkbox" data-value="${region}" checked><span class="parent-label label-text">${region}</span></div><ul class="child-container">`;
        geoHtml += geoStructure[region].map(country => `<li><div class="tree-item-label-container"><input type="checkbox" class="child-checkbox country-checkbox" data-region="${region}" data-value="${country}" checked><span class="label-text">${country}</span></div></li>`).join('');
        geoHtml += '</ul></li>';
    });
    geoHtml += '</ul>';
    DOMElements.regionPaisArbol.innerHTML = geoHtml;

    const types = _.sortBy(_.uniq(data.map(d => d.type)));
    DOMElements.type.innerHTML = types.map(t => `<option value="${t}">${t}</option>`).join('');
    Array.from(DOMElements.type.options).forEach(opt => opt.selected = true);
}

function getFilterState() {
    const dates = Array.from(DOMElements.fechaArbol.querySelectorAll('.month-checkbox:checked')).map(cb => ({ year: parseInt(cb.dataset.year), month: parseInt(cb.dataset.month) }));
    const countries = Array.from(DOMElements.regionPaisArbol.querySelectorAll('.country-checkbox:checked')).map(cb => cb.dataset.value);
    return {
        dates,
        organization: DOMElements.org.value,
        countries,
        types: Array.from(DOMElements.type.selectedOptions).map(opt => opt.value),
        metricLeads: document.querySelector('input[name="metric-leads"]:checked').value,
        displayType: document.querySelector('input[name="display-type"]:checked').value,
        showSpend: DOMElements.toggleSpend.checked,
        metricSpend: document.querySelector('input[name="metric-spend"]:checked').value,
        shareCalc: document.querySelector('input[name="share-calc"]:checked').value
    };
}

function updateDashboard(updateNotifications = false) {
    const filters = getFilterState();
    if (updateNotifications) updateAppliedFiltersNotification();
    updateControlStates(filters);
    const filteredData = applyFilters(allData, filters);
    const chartData = prepareDataForChart(filteredData, filters);
    renderChart(chartData, filters);
}

function makeResizable(panel, resizer) {
    let isResizing = false;
    resizer.addEventListener('mousedown', () => {
        isResizing = true;
        document.body.style.cursor = 'ew-resize';
        const mouseMoveHandler = (e) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            panel.style.width = `${newWidth}px`;
            if (chartInstance) chartInstance.resize();
        };
        const mouseUpHandler = () => {
            isResizing = false;
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });
}

function updateControlStates(filters) {
    const isShareMode = filters.metricLeads === 'share';
    
    DOMElements.shareOptionsContainer.style.display = isShareMode ? 'block' : 'none';
    
    const controlsToDisable = [
        ...DOMElements.displayOptionsContainer.querySelectorAll('input'),
        DOMElements.spendToggleContainer.querySelector('input')
    ];

    controlsToDisable.forEach(control => {
        const container = control.parentElement.closest('div');
        control.disabled = isShareMode;
        if (container) {
            container.style.opacity = isShareMode ? 0.5 : 1;
            container.style.pointerEvents = isShareMode ? 'none' : 'auto';
        }
    });

    DOMElements.groupLinesBtn.disabled = false;
    DOMElements.groupLinesBtn.style.opacity = 1;
    DOMElements.groupLinesBtn.style.pointerEvents = 'auto';

    if (isShareMode) {
        DOMElements.toggleSpend.checked = false;
        DOMElements.spendOptions.style.display = 'none';
    }
}

function cleanData(data) {
    const getNumericValue = (val) => {
        if (typeof val !== 'string' || !val) return Number(val) || 0;
        return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
    };
    return data.map(row => ({
        year: parseInt(row.Year_, 10),
        month: parseInt(row.Month_, 10),
        organization: row.Organization,
        region: row.Region,
        country: row.Country,
        type: row.Type,
        leads: getNumericValue(row['Leads Eligible - Total']),
        spendMethodology: getNumericValue(row['Offline Spend per Leads Methodology']),
        spendReal: getNumericValue(row['Offline Spend Real'])
    }));
}

function updateTypeFilterOrder() {
    const filters = getFilterState();
    const filteredForSort = allData.filter(d =>
        filters.dates.some(date => date.year === d.year && date.month === d.month) &&
        (filters.organization === 'all' || d.organization === filters.organization) &&
        filters.countries.includes(d.country)
    );
    const sortedTypes = _.chain(filteredForSort).groupBy('type').map((values, key) => ({ type: key, totalLeads: _.sumBy(values, 'leads') })).filter(item => item.totalLeads > 0).sortBy('totalLeads').reverse().map('type').value();
    const allTypes = _.sortBy(_.uniq(allData.map(d => d.type)));
    const finalOrder = [...sortedTypes, ..._.difference(allTypes, sortedTypes)];
    const selectedValues = new Set(Array.from(DOMElements.type.selectedOptions).map(opt => opt.value));
    DOMElements.type.innerHTML = '';
    finalOrder.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.innerText = type;
        if (selectedValues.has(type)) option.selected = true;
        DOMElements.type.appendChild(option);
    });
}

function setupChartLegendContextMenu() {
    DOMElements.legend = {
        onClick: (e, legendItem, legend) => {
            const chart = legend.chart;
            const filters = getFilterState();
            if (filters.metricLeads === 'share') {
                const dataset = chart.data.datasets[legendItem.datasetIndex];
                if (!datasetStates[dataset.label]) datasetStates[dataset.label] = { hidden: false };
                datasetStates[dataset.label].hidden = !datasetStates[dataset.label].hidden;
                updateDashboard();
            } else {
                e.native.stopImmediatePropagation();
                const dataset = chart.data.datasets[legendItem.datasetIndex];
                const isSpend = dataset.label.includes('Offline $');
                const isQuantity = filters.metricLeads === 'cantidad';
                const disableMove = isSpend && isQuantity;
                DOMElements.legendContextMenu.querySelectorAll('li[data-action^="move-"]').forEach(li => li.classList.toggle('disabled', disableMove));
                DOMElements.legendContextMenu.style.display = 'block';
                const menuWidth = DOMElements.legendContextMenu.offsetWidth;
                DOMElements.legendContextMenu.style.left = `${e.native.clientX - menuWidth}px`;
                DOMElements.legendContextMenu.style.top = `${e.native.clientY}px`;
                DOMElements.legendContextMenu.dataset.datasetIndex = legendItem.datasetIndex;
            }
        },
        labels: {
            generateLabels: chart => {
                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                const filters = getFilterState();
                originalLabels.forEach(label => {
                    const dataset = chart.data.datasets[label.datasetIndex];
                    if (datasetStates[dataset.label] && datasetStates[dataset.label].hidden) {
                        label.hidden = true;
                    }
                    if (filters.metricLeads !== 'share') {
                        if (dataset.yAxisID === 'ySecondary') label.text += ' (Sec.)';
                        else if (dataset.yAxisID === 'yTertiary') label.text += ' (Ter.)';
                    }
                });
                return originalLabels;
            }
        }
    };
    DOMElements.legendContextMenu.addEventListener('click', e => {
        e.stopPropagation();
        const li = e.target.closest('li');
        if (!li || li.classList.contains('disabled')) return;
        const action = li.dataset.action;
        const datasetIndex = parseInt(DOMElements.legendContextMenu.dataset.datasetIndex);
        const dataset = chartInstance.data.datasets[datasetIndex];
        if (!datasetStates[dataset.label]) {
            datasetStates[dataset.label] = { hidden: false, yAxisID: dataset.yAxisID };
        }
        if (action === 'toggle') datasetStates[dataset.label].hidden = !datasetStates[dataset.label].hidden;
        else if (action === 'move-to-primary') datasetStates[dataset.label].yAxisID = 'yLeads';
        else if (action === 'move-to-secondary') datasetStates[dataset.label].yAxisID = 'ySecondary';
        else if (action === 'move-to-tertiary') datasetStates[dataset.label].yAxisID = 'yTertiary';
        DOMElements.legendContextMenu.style.display = 'none';
        updateDashboard();
    });
}

function setupGroupingModal() {
    if (DOMElements.groupingModal) {
        DOMElements.groupingModal.addEventListener('shown.bs.modal', updateGroupingModalChecklist);
    }
    DOMElements.saveGroupBtn.addEventListener('click', () => {
        const groupName = DOMElements.groupNameInput.value.trim();
        const selectedTypes = Array.from(DOMElements.groupTypesChecklist.querySelectorAll('input:checked')).map(cb => cb.value);
        if (groupName && selectedTypes.length >= 2) {
            lineGroups[groupName] = selectedTypes;
            filterActivationState.groups[groupName] = true;
            DOMElements.groupNameInput.value = '';
            DOMElements.groupTypesChecklist.querySelectorAll('input:checked').forEach(cb => cb.checked = false);
            updateExistingGroupsList();
            updateDashboard(true);
        } else {
            alert("Please enter a group name and select at least two Types.");
        }
    });
    DOMElements.existingGroupsList.addEventListener('click', e => {
        if (e.target.classList.contains('delete-group-btn')) {
            const groupName = e.target.dataset.groupName;
            delete lineGroups[groupName];
            delete filterActivationState.groups[groupName];
            updateExistingGroupsList();
            updateDashboard(true);
        }
    });
}

function updateGroupingModalChecklist() {
    const allUniqueTypes = _.sortBy(_.uniq(allData.map(d => d.type)));
    DOMElements.groupTypesChecklist.innerHTML = allUniqueTypes.map(type =>
        `<div class="form-check"><input class="form-check-input" type="checkbox" value="${type}" id="check-group-${type}"><label class="form-check-label" for="check-group-${type}">${type}</label></div>`
    ).join('');
}

function updateExistingGroupsList() {
    let html = Object.keys(lineGroups).map(groupName =>
        `<div class="existing-group-item">
            <span class="delete-group-btn" data-group-name="${groupName}">&times;</span>
            <div class="group-name">${groupName}</div>
            <div class="group-types">${lineGroups[groupName].join(', ')}</div>
        </div>`
    ).join('');
    DOMElements.existingGroupsList.innerHTML = html || '<p>No groups created yet.</p>';
}

function applyFilters(data, filters) {
    let filteredData = data;
    if (filterActivationState.org) {
        filteredData = filteredData.filter(d => filters.organization === 'all' || d.organization === filters.organization);
    }
    if (filterActivationState.geo) {
        filteredData = filteredData.filter(d => filters.countries.includes(d.country));
    }
    const metric = filters.metricLeads;
    if (metric === 'share' || metric === 'cantidad') {
        const dateSet = new Set(filters.dates.map(d => `${d.year}-${d.month}`));
        return filterActivationState.date ? filteredData.filter(d => dateSet.has(`${d.year}-${d.month}`)) : filteredData;
    }
    const requiredDates = new Set();
    filters.dates.forEach(d => {
        requiredDates.add(`${d.year}-${d.month}`);
        if (metric === 'yoy') requiredDates.add(`${d.year - 1}-${d.month}`);
        if (metric === 'mom') {
            const prev = new Date(d.year, d.month - 1, 1);
            prev.setMonth(prev.getMonth() - 1);
            requiredDates.add(`${prev.getFullYear()}-${prev.getMonth() + 1}`);
        }
    });
    return filteredData.filter(d => requiredDates.has(`${d.year}-${d.month}`));
}

function prepareDataForChart(data, filters) {
    const groupingKey = d => `${d.year}-${String(d.month).padStart(2, '0')}`;
    let chartLabels = filterActivationState.date ? _.sortBy(_.uniq(filters.dates.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`))) : _.sortBy(_.uniq(data.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`)));
    
    if (filters.metricLeads === 'share') {
        const itemsToProcess = [];
        const selectedTypes = new Set(filterActivationState.type ? filters.types : _.uniq(allData.map(d => d.type)));
        const typesInGroups = new Set();
        const totalCalculationData = (filters.shareCalc === 'all') ? data : data.filter(d => selectedTypes.has(d.type));
        const monthlyTotals = _.chain(totalCalculationData).groupBy(groupingKey).mapValues(g => _.sumBy(g, 'leads')).value();

        Object.keys(lineGroups).forEach(groupName => {
            if (filterActivationState.groups[groupName] !== false) {
                lineGroups[groupName].forEach(type => typesInGroups.add(type));
            }
        });

        selectedTypes.forEach(type => {
            if (!typesInGroups.has(type)) {
                itemsToProcess.push({ name: type, isGroup: false });
            }
        });

        Object.keys(lineGroups).forEach(groupName => {
            if (filterActivationState.groups[groupName] !== false) {
                const members = lineGroups[groupName];
                if (members.some(type => selectedTypes.has(type))) {
                    itemsToProcess.push({ name: groupName, isGroup: true, members });
                }
            }
        });

        const datasets = itemsToProcess.map((item, index) => {
            const typesToSum = item.isGroup ? item.members : [item.name];
            const itemDataByMonth = _.chain(data).filter(d => typesToSum.includes(d.type)).groupBy(groupingKey).mapValues(g => _.sumBy(g, 'leads')).value();
            const dataPoints = chartLabels.map(label => {
                const totalForMonth = monthlyTotals[label] || 0;
                if (totalForMonth === 0) return 0;
                const itemLeads = itemDataByMonth[label] || 0;
                return (itemLeads / totalForMonth) * 100;
            });
            return { label: item.name, data: dataPoints, backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length], hidden: datasetStates[item.name]?.hidden || false };
        });
        return { labels: chartLabels, datasets };
    }

    const groupedData = _.groupBy(data, groupingKey);
    let itemsToProcess;
    if (filters.displayType === 'acumulado') {
        itemsToProcess = [{ name: 'accumulated_key', isGroup: false }];
    } else {
        const selectedTypes = new Set(filterActivationState.type ? filters.types : _.uniq(allData.map(d => d.type)));
        const typesInGroups = new Set();
        itemsToProcess = [];

        Object.keys(lineGroups).forEach(groupName => {
            if (filterActivationState.groups[groupName] !== false) {
                lineGroups[groupName].forEach(type => typesInGroups.add(type));
            }
        });

        selectedTypes.forEach(type => {
            if (!typesInGroups.has(type)) {
                itemsToProcess.push({ name: type, isGroup: false });
            }
        });

        Object.keys(lineGroups).forEach(groupName => {
            if (filterActivationState.groups[groupName] !== false) {
                const members = lineGroups[groupName];
                itemsToProcess.push({ name: groupName, isGroup: true, members });
            }
        });
    }

    let datasets = itemsToProcess.map((itemInfo, index) => {
        const item = itemInfo.name;
        const monthlyValues = { leads: {} };
        Object.keys(groupedData).forEach(label => {
            const group = groupedData[label];
            let itemsToSum;
            if (item === 'accumulated_key') itemsToSum = filterActivationState.type ? group.filter(d => filters.types.includes(d.type)) : group;
            else if (itemInfo.isGroup) itemsToSum = group ? group.filter(d => itemInfo.members.includes(d.type)) : [];
            else itemsToSum = group ? group.filter(d => d.type === item) : [];
            monthlyValues.leads[label] = _.sumBy(itemsToSum, 'leads');
        });
        const dataPoints = chartLabels.map(label => {
            const [year, month] = label.split('-').map(Number);
            const currentValue = monthlyValues.leads[label] || 0;
            if (filters.metricLeads === 'yoy') {
                const prevYearValue = monthlyValues.leads[`${year - 1}-${String(month).padStart(2, '0')}`];
                return (prevYearValue) ? ((currentValue - prevYearValue) / prevYearValue) * 100 : null;
            }
            if (filters.metricLeads === 'mom') {
                let prevYear = year, prevMonth = month - 1;
                if (prevMonth === 0) { prevMonth = 12; prevYear--; }
                const prevMonthValue = monthlyValues.leads[`${prevYear}-${String(prevMonth).padStart(2, '0')}`];
                return (prevMonthValue) ? ((currentValue - prevMonthValue) / prevMonthValue) * 100 : null;
            }
            return currentValue;
        });
        const itemColor = typeColorMap[item] || COLOR_PALETTE[index % COLOR_PALETTE.length];
        if (!typeColorMap[item]) typeColorMap[item] = itemColor;
        const datasetLabel = item === 'accumulated_key' ? "Leads Accumulated" : `Leads ${item}`;
        const leadsDataset = { label: datasetLabel, data: dataPoints, borderColor: itemColor, yAxisID: 'yLeads', tension: 0.1 };
        if (datasetStates[leadsDataset.label]) Object.assign(leadsDataset, datasetStates[leadsDataset.label]);
        return leadsDataset;
    });

    if (filterActivationState.spend && filters.showSpend) {
        const groupedSpendData = _.groupBy(data, groupingKey);
        const monthlySpendTotals = _.mapValues(groupedSpendData, rows => _.sumBy(rows, filters.metricSpend === 'methodology' ? 'spendMethodology' : 'spendReal'));
        const spendDataPoints = chartLabels.map(label => {
            const [year, month] = label.split('-').map(Number);
            const currentValue = monthlySpendTotals[label] || 0;
            if (filters.metricLeads === 'yoy') {
                const prevYearValue = monthlySpendTotals[`${year - 1}-${String(month).padStart(2, '0')}`];
                return (prevYearValue) ? ((currentValue - prevYearValue) / prevYearValue) * 100 : null;
            }
            if (filters.metricLeads === 'mom') {
                let prevYear = year, prevMonth = month - 1;
                if (prevMonth === 0) { prevMonth = 12; prevYear--; }
                const prevMonthValue = monthlySpendTotals[`${prevYear}-${String(prevMonth).padStart(2, '0')}`];
                return (prevMonthValue) ? ((currentValue - prevMonthValue) / prevMonthValue) * 100 : null;
            }
            return currentValue;
        });
        const spendLabel = filters.metricSpend === 'methodology' ? "Offline $ per Lead Methodology" : "Real";
        const spendDataset = { label: spendLabel, data: spendDataPoints, borderColor: '#dc3545', borderDash: [5, 5], yAxisID: filters.metricLeads === 'cantidad' ? 'ySpend' : 'yLeads', tension: 0.1 };
        if (datasetStates[spendLabel]) Object.assign(spendDataset, datasetStates[spendLabel]);
        datasets.push(spendDataset);
    }
    return { labels: chartLabels, datasets };
}

function renderChart(chartData, filters) {
    if (chartInstance) chartInstance.destroy();
    if (window.ChartAnnotation && !annotationPluginRegistered) {
        Chart.register(window.ChartAnnotation);
        annotationPluginRegistered = true;
    }
    const isShareMode = filters.metricLeads === 'share';
    const isPercentage = ['yoy', 'mom'].includes(filters.metricLeads);
    const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
    const chartType = isShareMode ? 'bar' : 'line';
    let chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: isShareMode ? 'point' : 'index', intersect: false },
        plugins: {
            legend: DOMElements.legend,
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            const value = context.raw;
                            if (isShareMode) {
                                label += `${value.toFixed(2)}%`;
                            } else {
                                const isDatasetPercentage = context.dataset.yAxisID !== 'ySpend' || !['cantidad'].includes(filters.metricLeads);
                                if (isDatasetPercentage && isPercentage) {
                                    label += `${Math.round(value)}%`;
                                } else {
                                    label += (context.dataset.yAxisID === 'ySpend' ? '$' : '') + numberFormatter.format(value);
                                }
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {}
    };

    if (isShareMode) {
        let maxSum = 0;
        if (chartData.labels.length > 0 && chartData.datasets.length > 0) {
            for (let i = 0; i < chartData.labels.length; i++) {
                let currentSum = 0;
                for (const dataset of chartData.datasets) {
                    if (!dataset.hidden) {
                        currentSum += dataset.data[i] || 0;
                    }
                }
                if (currentSum > maxSum) {
                    maxSum = currentSum;
                }
            }
        }
        
        let maxAxisY;
        if (maxSum <= 0) {
            maxAxisY = 1;
        } else {
            maxAxisY = Math.ceil(maxSum * 10) / 10;
            if (maxSum === maxAxisY) {
                maxAxisY += 0.1;
            }
        }
        maxAxisY = parseFloat(maxAxisY.toFixed(1));

        chartOptions.scales = {
            x: { stacked: true },
            y: { stacked: true, max: maxAxisY, title: { display: true, text: '% Share' }, ticks: { callback: (value) => `${value}%` } }
        };
    } else {
        const yearAnnotations = {};
        if (chartData.labels.length > 1) {
            let lastYear = chartData.labels[0].substring(0, 4);
            chartData.labels.forEach((label, index) => {
                const currentYear = label.substring(0, 4);
                if (currentYear !== lastYear) {
                    yearAnnotations[`line${currentYear}`] = { type: 'line', xMin: index - 0.5, xMax: index - 0.5, borderColor: 'rgba(0, 0, 0, 0.2)', borderWidth: 1, borderDash: [6, 6] };
                }
                lastYear = currentYear;
            });
        }
        const yAxesUsed = new Set(chartData.datasets.filter(d => !d.hidden).map(d => d.yAxisID));
        const axisTickFormatter = (value) => isPercentage ? `${Math.round(value)}%` : numberFormatter.format(value);
        const spendTickFormatter = (value) => `$${numberFormatter.format(value)}`;
        chartOptions.plugins.annotation = { annotations: annotationPluginRegistered ? yearAnnotations : {} };
        chartOptions.scales = {
            yLeads: { type: 'linear', display: true, position: 'left', title: { display: true, text: isPercentage ? "Growth %" : "Quantity" }, ticks: { callback: axisTickFormatter } },
            ySpend: { type: 'linear', display: yAxesUsed.has('ySpend'), position: 'right', title: { display: true, text: "Spend Amount ($)" }, grid: { drawOnChartArea: false }, ticks: { callback: spendTickFormatter } },
            ySecondary: { type: 'linear', display: yAxesUsed.has('ySecondary'), position: 'right', title: { display: true, text: "Secondary Axis" }, grid: { drawOnChartArea: false }, ticks: { callback: axisTickFormatter } },
            yTertiary: { type: 'linear', display: yAxesUsed.has('yTertiary'), position: 'right', title: { display: true, text: "Tertiary Axis" }, grid: { drawOnChartArea: false }, ticks: { callback: axisTickFormatter } }
        };
    }
    chartInstance = new Chart(DOMElements.canvas, { type: chartType, data: chartData, options: chartOptions });
}

// ===== LÓGICA PARA GESTIONAR VISTAS CON LOCALSTORAGE =====
const SAVED_VIEWS_KEY = 'dashboard_saved_views';

function loadAndRenderSavedViews() {
    const views = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]');
    renderSavedViewsMenu(views);
}

function saveCurrentView() {
    const viewName = prompt("Enter a name for the current view:", `View ${new Date().toLocaleDateString()}`);
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
    alert(`View '${viewName}' saved!`);
}

function updateSavedView(viewId) {
    const views = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]');
    const viewIndex = views.findIndex(v => v.id === viewId);
    if (viewIndex === -1) return;

    const oldView = views[viewIndex];
    if (!confirm(`Are you sure you want to overwrite the view "${oldView.name}" with the current filters?`)) {
        return;
    }
    
    const updatedView = {
        id: oldView.id, // Keep original ID
        name: oldView.name, // Keep original name
        savedAt: new Date().toISOString(), // Update timestamp
        filters: getFilterState(),
        lineGroups: JSON.parse(JSON.stringify(lineGroups)),
        datasetStates: JSON.parse(JSON.stringify(datasetStates)),
        filterActivationState: JSON.parse(JSON.stringify(filterActivationState))
    };
    
    views[viewIndex] = updatedView;
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
    renderSavedViewsMenu(views);
    alert(`View '${oldView.name}' updated successfully!`);
}


function renderSavedViewsMenu(views) {
    let itemsHTML = `<li><a class="dropdown-item fw-bold" href="#" data-view-action="save">+ Save Current View</a></li><li><hr class="dropdown-divider"></li>`;
    if (views.length === 0) {
        itemsHTML += '<li><span class="dropdown-item-text text-muted">No saved views.</span></li>';
    } else {
        itemsHTML += views.map(view => `
            <li class="saved-view-list-item">
                <a class="dropdown-item" href="#" data-view-id="${view.id}">${view.name}</a>
                <div class="saved-view-actions">
                    <button class="update-view-btn" data-view-id="${view.id}" title="Update view with current filters">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                        </svg>
                    </button>
                    <button class="delete-view-btn" data-view-id="${view.id}" title="Delete view">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                           <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                           <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button>
                </div>
            </li>`).join('');
    }
    DOMElements.savedViewsMenu.innerHTML = itemsHTML;
}

function handleSavedViewsMenuClick(e) {
    const target = e.target;
    const saveButton = target.closest('[data-view-action="save"]');
    const loadButton = target.closest('a.dropdown-item[data-view-id]');
    const deleteButton = target.closest('.delete-view-btn');
    const updateButton = target.closest('.update-view-btn');

    if (saveButton) {
        e.preventDefault();
        saveCurrentView();
        return;
    }

    if (updateButton) {
        e.preventDefault();
        const viewId = updateButton.dataset.viewId;
        updateSavedView(viewId);
        return;
    }

    if (deleteButton) {
        e.preventDefault();
        const viewId = deleteButton.dataset.viewId;
        const views = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]');
        const updatedViews = views.filter(v => v.id !== viewId);
        localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updatedViews));
        renderSavedViewsMenu(updatedViews);
        return;
    }

    if (loadButton) {
        e.preventDefault();
        const viewId = loadButton.dataset.viewId;
        const views = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]');
        const viewToLoad = views.find(v => v.id === viewId);
        if (viewToLoad) applyState(viewToLoad);
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
