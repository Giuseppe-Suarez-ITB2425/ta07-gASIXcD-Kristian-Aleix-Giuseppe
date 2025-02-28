const seasonalFactors = {
    water: {
        1: 0.8, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.2, 6: 1.3,
        7: 1.4, 8: 1.4, 9: 1.1, 10: 0.9, 11: 0.8, 12: 0.8
    },
    office: {
        1: 1.2, 2: 1.2, 3: 1.1, 4: 1.1, 5: 1.0, 6: 0.7,
        7: 0.5, 8: 0.8, 9: 1.3, 10: 1.1, 11: 1.1, 12: 0.9
    },
    cleaning: {
        1: 1.1, 2: 1.1, 3: 1.1, 4: 1.0, 5: 1.0, 6: 0.8,
        7: 0.6, 8: 0.7, 9: 1.2, 10: 1.1, 11: 1.1, 12: 1.0
    },
    services: {
        1: 1.0, 2: 1.0, 3: 1.1, 4: 1.1, 5: 1.2, 6: 0.9,
        7: 0.7, 8: 0.7, 9: 1.2, 10: 1.1, 11: 1.0, 12: 1.0
    },
    // Primero, añadir los factores de internet que faltan en seasonalFactors
    internet: {
        1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 0.8,
        7: 0.5, 8: 0.5, 9: 1.2, 10: 1.0, 11: 1.0, 12: 1.0
    }
};
const categoryUnits = {
    water: 'm³',
    cleaning: '€',
    office: '€',
    services: '€',
    internet: '%'
};
const recommendations = {
    teléfonos: [
        "Utilizar luz natural siempre que sea posible",
        "Instalar sensores de movimiento por el alumbrado",
        "Canviar a bombetes LED d'alta eficiència",
        "Cambiar a bombillas LED de alta eficiencia",
        "Mantener a los equipos apagados fuera de horario"
    ],
    water: [
        "Instalar grifos con sensores o temporizadores",
        "Detectar y reparar fugas rápidamente",
        "Recoger agua de lluvia por riego",
        "Utilitzar cisternes de doble descàrrega",
        "Utilizar cisternas de doble descarga"
    ],
    office: [
        "Priorizar documentos digitales",
        "Imprimir a doble cara per defecte",
        "Reutilizar material cuando sea posible",
        "Establecer cuotas de impresión",
        "Fomentar el uso de materiales reciclados"
    ],
    cleaning: [
        "Utilizar productos concentrados",
        "Implementar sistemas de dosificación automática",
        "Formar al personal en el uso eficiente",
        "Optar por productos ecológicos",
        "Establecer protocolos de limpieza optimizados"
    ],
    services: [
        "Optimizar la gestión de los servicios",
        "Implementar sistemes de control automàtic",
        "Realizar mantenimiento preventivo regular",
        "Establecer protocolos de uso eficiente",
        "Monitorizar el consumo regularmente"
    ],
    internet: [
        "Implementar política de uso responsable de dispositivos móviles",
        "Establecer zonas libres de móviles",
        "Fomentar l'ús educatiu dels dispositius",
        "Monitorizar el uso durante las clases",
        "Crear conciencia sobre el uso adecuado"
    ]
};
function updateCalculator() {
    const category = document.getElementById('category').value;
    const unit = categoryUnits[category];
    document.getElementById('unit').textContent = unit;
    showRecommendations(category);
}
function updateDateInputs() {
    const dateRangeType = document.getElementById('dateRangeType').value;
    const dateInputs = document.getElementById('dateInputs');

    if (dateRangeType === 'custom') {
        dateInputs.style.display = 'grid';
    } else {
        dateInputs.style.display = 'none';
    }
}
function getDateRange() {
    const dateRangeType = document.getElementById('dateRangeType').value;
    let startDate, endDate;

    switch (dateRangeType) {
        case 'nextYear':
            startDate = new Date(2026, 0, 1); // 1 de enero de 2026
            endDate = new Date(2027, 11, 31); // 31 de diciembre de 2027
            break;

        case 'schoolYear':
            // Período escolar: septiembre 2024 - junio 2025
            startDate = new Date(2024, 8, 1); // 1 de septiembre de 2024
            endDate = new Date(2025, 5, 30); // 30 de junio de 2025
            break;

        case 'custom':
            startDate = new Date(document.getElementById('startDate').value);
            endDate = new Date(document.getElementById('endDate').value);
            if (!startDate || !endDate) {
                alert('Por favor, seleccione fechas válidas');
                return null;
            }
            break;
    }

    return { startDate, endDate };
}
async function loadCategoryData(category) {
    try {
        const jsonFiles = {
            water: 'water-data.json',
            cleaning: 'cleaning-data.json',
            office: 'office-data.json',
            services: 'services-data.json',
            internet: 'internet-data.json'
        };
        const response = await fetch(jsonFiles[category]);
        if (!response.ok) {
            throw new Error(`Error loading ${category} consumption data`);
        }
        const data = await response.json();
        console.log('Data loaded:', data); // Añadir esto para depurar

        if (category === 'cleaning') {
            return { totals: { annualWithVAT: parseFloat(data["ANUAL CON IVA"].replace(',', '.').replace(' €', '')) } };
        }

        if (category === 'water') {
            return { totals: { annualWithVAT: data.consumptionData.totals.yearlyConsumption } };
        }

        if (category === 'internet') {
            return data;
        }

        return data.consumptionData;
    } catch (error) {
        console.error(`Error loading ${category} consumption data:`, error);
        return null;
    }
}
async function calculate() {
    const category = document.getElementById('category').value;
    const dateRange = getDateRange();

    if (!dateRange) return;

    const categoryData = await loadCategoryData(category);
    if (!categoryData) {
        alert('Error loading consumption data');
        return;
    }

    const total = calculateConsumption(category, dateRange.startDate, dateRange.endDate, categoryData);

    displayResults(total, category, dateRange.startDate, dateRange.endDate);
}
function calculateConsumption(type, startDate, endDate, categoryData) {
    if (type === 'internet') {
        return calculateInternetConsumption(categoryData, startDate, endDate);
    }

    const annualConsumptionWithVAT = categoryData.totals.annualWithVAT;
    const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const dailyAverage = annualConsumptionWithVAT / 365;
    let total = 0;

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const month = currentDate.getMonth() + 1;
        const factor = seasonalFactors[type][month];
        total += dailyAverage * factor;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Total calculated:', total); // Añadir esto para depurar
    return total;
}
// Eliminar la función parseInternetData ya que es redundante
function calculateInternetConsumption(categoryData, startDate, endDate) {
    const groups = categoryData.data;
    let results = [];
    const dateRangeType = document.getElementById('dateRangeType').value;
    
    for (const group of groups) {
        // Para períodos futuros (2026 en adelante)
        if (dateRangeType === 'nextYear') {
            results.push({
                name: group.grupo,
                percentage: group.media_porcentaje,
                numRegistros: group.registros.length,
                isEstimated: true
            });
            continue;
        }

        const registrosFiltrados = group.registros.filter(registro => {
            const [day, month, year] = registro.fecha.split('/');
            const fecha = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
            return fecha >= startDate && fecha <= endDate;
        });

        let mediaPeriodo;
        if (registrosFiltrados.length > 0) {
            mediaPeriodo = registrosFiltrados.reduce((sum, reg) => sum + reg.porcentaje_moviles, 0) / registrosFiltrados.length;
        } else {
            // Nueva lógica para períodos personalizados sin datos
            let totalEstimado = 0;
            let numDias = 0;
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const month = currentDate.getMonth() + 1;
                const dayOfWeek = currentDate.getDay();
                
                // Factor estacional del mes
                const factorEstacional = seasonalFactors.internet[month];
                
                // Factor según día de la semana (menor uso en fines de semana)
                const factorDiaSemana = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.4 : 1.2;
                
                // Factor aleatorio controlado para añadir variabilidad
                const factorAleatorio = 0.9 + (Math.random() * 0.2); // ±10% variación
                
                totalEstimado += group.media_porcentaje * factorEstacional * factorDiaSemana * factorAleatorio;
                numDias++;
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            mediaPeriodo = totalEstimado / numDias;
        }

        results.push({
            name: group.grupo,
            percentage: mediaPeriodo,
            numRegistros: registrosFiltrados.length,
            isEstimated: registrosFiltrados.length === 0
        });
    }

    return results;
}
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
// Añadir después de la función calculateInternetConsumption existente
function parseInternetData(categoryData, startDate, endDate) {
    const groups = categoryData.data;
    let results = [];

    for (const group of groups) {
        const registrosFiltrados = group.registros.filter(registro => {
            const fecha = parseDate(registro.fecha);
            return fecha >= startDate && fecha <= endDate;
        });

        const mediaPeriodo = registrosFiltrados.length > 0
            ? registrosFiltrados.reduce((sum, reg) => sum + reg.porcentaje_moviles, 0) / registrosFiltrados.length
            : group.media_porcentaje;

        results.push({
            name: group.grupo,
            percentage: mediaPeriodo
        });
    }

    return results;
}
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
}
const categoryColors = {
    water: 'rgba(54, 162, 235, 0.5)', // Azul claro para Agua
    cleaning: 'rgba(255, 99, 132, 0.5)', // Rojo claro para Productos de Limpieza
    office: 'rgba(255, 206, 86, 0.5)', // Amarillo claro para Consumibles de Oficina
    services: 'rgba(75, 192, 192, 0.5)', // Cian claro para Material - Servicios
    internet: 'rgba(153, 102, 255, 0.5)' // Púrpura claro para Uso de teléfonos
};

