function configureContainer(container) {
    container.innerHTML = '';
    // container.style.display = 'flex';
    // container.style.flexDirection = 'column';
    // container.style.justifyContent = 'center'; 
    // container.style.alignItems = 'center'; 
    // container.style.overflow = 'auto';
    container.style.zIndex = '1000';
}

function updateMenuDimensions() {
    const container = document.getElementById('dynamicContent');
    if (!container) return;

    // Calculer les dimensions initiales une seule fois
    const containerRect = container.getBoundingClientRect();
    const width = `${containerRect.width}px`;
    const height = `${containerRect.height}px`;

    // Appliquer les dimensions fixes
    container.style.width = width;
    container.style.height = height;
}

// document.addEventListener('DOMContentLoaded', updateMenuDimensions);
document.addEventListener('DOMContentLoaded', updateMenuDimensions);
// window.addEventListener('scroll', updateMenuDimensions);

function newWindowGrid(){
    const newWindow = document.createElement('div');
    const rect = document.getElementById('dynamicContent').getBoundingClientRect();
    newWindow.id = 'newWindow2';
    newWindow.classList.add('resizableMenu');
    newWindow.style.position = 'absolute';
    newWindow.style.top = `${rect.top}px`;
    newWindow.style.left = `${rect.left}px`;
    newWindow.style.width = `${rect.width}px`;
    newWindow.style.height = `${rect.height}px`;
    newWindow.style.backgroundColor = 'rgba(0, 0, 0, 1)';
    newWindow.style.zIndex = '1000';

    document.body.appendChild(newWindow);
    return newWindow;
}