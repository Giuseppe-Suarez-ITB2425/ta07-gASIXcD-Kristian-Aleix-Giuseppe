// ... existing code ...
async function loadCategoryData(category) {
    try {
        const jsonFiles = {
            water: '../data/water-data.json',
            cleaning: '../data/cleaning-data.json',
            office: '../data/office-data.json',
            services: '../data/services-data.json',
            internet: '../data/internet-data.json'
        };
        
        console.log('Loading:', jsonFiles[category]);
        const response = await fetch(jsonFiles[category]);
        // ... rest of the function ...
    } catch (error) {
        console.error(`Error loading ${category} consumption data:`, error);
        return null;
    }
}
// ... existing code ...