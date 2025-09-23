// --- CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES ---
const DOMElements = {
    mainContainer: document.getElementById('main-container'),
    chartContainer: document.getElementById('chart-container'),
    filtersPanel: document.getElementById('filters-panel'),
    filterToggleButton: document.getElementById('filter-toggle-btn'),
    resizer: document.getElementById('resizer'),
    fechaArbol: document.getElementById('filtro-fecha-arbol'),
    org: document.getElementById('filtro-org'),
    region: document.getElementById('filtro-region'),
    pais: document.getElementById('filtro-pais'),
    type: document.getElementById('filtro-type'),
    toggleSpend: document.getElementById('toggle-spend'),
    spendOptions: document.getElementById('spend-options'),
    canvas: document.getElementById('graficoTendencia').getContext('2d'),
    legendContextMenu: document.getElementById('legend-context-menu'),
    groupingModal: document.getElementById('groupingModal'),
    groupTypesChecklist: document.getElementById('group-types-checklist'),
    groupNameInput: document.getElementById('group-name-input'),
    saveGroupBtn: document.getElementById('save-group-btn'),
    existingGroupsList: document.getElementById('existing-groups-list'),
    displayOptionsContainer: document.getElementById('display-options-container'),
    groupLinesBtn: document.getElementById('group-lines-btn'),
    spendToggleContainer: document.getElementById('spend-toggle-container'),
    shareOptionsContainer: document.getElementById('share-options-container')
};

let allData = [];
let chartInstance = null;
const PAISES_ESPECIALES = ["Turkey", "Brazil", "United States", "Mexico", "Argentina"];

const COLOR_PALETTE = [
  '#00B0F0', '#92D050', '#FFC000', '#FF00FF', '#FF6600',
  '#FF3399', '#00FFFF', '#008080', '#002060', '#00FF00',
  '#A02B93', '#FF0000', '#FFFF00', '#00FF99', '#0070C0',
  '#CCFF33', '#CC3300', '#008000', '#0000FF', '#595959'
];

