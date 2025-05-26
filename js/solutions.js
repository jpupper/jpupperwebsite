// Section toggle functionality

document.addEventListener('DOMContentLoaded', function() {
    const solutionsToggle = document.getElementById('solutions-toggle');
    const readytogoToggle = document.getElementById('readytogo-toggle');
    const solutionsSection = document.getElementById('solutions');
    const readytogoSection = document.getElementById('readytogo');
    
    solutionsToggle.addEventListener('click', function() {
        // Show solutions, hide readytogo
        solutionsSection.style.display = 'block';
        readytogoSection.style.display = 'none';
        
        // Update active states
        solutionsToggle.classList.add('active');
        readytogoToggle.classList.remove('active');
    });
    
    readytogoToggle.addEventListener('click', function() {
        // Show readytogo, hide solutions
        readytogoSection.style.display = 'block';
        solutionsSection.style.display = 'none';
        
        // Update active states
        readytogoToggle.classList.add('active');
        solutionsToggle.classList.remove('active');
    });
});