// Modificar la función displayResults
// Al inicio del archivo, después de las constantes
let myChart = null;

function createChart(data) {
    const ctx = document.getElementById('consumptionChart').getContext('2d');
    const category = document.getElementById('category').value;
    const unit = categoryUnits[category];
    const color = categoryColors[category]; // Obtener el color de la categoría

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: `Consumo Mensual (${unit})`,
                data: data.values,
                backgroundColor: color, // Usar el color de la categoría
                borderColor: color, // Usar el mismo color para el borde
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Consumo: ${context.parsed.y.toFixed(2)} ${unit}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `Consumo (${unit})`
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Meses'
                    }
                }
            }
        }
    });
}

// Reemplazar la función displayResults existente con esta versión
function displayResults(total, category, startDate, endDate) {
    const resultsDiv = document.getElementById('results');
    
    if (category === 'internet') {
        // Mostrar resultados de internet
        resultsDiv.innerHTML = `
            <h3>Resultados del ${formatDate(startDate)} al ${formatDate(endDate)}:</h3>
            <div class="internet-results">
                ${total.map(group => `
                    <div class="group-result">
                        <strong>${group.name}:</strong> ${group.percentage.toFixed(2)}%
                        ${group.isEstimated ? ' (Estimado)' : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // Datos para el gráfico de internet
        const chartData = {
            labels: total.map(group => group.name),
            values: total.map(group => group.percentage)
        };
        createChart(chartData);
    } else {
        // Mostrar resultados para otras categorías
        const unit = categoryUnits[category];
        resultsDiv.innerHTML = `
            <h3>Resultados del ${formatDate(startDate)} al ${formatDate(endDate)}:</h3>
            <p>Consumo estimado: ${total.toFixed(2)} ${unit}</p>
        `;

        // Generar datos mensuales para el gráfico
        const monthlyData = generateMonthlyData(category, startDate, endDate, total);
        createChart(monthlyData);
    }
}

// Añadir esta nueva función para generar datos mensuales
function generateMonthlyData(category, startDate, endDate, totalConsumption) {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const months = [];
    const values = [];
    
    let currentDate = new Date(startDate);
    const endDateTime = endDate.getTime();
    
    // Calcular la suma total de los factores para el período
    let totalFactors = 0;
    let monthCount = 0;
    let tempDate = new Date(startDate);
    
    while (tempDate <= endDate) {
        const month = tempDate.getMonth() + 1;
        totalFactors += seasonalFactors[category][month];
        monthCount++;
        tempDate.setMonth(tempDate.getMonth() + 1);
    }

    // Distribuir el consumo total según los factores estacionales
    while (currentDate <= endDate) {
        const month = currentDate.getMonth();
        const monthName = monthNames[month];
        
        // Calcular la proporción para este mes
        const factor = seasonalFactors[category][month + 1];
        const monthlyValue = (totalConsumption * factor) / totalFactors;
        
        months.push(monthName);
        values.push(Number(monthlyValue.toFixed(2)));
        
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Verificar que la suma total coincida
    const sum = values.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - totalConsumption) > 0.01) {
        // Ajustar el último valor para que coincida exactamente
        const diff = totalConsumption - sum;
        values[values.length - 1] = Number((values[values.length - 1] + diff).toFixed(2));
    }

    return {
        labels: months,
        values: values
    };
}
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
// Modificar la función loadCategoryData para asegurar que devuelve los datos correctamente
async function loadCategoryData(category) {
    try {
        const jsonFiles = {
            water: './water-data.json',
            cleaning: './cleaning-data.json',
            office: './office-data.json',
            services: './services-data.json',
            internet: './internet-data.json'
        };
        
        console.log('Loading:', jsonFiles[category]);
        const response = await fetch(jsonFiles[category]);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data loaded:', data);

        switch(category) {
            case 'cleaning':
                return { totals: { annualWithVAT: parseFloat(data["ANUAL CON IVA"].replace(',', '.').replace(' ', '')) } };
            case 'water':
                return { totals: { annualWithVAT: data.consumptionData.totals.yearlyConsumption } };
            case 'services':
                return { totals: { annualWithVAT: data.consumptionData.totals.annualWithVAT } };
            case 'office':
                return { totals: { annualWithVAT: data.consumptionData.totals.annualWithVAT } };
            case 'internet':
                return data;
            default:
                console.error('Categoría no reconocida:', category);
                return null;
        }
    } catch (error) {
        console.error(`Error loading ${category} data:`, error);
        return null;
    }
}
function toggleRecommendations() {
    const recommendationsDiv = document.getElementById('recommendationsContent');
    const button = document.getElementById('showRecommendationsBtn');

    if (recommendationsDiv.style.display === 'none') {
        recommendationsDiv.style.display = 'block';
        button.textContent = 'Ocultar recomendaciones';
        showRecommendations(document.getElementById('category').value);
    } else {
        recommendationsDiv.style.display = 'none';
        button.textContent = 'Mostrar recomendaciones para reducir el consumo';
    }
}
function showRecommendations(category) {
    const recommendationsDiv = document.getElementById('recommendationsContent');
    recommendationsDiv.innerHTML = `
        <div class="recommendations-grid">
            <div class="recommendation-box">
                <h3>
                    <span class="text">Teléfonos</span>
                    <svg class="icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M11,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H11V21M13,3H19C20.1,3 21,3.89 21,5V19C21,20.1 20.1,21 19,21H13V3M15,5V19H19V5H15Z"/>
                    </svg>
                </h3>
                <ul>
                    ${recommendations.teléfonos.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            <div class="recommendation-box">
                <h3>
                    <span class="text">Agua</span>
                    <svg class="icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z"/>
                    </svg>
                </h3>
                <ul>
                    ${recommendations.water.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            <div class="recommendation-box">
                <h3>
                    <span class="text">Consumibles de Oficina</span>
                    <svg class="icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3M12,3C12.55,3 13,3.45 13,4C13,4.55 12.55,5 12,5C11.45,5 11,4.55 11,4C11,3.45 11.45,3 12,3"/>
                    </svg>
                </h3>
                <ul>
                    ${recommendations.office.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            <div class="recommendation-box">
                <h3>
                    <span class="text">Productos de Limpieza</span>
                    <svg class="icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19.36,2.72L20.78,4.14L15.06,9.85C16.13,11.39 16.28,13.24 15.38,14.44L9.06,8.12C10.26,7.22 12.11,7.37 13.65,8.44L19.36,2.72M5.93,17.57C3.92,15.56 2.69,13.16 2.35,10.92L7.23,8.83L14.67,16.27L12.58,21.15C10.34,20.81 7.94,19.58 5.93,17.57Z"/>
                    </svg>
                </h3>
                <ul>
                    ${recommendations.cleaning.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}


window.onload = () => {
    updateCalculator();
    updateDateInputs();
    document.getElementById('recommendationsContent').style.display = 'none';
};