let typeColorMap = {};
let annotationPluginRegistered = false;
let datasetStates = {};
let lineGroups = {};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    Papa.parse('data/Descarga_Spotfire.csv', {
        download: true, header: true, skipEmptyLines: true,
        complete: (results) => {
            allData = cleanData(results.data);
            populateFilters(allData);
            updateTypeFilterOrder();
            setupEventListeners();
            setTimeout(updateDashboard, 50);
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
    document.addEventListener('click', () => {
        DOMElements.legendContextMenu.style.display = 'none';
    });
    const liveUpdateElements = [DOMElements.org, DOMElements.region, DOMElements.pais];
    liveUpdateElements.forEach(el => el.addEventListener('change', () => {
        updateTypeFilterOrder();
        updateDashboard();
    }));
    DOMElements.type.addEventListener('change', updateDashboard);
    DOMElements.filtersPanel.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(el => {
        if (!el.classList.contains('year-checkbox') && !el.classList.contains('month-checkbox')) {
            el.addEventListener('change', updateDashboard);
        }
    });
    DOMElements.fechaArbol.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('toggle') || target.classList.contains('year-label')) {
            const toggle = target.closest('li').querySelector('.toggle');
            const monthsContainer = target.closest('li').querySelector('.months-container');
            const isVisible = monthsContainer.style.display === 'block';
            monthsContainer.style.display = isVisible ? 'none' : 'block';
            toggle.textContent = isVisible ? '[+]' : '[-]';
            return;
        }
        if (target.classList.contains('year-checkbox')) {
            const isChecked = target.checked;
            const monthCheckboxes = target.closest('li').querySelectorAll('.month-checkbox');
            monthCheckboxes.forEach(cb => cb.checked = isChecked);
        }
        if (target.type === 'checkbox') {
            updateTypeFilterOrder();
            updateDashboard();
        }
    });
    DOMElements.region.addEventListener('change', updateCountryFilter);
    DOMElements.toggleSpend.addEventListener('change', () => {
        DOMElements.spendOptions.style.display = DOMElements.toggleSpend.checked ? 'block' : 'none';
        updateDashboard();
    });

    DOMElements.legend = {
        onClick: (e, legendItem, legend) => {
            const chart = legend.chart;
            const filters = getFilterState();
            
            if (filters.metricLeads === 'share') {
                 chart.isDatasetVisible(legendItem.datasetIndex) 
                    ? chart.hide(legendItem.datasetIndex) 
                    : chart.show(legendItem.datasetIndex);
                legendItem.hidden = !chart.isDatasetVisible(legendItem.datasetIndex);
            } else {
                const dataset = chart.data.datasets[legendItem.datasetIndex];
                const isSpendMethodology = dataset.label.includes('Offline $');
                const isCantidadMode = filters.metricLeads === 'cantidad';
                const lockAxis = isSpendMethodology && isCantidadMode;

                const menuItems = DOMElements.legendContextMenu.querySelectorAll('li[data-action^="move-"]');
                if (lockAxis) {
                    menuItems.forEach(item => item.classList.add('disabled'));
                } else {
                    menuItems.forEach(item => item.classList.remove('disabled'));
                }
                e.native.stopImmediatePropagation();
                DOMElements.legendContextMenu.style.display = 'block';
                DOMElements.legendContextMenu.style.left = `${e.native.clientX}px`;
                DOMElements.legendContextMenu.style.top = `${e.native.clientY}px`;
                DOMElements.legendContextMenu.dataset.datasetIndex = legendItem.datasetIndex;
            }
        },
        labels: {
            generateLabels: (chart) => {
                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                const filters = getFilterState();
                if (filters.metricLeads !== 'share') {
                    originalLabels.forEach(label => {
                        const dataset = chart.data.datasets[label.datasetIndex];
                        const state = datasetStates[dataset.label] || {};
                        const yAxisID = state.yAxisID || dataset.yAxisID;
                        if (yAxisID === 'ySecondary') {
                            label.text += ' (Sec.)';
                        } else if (yAxisID === 'yTertiary') {
                            label.text += ' (Ter.)';
                        }
                    });
                }
                return originalLabels;
            }
        }
    };

    DOMElements.legendContextMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!e.target.matches('li') || e.target.classList.contains('disabled')) return;
        const action = e.target.dataset.action;
        const datasetIndex = parseInt(DOMElements.legendContextMenu.dataset.datasetIndex);
        const dataset = chartInstance.data.datasets[datasetIndex];
        if (!datasetStates[dataset.label]) {
            datasetStates[dataset.label] = { hidden: dataset.hidden, yAxisID: dataset.yAxisID };
        }
        if (action === 'toggle') {
            datasetStates[dataset.label].hidden = !dataset.hidden;
        } else if (action === 'move-to-primary') {
            datasetStates[dataset.label].yAxisID = 'yLeads';
        } else if (action === 'move-to-secondary') {
            datasetStates[dataset.label].yAxisID = 'ySecondary';
        } else if (action === 'move-to-tertiary') {
            datasetStates[dataset.label].yAxisID = 'yTertiary';
        }
        DOMElements.legendContextMenu.style.display = 'none';
        updateDashboard();
    });

    if (DOMElements.groupingModal) {
        DOMElements.groupingModal.addEventListener('shown.bs.modal', () => {
            updateGroupingModalChecklist();
        });
    }
    DOMElements.saveGroupBtn.addEventListener('click', () => {
        const groupName = DOMElements.groupNameInput.value.trim();
        const selectedCheckboxes = DOMElements.groupTypesChecklist.querySelectorAll('input:checked');
        const selectedTypes = Array.from(selectedCheckboxes).map(cb => cb.value);
        if (!groupName || selectedTypes.length < 2) {
            alert('Por favor, ingresa un nombre para el grupo y selecciona al menos dos Types.');
            return;
        }
        lineGroups[groupName] = selectedTypes;
        DOMElements.groupNameInput.value = '';
        selectedCheckboxes.forEach(cb => cb.checked = false);
        updateExistingGroupsList();
        updateDashboard();
    });
    DOMElements.existingGroupsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-group-btn')) {
            const groupNameToDelete = e.target.dataset.groupName;
            delete lineGroups[groupNameToDelete];
            updateExistingGroupsList();
            updateDashboard();
        }
    });
}

