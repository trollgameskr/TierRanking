// Socket.IO 연결
const socket = io();

// DOM 요소
const userCountElement = document.getElementById('userCount');
const itemNameInput = document.getElementById('itemName');
const addItemBtn = document.getElementById('addItemBtn');

// 현재 티어 데이터
let currentTierData = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    unranked: []
};

// 드래그 중인 아이템
let draggedItem = null;

// 초기 데이터 수신
socket.on('initialData', (data) => {
    console.log('초기 데이터 수신:', data);
    currentTierData = data;
    renderTiers();
});

// 사용자 수 업데이트
socket.on('userCountUpdate', (count) => {
    userCountElement.textContent = `접속자: ${count}명`;
});

// 티어 업데이트 수신
socket.on('tierUpdated', (data) => {
    console.log('티어 업데이트 수신:', data);
    currentTierData = data;
    renderTiers();
});

// 아이템 추가 수신
socket.on('itemAdded', (item) => {
    console.log('새 아이템 추가:', item);
    currentTierData.unranked.push(item);
    renderTiers();
});

// 티어 렌더링
function renderTiers() {
    const tiers = ['S', 'A', 'B', 'C', 'D', 'unranked'];
    
    tiers.forEach(tier => {
        const tierContent = document.getElementById(`tier-${tier}`);
        tierContent.innerHTML = '';
        
        if (currentTierData[tier]) {
            currentTierData[tier].forEach(item => {
                const itemElement = createItemElement(item);
                tierContent.appendChild(itemElement);
            });
        }
    });
}

// 아이템 요소 생성
function createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'tier-item';
    div.textContent = item.name;
    div.setAttribute('draggable', 'true');
    div.dataset.itemId = item.id;
    
    // 드래그 이벤트 리스너
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    
    return div;
}

// 드래그 시작
function handleDragStart(e) {
    draggedItem = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

// 드래그 종료
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// 티어 컨텐츠에 드롭 이벤트 설정
document.querySelectorAll('.tier-content').forEach(tierContent => {
    tierContent.addEventListener('dragover', handleDragOver);
    tierContent.addEventListener('drop', handleDrop);
    tierContent.addEventListener('dragleave', handleDragLeave);
});

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    e.currentTarget.classList.remove('drag-over');
    
    if (draggedItem) {
        const itemId = draggedItem.dataset.itemId;
        const newTier = e.currentTarget.id.replace('tier-', '');
        
        // 이전 티어에서 아이템 제거
        let item = null;
        for (const tier in currentTierData) {
            const index = currentTierData[tier].findIndex(i => i.id === itemId);
            if (index !== -1) {
                item = currentTierData[tier].splice(index, 1)[0];
                break;
            }
        }
        
        // 새 티어에 아이템 추가
        if (item) {
            currentTierData[newTier].push(item);
            
            // 서버에 업데이트 전송
            socket.emit('updateTier', {
                tierData: currentTierData
            });
            
            // UI 업데이트
            renderTiers();
        }
    }
    
    return false;
}

// 아이템 추가
addItemBtn.addEventListener('click', () => {
    const itemName = itemNameInput.value.trim();
    
    if (itemName) {
        const newItem = {
            id: Date.now().toString(),
            name: itemName
        };
        
        // 로컬 데이터 업데이트
        currentTierData.unranked.push(newItem);
        
        // 서버에 전송
        socket.emit('addItem', newItem);
        
        // UI 업데이트
        renderTiers();
        
        // 입력 필드 초기화
        itemNameInput.value = '';
    }
});

// Enter 키로도 아이템 추가 가능
itemNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addItemBtn.click();
    }
});

// 초기 렌더링
renderTiers();