function updateTypeFilterOrder() {
    const filters = getFilterState();
    const partiallyFilteredData = allData.filter(row => {
        const isDateSelected = filters.dates.some(d => d.year === row.year && d.month === row.month);
        const orgMatch = filters.organization === 'all' || row.organization === filters.organization;
        const regionMatch = filters.region === 'all' || row.region === filters.region;
        const countryMatch = filters.countries.includes(row.country);
        return isDateSelected && orgMatch && regionMatch && countryMatch;
    });
    const typesWithLeads = _.chain(partiallyFilteredData)
        .groupBy('type')
        .map((rows, type) => ({ type: type, totalLeads: _.sumBy(rows, 'leads') }))
        .filter(item => item.totalLeads > 0)
        .sortBy('totalLeads')
        .reverse()
        .map('type')
        .value();
    const allPossibleTypes = _.sortBy(_.uniq(allData.map(d => d.type)));
    const typesWithZeroLeads = _.difference(allPossibleTypes, typesWithLeads);
    const finalSortedTypes = [...typesWithLeads, ...typesWithZeroLeads];
    const previouslySelectedTypes = new Set(getSelectedOptions(DOMElements.type));
    const typeSelect = DOMElements.type;
    typeSelect.innerHTML = '';
    finalSortedTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.innerText = type;
        if (previouslySelectedTypes.has(type)) {
            option.selected = true;
        }
        typeSelect.appendChild(option);
    });
}

function updateGroupingModalChecklist() {
    const filters = getFilterState();
    const partiallyFilteredData = allData.filter(row => {
        const isDateSelected = filters.dates.some(d => d.year === row.year && d.month === row.month);
        const orgMatch = filters.organization === 'all' || row.organization === filters.organization;
        const regionMatch = filters.region === 'all' || row.region === filters.region;
        const countryMatch = filters.countries.includes(row.country);
        return isDateSelected && orgMatch && regionMatch && countryMatch;
    });
    const typesWithLeads = _.chain(partiallyFilteredData)
        .groupBy('type')
        .map((rows, type) => ({ type, totalLeads: _.sumBy(rows, 'leads') }))
        .filter(item => item.totalLeads > 0)
        .sortBy('totalLeads')
        .reverse()
        .map('type')
        .value();
    const allPossibleTypes = _.sortBy(_.uniq(allData.map(d => d.type)));
    const typesWithZeroLeads = _.difference(allPossibleTypes, typesWithLeads);
    const finalSortedTypes = [...typesWithLeads, ...typesWithZeroLeads];
    DOMElements.groupTypesChecklist.innerHTML = finalSortedTypes.map(type => `<div class="form-check"><input class="form-check-input" type="checkbox" value="${type}" id="check-${type}"><label class="form-check-label" for="check-${type}">${type}</label></div>`).join('');
}

function updateExistingGroupsList() {
    let html = '';
    for (const groupName in lineGroups) {
        html += `<div class="existing-group-item"><span class="delete-group-btn" data-group-name="${groupName}">&times;</span><div class="group-name">${groupName}</div><div class="group-types">${lineGroups[groupName].join(', ')}</div></div>`;
    }
    DOMElements.existingGroupsList.innerHTML = html || '<p>Aún no se han creado grupos.</p>';
}

function makeResizable(panel, resizer) {
    let isResizing = false;
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true; document.body.style.cursor = 'ew-resize';
        const mouseMoveHandler = (moveEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - moveEvent.clientX;
            panel.style.width = `${newWidth}px`;
            chartInstance?.resize();
        };
        const mouseUpHandler = () => {
            isResizing = false; document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });
}

function updateControlStates(filters) {
    const isShareMode = filters.metricLeads === 'share';
    const isAcumulado = filters.displayType === 'acumulado';

    DOMElements.shareOptionsContainer.style.display = isShareMode ? 'block' : 'none';

    DOMElements.displayOptionsContainer.querySelectorAll('input').forEach(el => el.disabled = isShareMode);
    DOMElements.displayOptionsContainer.style.opacity = isShareMode ? 0.5 : 1;
    DOMElements.displayOptionsContainer.style.pointerEvents = isShareMode ? 'none' : 'auto';

    DOMElements.groupLinesBtn.disabled = isAcumulado && !isShareMode;
    DOMElements.groupLinesBtn.style.opacity = (isAcumulado && !isShareMode) ? 0.5 : 1;
    DOMElements.groupLinesBtn.style.pointerEvents = (isAcumulado && !isShareMode) ? 'none' : 'auto';
    
    DOMElements.spendToggleContainer.querySelector('input').disabled = isShareMode;
    DOMElements.spendToggleContainer.style.opacity = isShareMode ? 0.5 : 1;
    DOMElements.spendToggleContainer.style.pointerEvents = isShareMode ? 'none' : 'auto';

    if (isShareMode) {
        DOMElements.toggleSpend.checked = false;
        DOMElements.spendOptions.style.display = 'none';
    }
}

function updateDashboard() {
    const filters = getFilterState();
    updateControlStates(filters);
    const filteredData = applyFilters(allData, filters);
    const chartData = prepareDataForChart(filteredData, filters);
    renderChart(chartData, filters);
}

function cleanData(rawData) {
    return rawData.map(row => {
        const parseNumericValue = (value) => {
            if (typeof value !== 'string' || !value) return Number(value) || 0;
            const cleanedValue = value.replace(/[^0-9.-]+/g, "");
            return parseFloat(cleanedValue) || 0;
        };
        return { year: parseInt(row.Year_, 10), month: parseInt(row.Month_, 10), organization: row.Organization, region: row.Region, country: row.Country, type: row.Type, leads: parseNumericValue(row['Leads Eligible - Total']), spendMethodology: parseNumericValue(row['Offline Spend per Leads Methodology']), spendReal: parseNumericValue(row['Offline Spend Real']) };
    });
}

function populateFilters(data) {
    const dateStructure = _.chain(data).groupBy('year').mapValues(monthsData => _.sortBy(_.uniq(monthsData.map(d => d.month)))).value();
    let dateHtml = '<ul>';
    for (const year in dateStructure) { dateHtml += `<li><span class="toggle">[+]</span><input type="checkbox" class="year-checkbox" data-year="${year}" checked><span class="year-label">${year}</span><ul class="months-container">${dateStructure[year].map(month => `<li><input type="checkbox" class="month-checkbox" data-year="${year}" data-month="${month}" checked> ${String(month).padStart(2, '0')}</li>`).join('')}</ul></li>`; }
    dateHtml += '</ul>';
    DOMElements.fechaArbol.innerHTML = dateHtml;
    const unique = { orgs: _.sortBy(_.uniq(data.map(d => d.organization))), regions: _.sortBy(_.uniq(data.map(d => d.region))), types: _.sortBy(_.uniq(data.map(d => d.type))) };
    DOMElements.org.innerHTML = `<option value="all">Todas</option>` + unique.orgs.map(o => `<option value="${o}">${o}</option>`).join('');
    DOMElements.region.innerHTML = `<option value="all">Todas</option>` + unique.regions.map(r => `<option value="${r}">${r}</option>`).join('');
    DOMElements.type.innerHTML = unique.types.map(t => `<option value="${t}">${t}</option>`).join('');
    Array.from(DOMElements.type.options).forEach(opt => opt.selected = true);
    updateCountryFilter();
}

function updateCountryFilter() {
    const selectedRegion = DOMElements.region.value;
    let countries;
    if (selectedRegion === 'all') { countries = _.sortBy(_.uniq(allData.map(d => d.country))); } else { countries = _.sortBy(_.uniq(allData.filter(d => d.region === selectedRegion).map(d => d.country))); }
    DOMElements.pais.innerHTML = countries.map(c => `<option value="${c}">${c}</option>`).join('');
    Array.from(DOMElements.pais.options).forEach(opt => opt.selected = true);
}

function getFilterState() {
    const selectedDates = [];
    const monthCheckboxes = DOMElements.fechaArbol.querySelectorAll('.month-checkbox:checked');
    monthCheckboxes.forEach(cb => { selectedDates.push({ year: parseInt(cb.dataset.year), month: parseInt(cb.dataset.month) }); });
    return { 
        dates: selectedDates, 
        organization: DOMElements.org.value, 
        region: DOMElements.region.value, 
        countries: getSelectedOptions(DOMElements.pais), 
        types: getSelectedOptions(DOMElements.type), 
        metricLeads: document.querySelector('input[name="metric-leads"]:checked').value, 
        displayType: document.querySelector('input[name="display-type"]:checked').value, 
        showSpend: DOMElements.toggleSpend.checked, 
        metricSpend: document.querySelector('input[name="metric-spend"]:checked').value,
        shareCalc: document.querySelector('input[name="share-calc"]:checked').value
    };
}

function getSelectedOptions(selectElement) {
    return Array.from(selectElement.selectedOptions).map(option => option.value);
}

function applyFilters(data, filters) {
    let filtered = data.filter(row => 
        (filters.organization === 'all' || row.organization === filters.organization) &&
        (filters.region === 'all' || row.region === filters.region) &&
        filters.countries.includes(row.country)
    );

    if (filters.metricLeads === 'share') {
        let baseData = filtered.filter(row =>
            filters.dates.some(d => d.year === row.year && d.month === row.month)
        );
        if (filters.shareCalc === 'selected') {
            return baseData.filter(row => filters.types.includes(row.type));
        }
        return baseData;
    }

    const preFilteredData = filtered;
    if (filters.metricLeads === 'cantidad') {
        return preFilteredData.filter(row => 
            filters.dates.some(d => d.year === row.year && d.month === row.month)
        );
    }
    const necessaryDates = new Set();
    filters.dates.forEach(d => {
        necessaryDates.add(`${d.year}-${d.month}`);
        if (filters.metricLeads === 'yoy') {
            necessaryDates.add(`${d.year - 1}-${d.month}`);
        } else if (filters.metricLeads === 'mom') {
            let prevYear = d.year;
            let prevMonth = d.month - 1;
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear--;
            }
            necessaryDates.add(`${prevYear}-${prevMonth}`);
        }
    });
    return preFilteredData.filter(row => necessaryDates.has(`${row.year}-${row.month}`));
}

function prepareDataForChart(data, filters) {
    const groupingKey = d => `${d.year}-${String(d.month).padStart(2, '0')}`;
    let chartLabels = _.sortBy(_.uniq(data.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`).filter(g => filters.dates.some(d => `${d.year}-${String(d.month).padStart(2, '0')}` === g))));

    if (filters.metricLeads === 'share') {
        const itemsToProcess = [];
        const selectedTypes = new Set(filters.types);
        const processedTypes = new Set();

        for (const groupName in lineGroups) {
            const members = lineGroups[groupName];
            const isGroupActive = members.some(type => selectedTypes.has(type));
            if (isGroupActive) {
                itemsToProcess.push({ name: groupName, isGroup: true, members: members });
                members.forEach(type => processedTypes.add(type));
            }
        }
        selectedTypes.forEach(type => {
            if (!processedTypes.has(type)) {
                itemsToProcess.push({ name: type, isGroup: false });
            }
        });

        const dataForTotals = (filters.shareCalc === 'all') ? applyFilters(allData, {...filters, shareCalc: 'all'}) : data;
        const monthlyTotals = _.chain(dataForTotals).groupBy(groupingKey).mapValues(g => _.sumBy(g, 'leads')).value();

        const datasets = [];
        itemsToProcess.forEach((item, index) => {
            const typesToSum = item.isGroup ? item.members : [item.name];
            const itemDataByMonth = _.chain(data)
                .filter(d => typesToSum.includes(d.type))
                .groupBy(groupingKey)
                .mapValues(g => _.sumBy(g, 'leads'))
                .value();

            const dataPoints = chartLabels.map(label => {
                const totalForMonth = monthlyTotals[label] || 0;
                if (totalForMonth === 0) {
                    return 0;
                }
                const itemLeads = itemDataByMonth[label] || 0;
                return (itemLeads / totalForMonth) * 100;
            });
            
            datasets.push({
                label: item.name,
                data: dataPoints,
                backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length],
            });
        });

        return { labels: chartLabels, datasets };
    }

    const dataWithSpecialSpend = data.map(row => {
        const newRow = { ...row };
        if (!PAISES_ESPECIALES.includes(row.country)) {
            const totalOtrosSpend = _.sumBy(data.filter(d => d.year === row.year && d.month === row.month && !PAISES_ESPECIALES.includes(d.country)), 'spendReal');
            newRow.spendReal = totalOtrosSpend;
        }
        return newRow;
    });

    const groupedData = _.groupBy(dataWithSpecialSpend, groupingKey);
    const allLabels = _.sortBy(Object.keys(groupedData));
    chartLabels = _.sortBy(filters.dates.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`)).filter(l => allLabels.includes(l));

    let datasets = [];
    let itemsToProcess;
    if (filters.displayType === 'acumulado') {
        itemsToProcess = [{ name: 'Acumulado', isGroup: false }];
    } else {
        const selectedTypes = new Set(filters.types);
        const processedTypes = new Set();
        const finalDisplayItems = [];

        for (const groupName in lineGroups) {
            const members = lineGroups[groupName];
            const isGroupActive = members.some(type => selectedTypes.has(type));
            if (isGroupActive) {
                finalDisplayItems.push({ name: groupName, isGroup: true, members: members });
                members.forEach(type => processedTypes.add(type));
            }
        }
        selectedTypes.forEach(type => {
            if (!processedTypes.has(type)) {
                finalDisplayItems.push({ name: type, isGroup: false });
            }
        });
        
        finalDisplayItems.forEach(item => {
            const typesToSum = item.isGroup ? item.members : [item.name];
            const dataInDateRange = allData.filter(d => filters.dates.some(date => date.year === d.year && date.month === d.month) && (filters.organization === 'all' || d.organization === filters.organization) && (filters.region === 'all' || d.region === filters.region) && filters.countries.includes(d.country));
            item.totalLeads = _.sumBy(dataInDateRange.filter(d => typesToSum.includes(d.type)), 'leads');
        });
        itemsToProcess = _.orderBy(finalDisplayItems, ['totalLeads'], ['desc']);
    }
    
    itemsToProcess.forEach((itemInfo, index) => {
        const item = itemInfo.name;
        const monthlyValues = { leads: {} };
        allLabels.forEach(label => {
            const group = groupedData[label];
            let itemsToSum;
            if (item === 'Acumulado') { itemsToSum = group; } 
            else if (lineGroups[item]) { itemsToSum = group ? group.filter(d => lineGroups[item].includes(d.type)) : []; } 
            else { itemsToSum = group ? group.filter(d => d.type === item) : []; }
            monthlyValues.leads[label] = _.sumBy(itemsToSum, 'leads');
        });
        const dataPoints = chartLabels.map(label => {
            const [year, month] = label.split('-').map(Number);
            const currentValue = monthlyValues.leads[label] || 0;
            if (filters.metricLeads === 'yoy') {
                const prevYearLabel = `${year - 1}-${String(month).padStart(2, '0')}`;
                const prevYearValue = monthlyValues.leads[prevYearLabel];
                return (prevYearValue !== undefined && prevYearValue !== 0) ? ((currentValue - prevYearValue) / prevYearValue) * 100 : null;
            }
            if (filters.metricLeads === 'mom') {
                let prevYear = year; let prevMonth = month - 1;
                if (prevMonth === 0) { prevMonth = 12; prevYear--; }
                const prevMonthLabel = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
                const prevMonthValue = monthlyValues.leads[prevMonthLabel];
                return (prevMonthValue !== undefined && prevMonthValue !== 0) ? ((currentValue - prevMonthValue) / prevMonthValue) * 100 : null;
            }
            return currentValue;
        });
        
        const itemColor = typeColorMap[item] || COLOR_PALETTE[index % COLOR_PALETTE.length];
        
        const leadsDataset = { label: `Leads ${item}`, data: dataPoints, borderColor: itemColor, yAxisID: 'yLeads', tension: 0.1 };
        if (datasetStates[leadsDataset.label]) { Object.assign(leadsDataset, datasetStates[leadsDataset.label]); }
        datasets.push(leadsDataset);
    });

    if (filters.showSpend && filters.metricSpend === 'methodology') {
        const necessarySpendDates = new Set();
        filters.dates.forEach(d => {
            const currentLabel = `${d.year}-${String(d.month).padStart(2, '0')}`;
            necessarySpendDates.add(currentLabel);
            if (filters.metricLeads === 'yoy') {
                necessarySpendDates.add(`${d.year - 1}-${String(d.month).padStart(2, '0')}`);
            } else if (filters.metricLeads === 'mom') {
                let prevYear = d.year; let prevMonth = d.month - 1;
                if (prevMonth === 0) { prevMonth = 12; prevYear--; }
                necessarySpendDates.add(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
            }
        });
        
        const spendFilteredData = allData.filter(row => 
            (filters.organization === 'all' || row.organization === filters.organization) &&
            (filters.region === 'all' || row.region === filters.region) &&
            filters.countries.includes(row.country) &&
            necessarySpendDates.has(`${row.year}-${String(row.month).padStart(2, '0')}`)
        );

        const groupedSpendData = _.groupBy(spendFilteredData, d => `${d.year}-${String(d.month).padStart(2, '0')}`);
        const monthlySpendTotals = _.mapValues(groupedSpendData, rows => _.sumBy(rows, 'spendMethodology'));

        const spendDataPoints = chartLabels.map(label => {
            const [year, month] = label.split('-').map(Number);
            const currentValue = monthlySpendTotals[label] || 0;
            if (filters.metricLeads === 'yoy') {
                const prevYearLabel = `${year - 1}-${String(month).padStart(2, '0')}`;
                const prevYearValue = monthlySpendTotals[prevYearLabel];
                return (prevYearValue !== undefined && prevYearValue !== 0) ? ((currentValue - prevYearValue) / prevYearValue) * 100 : null;
            }
            if (filters.metricLeads === 'mom') {
                let prevYear = year; let prevMonth = month - 1;
                if (prevMonth === 0) { prevMonth = 12; prevYear--; }
                const prevMonthLabel = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
                const prevMonthValue = monthlySpendTotals[prevMonthLabel];
                return (prevMonthValue !== undefined && prevMonthValue !== 0) ? ((currentValue - prevMonthValue) / prevMonthValue) * 100 : null;
            }
            return currentValue;
        });

        const isCantidadMode = filters.metricLeads === 'cantidad';
        const spendLabel = `Offline $ per Lead Methodology`;
        const spendDataset = {
            label: spendLabel,
            data: spendDataPoints,
            borderColor: '#dc3545',
            borderDash: [5, 5],
            yAxisID: 'ySpend',
            tension: 0.1
        };
        
        if (datasetStates[spendLabel]) {
            Object.assign(spendDataset, datasetStates[spendLabel]);
        }
        
        if (isCantidadMode) {
            spendDataset.yAxisID = 'ySpend';
            if(datasetStates[spendLabel]) {
                 datasetStates[spendLabel].yAxisID = 'ySpend';
            }
        } else {
            if (!datasetStates[spendLabel] || datasetStates[spendLabel].yAxisID === 'ySpend') {
                spendDataset.yAxisID = 'yLeads';
            }
        }
        
        datasets.push(spendDataset);
    }
    
    return { labels: chartLabels, datasets };
}

function renderChart(chartData, filters) {
    if (chartInstance) {
        chartInstance.destroy();
    }
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
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) {
                            const value = context.raw;
                            if (isShareMode) {
                                label += `${value.toFixed(2)}%`;
                            } else {
                                const isDatasetPercentage = context.dataset.yAxisID !== 'ySpend';
                                if (isDatasetPercentage && isPercentage) {
                                     label += `${Math.round(value)}%`;
                                } else {
                                    label += numberFormatter.format(value);
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
        chartOptions.scales = {
            x: { stacked: true },
            y: {
                stacked: true,
                max: 100,
                title: { display: true, text: '% Share' },
                ticks: { callback: (value) => `${value}%` }
            }
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
        const axisTickFormatter = (value) => {
            if (isPercentage && value === 0) return '0%';
            if (Math.abs(value) < 1 && value !== 0) return '';
            if (Math.floor(value) !== value) return '';
            return isPercentage ? `${Math.round(value)}%` : numberFormatter.format(value);
        };

        chartOptions.plugins.annotation = { annotations: annotationPluginRegistered ? yearAnnotations : {} };
        chartOptions.scales = {
            yLeads: { type: 'linear', display: true, position: 'left', title: { display: true, text: isPercentage ? '% Crecimiento' : 'Cantidad' }, ticks: { callback: axisTickFormatter }},
            ySpend: { type: 'linear', display: yAxesUsed.has('ySpend'), position: 'right', title: { display: true, text: 'Monto Spend ($)' }, grid: { drawOnChartArea: false }, ticks: { callback: (value) => numberFormatter.format(value) }},
            ySecondary: { type: 'linear', display: yAxesUsed.has('ySecondary'), position: 'right', title: {display: true, text: 'Eje Secundario'}, grid: { drawOnChartArea: false }, ticks: { callback: axisTickFormatter }},
            yTertiary: { type: 'linear', display: yAxesUsed.has('yTertiary'), position: 'right', title: {display: true, text: 'Eje Terciario'}, grid: { drawOnChartArea: false }, ticks: { callback: axisTickFormatter }}
        };
    }
    
    chartInstance = new Chart(DOMElements.canvas, {
        type: chartType,
        data: chartData,
        options: chartOptions
    });
}