        const categories = ['帽子', '衣服', '牛仔褲', '外套', '褲子', '襪子', '手套'];
        const categoryIcons = ['Cap', 'Shirt', 'Jeans', 'Coat', 'Pants', 'Socks', 'Gloves'];
        let products = [], cart = [], currentUser = null, filteredProducts = [];
        let checkInData = { lastCheckIn: null, streak: 0, points: 0, coupons: [], lastWheelDate: null };

        // 獎項配置
        const prizes = [
            { text: '95折券', type: 'percent', value: 0.95, color: '#ff9ff3' },
            { text: '銘謝惠顧', type: 'none', value: 1, color: '#dfe6e9' },
            { text: '9折券', type: 'percent', value: 0.9, color: '#54a0ff' },
            { text: '現金100', type: 'cash', value: 100, color: '#ff6b6b' },
            { text: '85折券', type: 'percent', value: 0.85, color: '#feca57' },
            { text: '現金50', type: 'cash', value: 50, color: '#1dd1a1' }
        ];

        function init() {
            generateProducts();
            displayFeaturedProducts();
            displayCategories();
            renderFilterCheckboxes();
            displayProducts();
            loadCart();
            renderWheel();
            checkRememberedUser();
        }

        // ========== 會員與登入邏輯 ==========
        function toggleAuthForm(type) {
            document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
            document.getElementById('registerForm').style.display = type === 'register' ? 'block' : 'none';
        }
        
        function checkRememberedUser() {
            const savedEmail = localStorage.getItem('remembered_account');
            if (savedEmail) {
                document.getElementById('loginEmail').value = savedEmail;
                document.getElementById('rememberMe').checked = true;
            }
        }

        function performRegister() {
            const name = document.getElementById('regName').value, email = document.getElementById('regEmail').value, password = document.getElementById('regPassword').value;
            if (!name || !email || !password) return showNotification('請填寫完整', 'error');
            if (localStorage.getItem(`user_${email}`)) return showNotification('帳號已存在', 'error');
            localStorage.setItem(`user_${email}`, JSON.stringify({ name: name, email: email, password: password, totalSpent: 0 }));
            showNotification('註冊成功'); toggleAuthForm('login');
        }
        
        function performLogin() {
            const email = document.getElementById('loginEmail').value, password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            const user = JSON.parse(localStorage.getItem(`user_${email}`));
            
            if (!user || user.password !== password) return showNotification('帳號或密碼錯誤', 'error');
            
            if (rememberMe) {
                localStorage.setItem('remembered_account', email);
            } else {
                localStorage.removeItem('remembered_account');
            }

            currentUser = user;
            updateMemberRank();
            document.getElementById('userArea').style.display = 'inline-block';
            document.getElementById('loginBtn').style.display = 'none';
            closeLogin(); 
            loadCheckInData(); 
            
            // 關鍵修改：登入後載入該帳號購物車
            loadCart(); 
            
            showNotification('登入成功');
        }
        
        function logout() { 
            currentUser = null; 
            cart = []; // 關鍵修改：登出時清空記憶體中的購物車
            localStorage.removeItem('cart'); // 清除未登入狀態的暫存
            location.reload(); 
        }

        // ========== 下拉選單與等級制會員 ==========
        function toggleUserDropdown() {
            document.getElementById('userDropdown').classList.toggle('show');
        }

        function updateMemberRank() {
            const spent = currentUser.totalSpent || 0;
            const display = document.getElementById('userDisplay');
            
            display.innerHTML = `<span id="rankBadge" class="rank-badge"></span> 👤 ${currentUser.name}`;
            const newBadge = document.getElementById('rankBadge');

            if (spent >= 15000) {
                newBadge.textContent = '鑽石卡';
                newBadge.className = 'rank-badge rank-diamond';
            } else if (spent >= 5000) {
                newBadge.textContent = '金卡';
                newBadge.className = 'rank-badge rank-gold';
            } else {
                newBadge.textContent = '銀卡';
                newBadge.className = 'rank-badge rank-silver';
            }
        }

        function showPointsNotification() {
            showNotification(`💰 目前會員點數：${checkInData.points} 點`, 'success');
            document.getElementById('userDropdown').classList.remove('show');
        }

        function openUserInfo() {
            document.getElementById('infoEmail').textContent = currentUser.email;
            document.getElementById('infoTotalSpent').textContent = `$${currentUser.totalSpent || 0}`;
            document.getElementById('updateName').value = currentUser.name;
            displayOrderHistory(); // 載入歷史訂單
            document.getElementById('userInfoModal').classList.add('active');
            document.getElementById('userDropdown').classList.remove('show');
        }

        // ========== 歷史訂單邏輯 ==========
        function displayOrderHistory() {
            const orderListContainer = document.getElementById('orderHistoryList');
            if (!orderListContainer) return;

            // 從 localStorage 讀取該會員的訂單歷史
            const userOrders = JSON.parse(localStorage.getItem(`orders_${currentUser.email}`) || '[]');
            
            if (userOrders.length === 0) {
                orderListContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">目前尚無訂單記錄</p>';
                return;
            }

            // 按訂單日期倒序排列（最新的在前）
            userOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

            // 生成訂單列表 HTML
            orderListContainer.innerHTML = userOrders.map(order => {
                const orderDate = new Date(order.orderDate).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const itemsList = order.items.map(item => 
                    `<div style="font-size: 13px; color: #666; margin: 3px 0;">${item.name} x ${item.quantity} - $${item.price * item.quantity}</div>`
                ).join('');

                return `
                    <div class="order-history-item" style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid var(--primary-color);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <div>
                                <div style="font-weight: bold; color: var(--dark-color); margin-bottom: 5px;">訂單編號: #${order.orderId}</div>
                                <div style="font-size: 12px; color: #999;">${orderDate}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: var(--primary-color); font-size: 18px;">$${order.finalPrice}</div>
                            </div>
                        </div>
                        
                        <div style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;"><strong>收件人：</strong>${order.recipient.name}</div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;"><strong>電話：</strong>${order.recipient.phone}</div>
                            <div style="font-size: 13px; color: #666;"><strong>地址：</strong>${order.recipient.address}</div>
                        </div>

                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 12px; color: #666; font-weight: bold; margin-bottom: 5px;">購買商品：</div>
                            ${itemsList}
                        </div>

                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; padding-top: 10px; border-top: 1px solid #ddd;">
                            <div>
                                <div>付款方式: ${order.payment}</div>
                                ${order.coupon !== '無' ? `<div>優惠券: ${order.coupon}</div>` : ''}
                            </div>
                            <div style="text-align: right;">
                                ${order.pointsUsed > 0 ? `<div>點數折抵: -$${order.pointsDiscount} (${order.pointsUsed}點)</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function processUpdateInfo() {
            const newName = document.getElementById('updateName').value;
            const newPassword = document.getElementById('updatePassword').value;
            
            if(!newName) return showNotification('姓名不能為空', 'error');
            
            currentUser.name = newName;
            if(newPassword) currentUser.password = newPassword;
            
            localStorage.setItem(`user_${currentUser.email}`, JSON.stringify(currentUser));
            document.getElementById('userDisplay').textContent = `👤 ${currentUser.name}`;
            updateMemberRank();
            closeModal('userInfoModal');
            showNotification('會員資料已更新');
        }

        function openCoupons() {
            const list = document.getElementById('couponsList');
            const coupons = checkInData.coupons || [];
            
            if(coupons.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">目前尚無優惠券</p>';
            } else {
                list.innerHTML = coupons.map(c => `
                    <div style="background:#f9f9f9; border-left:5px solid var(--primary-color); padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border-radius:4px;">
                        <div><span style="font-weight:bold; color:var(--dark-color);">${c.text}</span></div>
                        <span style="background:var(--primary-color); color:white; padding:4px 8px; border-radius:4px; font-size:12px;">未使用</span>
                    </div>`).join('');
            }
            
            document.getElementById('couponsModal').classList.add('active');
            document.getElementById('userDropdown').classList.remove('show');
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }

        // ========== 導覽邏輯：確保每次切換都隱藏所有分頁 ==========
        function goToHome() {
        document.getElementById('homePage').style.display = 'block';
        document.getElementById('shopPage').style.display = 'none';
        document.getElementById('resalePage').style.display = 'none';
        document.getElementById('resaleMarketPage').style.display = 'none';
        document.getElementById('miniGamePage').style.display = 'none'; // 確保遊戲頁被隱藏
        window.scrollTo(0,0);
        }
        function goToShop() {
            document.getElementById('homePage').style.display = 'none';
            document.getElementById('shopPage').style.display = 'block';
            document.getElementById('resalePage').style.display = 'none';
            document.getElementById('resaleMarketPage').style.display = 'none';
            document.getElementById('miniGamePage').style.display = 'none'; // 隱藏遊戲
            window.scrollTo(0,0);
        }
        function goToResale() {
            document.getElementById('homePage').style.display = 'none';
            document.getElementById('shopPage').style.display = 'none';
            document.getElementById('resalePage').style.display = 'block';
            document.getElementById('resaleMarketPage').style.display = 'none';
            document.getElementById('miniGamePage').style.display = 'none'; // 隱藏遊戲
            window.scrollTo(0,0);
        }
        function goToResaleMarket() {
            document.getElementById('homePage').style.display = 'none';
            document.getElementById('shopPage').style.display = 'none';
            document.getElementById('resalePage').style.display = 'none';
            document.getElementById('resaleMarketPage').style.display = 'block';
            document.getElementById('miniGamePage').style.display = 'none';
            renderResaleMarketFilters(); // 渲染分類篩選
            displayResaleItems(); // 顯示所有二手衣物
            window.scrollTo(0,0);
        }
        // ========== 二手轉讓邏輯 ==========
        function previewResaleImage(input) {
            const preview = document.getElementById('resaleImagePreview');
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                reader.readAsDataURL(input.files[0]);
            }
        }

        function submitResaleClothes() {
            if (!currentUser) return (showNotification('請先登入才能轉讓衣物', 'error'), openLogin());
            
            const name = document.getElementById('resaleItemName').value;
            const desc = document.getElementById('resaleDescription').value;
            const category = document.getElementById('resaleCategory').value;
            const imgInput = document.getElementById('resaleImage');
            const preview = document.getElementById('resaleImagePreview');
            
            if (!name || !desc) return showNotification('請輸入完整的衣物資訊', 'error');
            if (!imgInput.files || !imgInput.files[0]) return showNotification('請上傳一張衣物圖片', 'error');

            // 讀取圖片並轉換為 base64
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                
                // 創建二手衣物物件
                const resaleItem = {
                    id: Date.now(), // 使用時間戳作為唯一 ID
                    name: name,
                    category: category,
                    description: desc,
                    image: imageData, // base64 圖片數據
                    sellerName: currentUser.name,
                    sellerEmail: currentUser.email,
                    submitDate: new Date().toISOString()
                };

                // 從 localStorage 讀取現有的二手衣物列表
                let resaleItems = JSON.parse(localStorage.getItem('resaleItems') || '[]');
                resaleItems.push(resaleItem);
                
                // 保存到 localStorage
                localStorage.setItem('resaleItems', JSON.stringify(resaleItems));

                // 增加 200 點
                checkInData.points += 200;
                saveCheckInData();

                showNotification('提交成功！感謝支持永續時尚，200 點數已匯入帳號。', 'success');
                
                // 重置表單並回首頁
                document.getElementById('resaleItemName').value = '';
                document.getElementById('resaleDescription').value = '';
                document.getElementById('resaleCategory').value = '衣服';
                document.getElementById('resaleImage').value = '';
                preview.style.display = 'none';
                preview.src = '';
                goToHome();
            };
            
            reader.readAsDataURL(imgInput.files[0]);
        }

        // ========== 二手市集邏輯 ==========
        function renderResaleMarketFilters() {
            const container = document.getElementById('resaleMarketCategoryContainer');
            const resaleCategories = ['衣服', '褲子', '外套', '配件'];
            container.innerHTML = resaleCategories.map(cat => 
                `<div class="filter-option"><input type="checkbox" class="resale-cat-check" id="resale-cat-${cat}" onchange="filterResaleItems()"><label for="resale-cat-${cat}">${cat}</label></div>`
            ).join('');
        }

        function displayResaleItems() {
            const grid = document.getElementById('resaleMarketGrid');
            const emptyState = document.getElementById('resaleMarketEmpty');
            
            // 從 localStorage 讀取所有二手衣物
            let resaleItems = JSON.parse(localStorage.getItem('resaleItems') || '[]');
            
            // 按提交時間倒序排列（最新的在前）
            resaleItems.sort((a, b) => new Date(b.submitDate) - new Date(a.submitDate));
            
            if (resaleItems.length === 0) {
                if (grid) grid.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }
            
            if (grid) grid.style.display = 'grid';
            if (emptyState) emptyState.style.display = 'none';
            
            // 應用篩選
            const filteredItems = filterResaleItemsData(resaleItems);
            
            if (filteredItems.length === 0) {
                if (grid) grid.style.display = 'none';
                if (emptyState) {
                    emptyState.style.display = 'block';
                    emptyState.innerHTML = '<p style="font-size: 18px; margin-bottom: 10px;">沒有找到符合條件的二手衣物</p>';
                }
                return;
            }
            
            // 生成 HTML - 使用與商品頁相同的 product-card 樣式
            if (grid) {
                grid.innerHTML = filteredItems.map(item => {
                    const submitDate = new Date(item.submitDate).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                    
                    return `
                        <div class="product-card">
                            <div class="product-image" style="background: white;">
                                <img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\'%3E圖片載入失敗%3C/text%3E%3C/svg%3E'">
                            </div>
                            <div class="product-info">
                                <h3>${item.name}</h3>
                                <p style="color: var(--secondary-color); font-weight: bold; margin: 5px 0;">${item.category}</p>
                                <p style="color: #666; font-size: 13px; margin: 8px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.description}</p>
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                                    <div>👤 ${item.sellerName}</div>
                                    <div style="margin-top: 5px;">📅 ${submitDate}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        function filterResaleItemsData(items) {
            const searchTerm = (document.getElementById('resaleMarketSearch')?.value || '').toLowerCase();
            const checkedCategories = Array.from(document.querySelectorAll('.resale-cat-check:checked'))
                                           .map(el => el.id.replace('resale-cat-', ''));
            
            return items.filter(item => {
                const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm) || 
                                    item.description.toLowerCase().includes(searchTerm);
                const matchesCategory = checkedCategories.length === 0 || checkedCategories.includes(item.category);
                
                return matchesSearch && matchesCategory;
            });
        }

        function filterResaleItems() {
            displayResaleItems();
        }

        // ========== 尺碼助手邏輯 ==========
        function openSizeAssistant() {
            document.getElementById('sizeResult').style.display = 'none';
            document.getElementById('sizeModal').classList.add('active');
        }

        function calculateSize() {
            const h = parseFloat(document.getElementById('userHeight').value);
            const w = parseFloat(document.getElementById('userWeight').value);
            if (!h || !w) return showNotification('請輸入完整的數據', 'error');

            const bmi = w / ((h / 100) ** 2);
            let size = bmi < 23 ? "M" : "L";
            document.getElementById('suggestedSize').textContent = size;
            document.getElementById('sizeResult').style.display = 'block';
        }

        // ========== 聯繫官方邏輯 ==========
        function openContactModal() {
            document.getElementById('contactModal').classList.add('active');
        }

        function submitContactMessage() {
            showNotification('留言發送成功');
            closeModal('contactModal');
        }

        let currentSlide = 0;
        let autoSlideTimer;

        // 修改：選取前 8 個商品來做輪播 (4個看得到，4個在旁邊預備)
        function displayFeaturedProducts() {
        const featuredContainer = document.getElementById('featuredProducts');
    
        // 這裡改為選取 8 個商品
        const featuredItems = products.slice(0, 8); 
    
        featuredContainer.innerHTML = featuredItems.map(p => `
        <div class="product-card">
            <div class="product-image">${p.category}</div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>$${p.price}</p>
                <button class="add-to-cart-btn" onclick="addToCart(${p.id})">加入購物車</button>
            </div>
        </div>`).join('');
    
        // 啟動輪播
        resetAutoSlide(); 
        }

    // 修正：移動邏輯 (確保計算 visibleCards 正確)
    function moveSlide(direction) {
    const container = document.getElementById('featuredProducts');
    const cards = container.getElementsByClassName('product-card');
    if (cards.length === 0) return;

    // 根據目前的視窗寬度判斷「現在看得到幾個」
    let visibleCards = 4;
    if (window.innerWidth <= 600) visibleCards = 1;
    else if (window.innerWidth <= 850) visibleCards = 2;
    else if (window.innerWidth <= 1100) visibleCards = 3;

    const maxSlide = cards.length - visibleCards;

    currentSlide += direction;

    // 循環滾動邏輯
    if (currentSlide > maxSlide) currentSlide = 0;
    if (currentSlide < 0) currentSlide = maxSlide;

    // 獲取第一張卡片的實際寬度(含外邊距)
    const cardWidth = cards[0].getBoundingClientRect().width + 30; 
    container.style.transform = `translateX(${-currentSlide * cardWidth}px)`;
}

// 自動輪播功能
function startAutoSlide() {
    autoSlideTimer = setInterval(() => {
        moveSlide(1);
    }, 4000); // 每 4 秒捲動一次
}

function resetAutoSlide() {
    clearInterval(autoSlideTimer);
    startAutoSlide();
}

// 監聽視窗大小改變，避免排版跑掉
window.addEventListener('resize', () => {
    currentSlide = 0;
    document.getElementById('featuredProducts').style.transform = `translateX(0)`;
});

        // ========== 簽到與點數邏輯 ==========
        function loadCheckInData() {
            const saved = localStorage.getItem(`checkIn_${currentUser.email}`);
            checkInData = saved ? JSON.parse(saved) : { lastCheckIn: null, streak: 0, points: 0, coupons: [], lastWheelDate: null };
            document.querySelectorAll('.points-val').forEach(el => el.textContent = checkInData.points);
        }
        function openCheckIn() {
            if (!currentUser) return openLogin();
            loadCheckInData(); renderCheckInGrid();
            document.getElementById('checkInModal').classList.add('active');
        }
        function closeCheckIn() { document.getElementById('checkInModal').classList.remove('active'); }
        function renderCheckInGrid() {
            const grid = document.getElementById('checkInGrid');
            const streak = checkInData.streak % 7 || (checkInData.streak > 0 ? 7 : 0);
            grid.innerHTML = Array.from({length:7}, (_, i) => `<div class="checkin-day ${i < streak ? 'completed' : ''}">D${i+1}<br>💰</div>`).join('');
            document.getElementById('checkInBtn').disabled = isTodayChecked();
        }
        function isTodayChecked() { return checkInData.lastCheckIn && new Date(checkInData.lastCheckIn).toDateString() === new Date().toDateString(); }
        function processCheckIn() {
            checkInData.streak++;
            checkInData.points += (checkInData.streak % 7 || 7) * 10;
            checkInData.lastCheckIn = new Date().toISOString();
            saveCheckInData(); showNotification('簽到成功'); renderCheckInGrid();
        }
        function saveCheckInData() {
            localStorage.setItem(`checkIn_${currentUser.email}`, JSON.stringify(checkInData));
            document.querySelectorAll('.points-val').forEach(el => el.textContent = checkInData.points);
        }

        // ========== 抽獎轉盤邏輯 ==========
        function renderWheel() {
            const wheel = document.getElementById('wheel');
            const numPrizes = prizes.length;
            const deg = 360 / numPrizes; 
            wheel.innerHTML = prizes.map((p, i) => {
                const rotateDeg = i * deg;
                return `
                    <div style="position: absolute; width: 50%; height: 50%; background: ${p.color}; transform-origin: 100% 100%; transform: rotate(${rotateDeg}deg) skewY(${90 - deg}deg); border: 1px solid rgba(255,255,255,0.3); left: 0; top: 0;"></div>
                    <div style="position: absolute; width: 100%; height: 100%; text-align: center; top: 0; left: 0; transform: rotate(${rotateDeg + deg/2}deg); padding-top: 35px; font-size: 13px; font-weight: bold; color: #333; pointer-events: none; z-index: 5;">${p.text}</div>
                `;
            }).join('');
        }

        function isWheelChecked() { 
            if (!checkInData.lastWheelDate) return false;
            return new Date(checkInData.lastWheelDate).toDateString() === new Date().toDateString(); 
        }
        
        function openLuckyWheel() {
            if (!currentUser) return openLogin();
            loadCheckInData();
            const btn = document.getElementById('spinBtn');
            const alreadySpun = isWheelChecked();
            btn.disabled = alreadySpun;
            btn.textContent = alreadySpun ? '今日抽獎已完成' : '立即抽獎';
            btn.style.opacity = alreadySpun ? '0.5' : '1';
            document.getElementById('wheelModal').classList.add('active');
        }

        function closeLuckyWheel() { document.getElementById('wheelModal').classList.remove('active'); }
        
        function spinWheel() {
            if (isWheelChecked()) return;
            const btn = document.getElementById('spinBtn');
            btn.disabled = true; 
            const randomIndex = Math.floor(Math.random() * prizes.length);
            const extraDeg = 360 * 5; 
            const degPerPrize = 360 / prizes.length;
            const targetDeg = extraDeg + (360 - (randomIndex * degPerPrize) - (degPerPrize / 2));
            const wheel = document.getElementById('wheel');
            
            wheel.style.transition = 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)';
            wheel.style.transform = `rotate(${targetDeg}deg)`;
            
            checkInData.lastWheelDate = new Date().toISOString();
            saveCheckInData();

            setTimeout(() => {
                const prize = prizes[randomIndex];
                if (prize.type !== 'none') {
                    checkInData.coupons.push(prize); 
                    showNotification(`🎉 恭喜！抽中獎項：【${prize.text}】，已存入個人優惠券。`, 'success');
                } else {
                    showNotification(`哎呀！本次結果為：【${prize.text}】`, 'error');
                }
                saveCheckInData();
                btn.textContent = '今日抽獎已完成';
                btn.style.opacity = '0.5';
                const finalDeg = targetDeg % 360;
                wheel.style.transition = 'none';
                wheel.style.transform = `rotate(${finalDeg}deg)`;
            }, 4000);
        }

        // ========== 商品與購物車邏輯 ==========
        function generateProducts() {
    let id = 1;
    categories.forEach(cat => {
        for (let i = 1; i <= 6; i++) {
            // 定義圖片路徑：假設您的圖片命名為 分類+數字.jpg (例如: 帽子1.jpg)
            // 如果您還沒準備好圖片，這裡可以先放您的檔名
            let imgPath = `${cat}${i}.jpg`; 
            console.log(imgPath);

            products.push({ 
                id: id++, 
                name: `${cat} 單品 #${i}`, 
                category: cat, 
                price: Math.floor(Math.random() * 1500) + 300, 
                isFeatured: i === 1,
                image: imgPath // 新增圖片屬性
            });
        }
    });
    filteredProducts = [...products];
}
        function openCart() { displayCart(); document.getElementById('cartModal').classList.add('active'); }
        function closeCart() { document.getElementById('cartModal').classList.remove('active'); }
        
        function getCartFinalTotal() {
            const subtotal = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
            let bestPrice = subtotal;
            if (currentUser && checkInData.coupons.length > 0) {
                checkInData.coupons.forEach(coupon => {
                    let currentPrice = subtotal;
                    if (coupon.type === 'percent') currentPrice = Math.floor(subtotal * coupon.value);
                    else if (coupon.type === 'cash') currentPrice = Math.max(0, subtotal - coupon.value);
                    if (currentPrice < bestPrice) bestPrice = currentPrice;
                });
            }
            return bestPrice;
        }

        function displayCart() {
            const container = document.getElementById('cartItems');
            const subtotal = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
            let bestPrice = subtotal;
            let appliedCoupon = null;

            if (currentUser && checkInData.coupons.length > 0) {
                checkInData.coupons.forEach(coupon => {
                    let currentPrice = subtotal;
                    if (coupon.type === 'percent') {
                        currentPrice = Math.floor(subtotal * coupon.value);
                    } else if (coupon.type === 'cash') {
                        currentPrice = Math.max(0, subtotal - coupon.value);
                    }
                    if (currentPrice < bestPrice) {
                        bestPrice = currentPrice;
                        appliedCoupon = coupon;
                    }
                });
            }
            container.innerHTML = cart.length ? cart.map(item => `<div style="display:flex; justify-content:space-between; margin-bottom:5px"><span>${item.name} x ${item.quantity}</span><span>$${item.price * item.quantity}</span></div>`).join('') : '購物車空空的';
            const discInfo = document.getElementById('discountInfo');
            if (appliedCoupon) {
                discInfo.textContent = `✨ 已自動套用最佳優惠：${appliedCoupon.text}`;
                document.getElementById('cartTotal').innerHTML = `<del style="color:#999; font-size:14px; margin-right:10px">$${subtotal}</del> $${bestPrice}`;
            } else {
                discInfo.textContent = '';
                document.getElementById('cartTotal').textContent = `$${subtotal}`;
            }
        }

       window.checkoutProcess = function() {
    // 檢查購物車是否為空
    if (cart.length === 0) return showNotification('購物車是空的', 'error');

    // 1. 獲取所有輸入欄位的值，並使用 .trim() 去除使用者可能誤打的空白
    const name = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const a1 = document.getElementById('addr1').value.trim();
    const a2 = document.getElementById('addr2').value.trim();
    const a3 = document.getElementById('addr3').value.trim();
    const a4 = document.getElementById('addr4').value.trim();
    const payment = document.getElementById('paymentMethod').value;

    // 2. 嚴格必填檢查：若姓名、電話或地址（四格任一）為空，則中斷下單流程
    if (!name || !phone || !a1 || !a2 || !a3 || !a4) {
        return showNotification('收件人姓名、電話及到貨地址（共四格）皆為必填項目！', 'error');
    }

    // 3. 處理點數與優惠券計算邏輯 (保留您原有的最佳優惠計算)
    let usePoints = validatePointsInput();
    const pointsDiscount = Math.floor(usePoints / 100);
    const actualUsedPoints = pointsDiscount * 100;

    const subtotal = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
    const selector = document.getElementById('couponSelector');
    const selectedIndex = parseInt(selector.value);
    
    let currentPrice = subtotal;
    let usedCouponText = "無";

    // 尋找最佳優惠券並執行扣除與移除邏輯
    if (selectedIndex !== -1 && checkInData.coupons[selectedIndex]) {
        const coupon = checkInData.coupons[selectedIndex];
        usedCouponText = coupon.text;
        if (coupon.type === 'percent') {
            currentPrice = Math.floor(subtotal * coupon.value);
        } else if (coupon.type === 'cash') {
            currentPrice = Math.max(0, subtotal - coupon.value);
        }
        // 關鍵修改：結帳後將優惠券從使用者的資料中移除
        checkInData.coupons.splice(selectedIndex, 1);
    }

    // 計算最終應付總計 (優惠券後金額 - 點數折抵)
    const finalPrice = Math.max(0, currentPrice - pointsDiscount);

    // 4. 正式更新資料庫與存檔
    checkInData.points -= actualUsedPoints; // 扣除實際使用的點數
    saveCheckInData(); // 儲存點數與優惠券變動

    // 更新會員累計消費紀錄
    currentUser.totalSpent = (currentUser.totalSpent || 0) + finalPrice;
    localStorage.setItem(`user_${currentUser.email}`, JSON.stringify(currentUser));
    updateMemberRank();

    // 5. 生成並顯示訂單彙整清單 (地址格式依照要求：(國家) (縣市) (區域) (街道門牌))
    const orderItemsHTML = cart.map(item => `<li>${item.name} x ${item.quantity} ($${item.price * item.quantity})</li>`).join('');
    const fullAddress = `(${a1}) (${a2}) (${a3}) (${a4})`;
    
    // 創建訂單物件
    const order = {
        orderId: Date.now(), // 使用時間戳作為訂單 ID
        orderDate: new Date().toISOString(),
        items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        recipient: {
            name: name,
            phone: phone,
            address: fullAddress
        },
        payment: payment,
        subtotal: subtotal,
        coupon: usedCouponText,
        pointsUsed: actualUsedPoints,
        pointsDiscount: pointsDiscount,
        finalPrice: finalPrice
    };

    // 儲存訂單到該會員的訂單歷史
    let userOrders = JSON.parse(localStorage.getItem(`orders_${currentUser.email}`) || '[]');
    userOrders.push(order);
    localStorage.setItem(`orders_${currentUser.email}`, JSON.stringify(userOrders));
    
    document.getElementById('orderDetailContent').innerHTML = `
        <p><strong>收件人：</strong> ${name}</p>
        <p><strong>聯絡電話：</strong> ${phone}</p>
        <p><strong>到貨地址：</strong> ${fullAddress}</p>
        <p><strong>付款方式：</strong> ${payment}</p>
        <hr>
        <p><strong>購買清單：</strong></p>
        <ul style="padding-left: 20px; font-size: 14px;">${orderItemsHTML}</ul>
        <hr>
        <p>原始總金額：$${subtotal}</p>
        <p>套用優惠券：${usedCouponText}</p>
        <p>點數折抵：-$${pointsDiscount} (消耗 ${actualUsedPoints} 點)</p>
        <p style="font-size: 1.2em; color: #e74c3c;"><strong>最後支付總計：$${finalPrice}</strong></p>
    `;

    // 6. 成功結帳後：清空購物車與所有輸入欄位資訊 (確保不予保留)
    cart = [];
    saveCart();
    
    // 清空所有 input 欄位與選擇器
    ['orderName', 'orderPhone', 'addr1', 'addr2', 'addr3', 'addr4', 'usePointsAmount'].forEach(id => {
        document.getElementById(id).value = "";
    });
    selector.value = "-1";
    document.getElementById('paymentMethod').value = "現金付款";
    
    // 關閉結帳視窗、顯示成功訂單彈窗並通知
    closeCart();
    document.getElementById('orderSuccessModal').classList.add('active');
    showNotification('結帳成功，訂單已建立！', 'success');
};

        function addToCart(id) {
            if (!currentUser) return openLogin();
            const p = products.find(x => x.id === id);
            const item = cart.find(x => x.id === id);
            if (item) item.quantity++; else cart.push({ ...p, quantity: 1 });
            saveCart(); showNotification('已加入購物車');
        }
function saveCart() { 
            if (currentUser) {
                localStorage.setItem(`cart_${currentUser.email}`, JSON.stringify(cart)); 
            } else {
                localStorage.removeItem('cart'); // 未登入則清空通用暫存
            }
            document.getElementById('cartCount').textContent = cart.reduce((a, b) => a + b.quantity, 0); 
        }
// 修改：載入該帳號專屬的購物車
        function loadCart() { 
            if (currentUser) {
                const s = localStorage.getItem(`cart_${currentUser.email}`); 
                cart = s ? JSON.parse(s) : []; 
            } else {
                cart = []; 
            }
            document.getElementById('cartCount').textContent = cart.reduce((a, b) => a + b.quantity, 0);
        }

        function displayFeaturedProducts() {
        const featuredContainer = document.getElementById('featuredProducts');
        const featuredItems = products.filter(p => p.isFeatured).slice(0, 8); 
    
        featuredContainer.innerHTML = featuredItems.map(p => `
        <div class="product-card">
            <div class="product-image" style="background: white;">
                <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>$${p.price}</p>
                <button class="add-to-cart-btn" onclick="addToCart(${p.id})">加入購物車</button>
            </div>
        </div>`).join('');
    
        resetAutoSlide(); 
        }
        function displayCategories() {
            document.getElementById('categoryGrid').innerHTML = categories.map((cat, i) => `<div class="category-card" onclick="filterByCategory('${cat}')"><h1>${categoryIcons[i]}</h1><p>${cat}</p></div>`).join('');
        }
        function renderFilterCheckboxes() {
            document.getElementById('filterCategoryContainer').innerHTML = categories.map(cat => `<div class="filter-option"><input type="checkbox" class="cat-check" id="cat-${cat}" onchange="filterProducts()"><label>${cat}</label></div>`).join('');
        }
        function displayProducts() {
    document.getElementById('productsGrid').innerHTML = filteredProducts.map(p => `
        <div class="product-card">
            <div class="product-image" style="background: white;">
                <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>$${p.price}</p>
                <button class="add-to-cart-btn" onclick="addToCart(${p.id})">加入購物車</button>
            </div>
        </div>`).join('');
}
        function filterProducts() {
            // 獲取所有過濾條件的值
            const max = document.getElementById('priceRange').value;
            const searchTerm = document.getElementById('searchInput').value.toLowerCase(); // 關鍵字
            const checkedCategories = Array.from(document.querySelectorAll('.cat-check:checked'))
                                           .map(el => el.id.replace('cat-', ''));
            
            document.getElementById('priceValue').textContent = max;

            // 執行複合過濾
            filteredProducts = products.filter(p => {
                const matchesPrice = p.price <= max;
                const matchesCategory = checkedCategories.length === 0 || checkedCategories.includes(p.category);
                const matchesSearch = p.name.toLowerCase().includes(searchTerm); // 關鍵字過濾
                
                return matchesPrice && matchesCategory && matchesSearch;
            });

            displayProducts();
        }
        function filterByCategory(cat) { goToShop(); document.querySelectorAll('.cat-check').forEach(el => el.checked = el.id === `cat-${cat}`); filterProducts(); }
        function openLogin() { document.getElementById('loginModal').classList.add('active'); toggleAuthForm('login'); }
        function closeLogin() { document.getElementById('loginModal').classList.remove('active'); }
        function showNotification(msg, type = 'success') {
            const d = document.createElement('div'); d.className = `notification ${type}`; d.textContent = msg;
            document.body.appendChild(d); setTimeout(() => d.remove(), 2500);
        }

        window.onclick = e => { 
            if (e.target.classList.contains('modal-overlay')) { 
                closeCart(); closeLogin(); closeCheckIn(); closeLuckyWheel(); 
                closeModal('userInfoModal'); closeModal('couponsModal'); closeModal('sizeModal'); closeModal('contactModal');
            } 
            if (!e.target.closest('.user-dropdown')) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown && dropdown.classList.contains('show')) dropdown.classList.remove('show');
            }
        };

        init();

    /* 1. 自動掛載：在不改動原導航欄 HTML 下，自動插入按鈕 */
    (function injectGameButton() {
        window.addEventListener('load', () => {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && !document.getElementById('extraGameLink')) {
                const gameLink = document.createElement('a');
                gameLink.href = "#";
                gameLink.innerHTML = "🎮 小遊戲";
                gameLink.id = "extraGameLink";
                gameLink.onclick = function(e) {
                    e.preventDefault();
                    switchToGamePage();
                };
                // 找到「每日一抽」按鈕，插入到它的後面
                const luckyWheelLink = navLinks.querySelector('a[onclick*="openLuckyWheel"]');
                if (luckyWheelLink && luckyWheelLink.nextSibling) {
                    navLinks.insertBefore(gameLink, luckyWheelLink.nextSibling);
                } else if (luckyWheelLink) {
                    navLinks.appendChild(gameLink);
                } else {
                    // 如果找不到「每日一抽」，則插入到最後
                    navLinks.appendChild(gameLink);
                }
            }
        });
    })();

    /* 2. 頁面切換：隱藏原有的，顯示遊戲的 */
/* 修改：遊戲頁面切換邏輯 */
        function switchToGamePage() {
            // 隱藏所有其他頁面
            document.getElementById('homePage').style.display = 'none';
            document.getElementById('shopPage').style.display = 'none';
            document.getElementById('resalePage').style.display = 'none';
            document.getElementById('resaleMarketPage').style.display = 'none';
            
            // 顯示遊戲頁
            document.getElementById('miniGamePage').style.display = 'block';
            initGamePlaceholder();
            window.scrollTo(0,0);
        }

        /* 修改：從遊戲返回首頁 */
        function backToMainFromGame() {
            goToHome(); // 直接呼叫整合後的 goToHome
        }

    /* 3. 記憶遊戲邏輯 */
    const fashionIcons = ['👗', '👕', '👖', '🧥', '👠', '🎩', '🧤', '👜'];
    let gameCardsData = [];
    let flippedIndices = [];
    let solvedPairs = 0;
    let isLocking = false;

    function initGamePlaceholder() {
        document.getElementById('gameGridBox').innerHTML = '<p style="grid-column: span 4; color:#999; padding:20px;">點擊下方按鈕開始</p>';
        document.getElementById('gameActionBtn').style.display = 'block';
    }

    /* 1. 自動掛載：在導航欄自動插入「小遊戲」按鈕 */
    (function injectGameButton() {
        window.addEventListener('load', () => {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && !document.getElementById('extraGameLink')) {
                const gameLink = document.createElement('a');
                gameLink.href = "#";
                gameLink.innerHTML = "🎮 小遊戲";
                gameLink.id = "extraGameLink";
                gameLink.onclick = function(e) {
                    e.preventDefault();
                    switchToGamePage(); // 呼叫切換至遊戲頁面的函式
                };
                // 找到「每日一抽」按鈕，插入到它的後面
                const luckyWheelLink = navLinks.querySelector('a[onclick*="openLuckyWheel"]');
                if (luckyWheelLink && luckyWheelLink.nextSibling) {
                    navLinks.insertBefore(gameLink, luckyWheelLink.nextSibling);
                } else if (luckyWheelLink) {
                    navLinks.appendChild(gameLink);
                } else {
                    // 如果找不到「每日一抽」，則插入到最後
                    navLinks.appendChild(gameLink);
                }
            }
        });
    })();

    function checkGameMatchResult() {
    const [card1, card2] = flippedIndices;
    const el1 = document.getElementById(`card-unit-${card1.idx}`);
    const el2 = document.getElementById(`card-unit-${card2.idx}`);

    if (card1.icon === card2.icon) {
        // 配對成功
        el1.classList.add('matched');
        el2.classList.add('matched');
        solvedPairs++;
        if (solvedPairs === fashionIcons.length) {
            // 遊戲完成獎勵邏輯
            checkInData.points += 100;
            checkInData.lastGameDate = new Date().toDateString();
            saveCheckInData();
            showNotification('🎉 恭喜完成！獲得 100 點數！', 'success');
            document.getElementById('gameActionBtn').style.display = 'block';
            document.getElementById('gameActionBtn').textContent = '已完成挑戰';
        }
    } else {
        // 配對失敗，翻回去
        el1.classList.remove('flipped');
        el2.classList.remove('flipped');
    }
    
    flippedIndices = [];
    isLocking = false;
}

    function runMemoryGameStart() {
        if (!currentUser) {
            showNotification('請先登入才能獲得獎勵', 'error');
            openLogin(); // 呼叫您原本的登入框
            return;
        }

        // 檢查是否今天玩過 (共用您的 checkInData)
        const todayStr = new Date().toDateString();
        if (checkInData.lastGameDate === todayStr) {
            showNotification('今日挑戰已領過獎勵囉！', 'error');
            return;
        }

        document.getElementById('gameActionBtn').style.display = 'none';
        gameCardsData = [...fashionIcons, ...fashionIcons].sort(() => Math.random() - 0.5);
        flippedIndices = [];
        solvedPairs = 0;
        isLocking = false;
        
        const grid = document.getElementById('gameGridBox');
        grid.innerHTML = gameCardsData.map((icon, idx) => `
            <div class="memory-card-unit" id="card-unit-${idx}" onclick="handleCardClick(${idx})">${icon}</div>
        `).join('');
    }

    function handleCardClick(idx) {
        const card = document.getElementById(`card-unit-${idx}`);
        if (isLocking || flippedIndices.length === 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;

        card.classList.add('flipped');
        flippedIndices.push({ idx, icon: gameCardsData[idx] });

        if (flippedIndices.length === 2) {
            isLocking = true;
            setTimeout(checkGameMatchResult, 700);
        }
    }
    

// 1. 顯示購物車內容
window.displayCart = function() {
    const container = document.getElementById('cartItems');
    const selector = document.getElementById('couponSelector');
    const pointsInput = document.getElementById('usePointsAmount');
    const subtotal = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
    
    // 更新點數顯示
    document.querySelectorAll('.points-val').forEach(el => el.textContent = checkInData.points);

    // 更新優惠券選單
    const savedCouponIndex = selector.value;
    selector.innerHTML = '<option value="-1">不使用優惠券</option>' + 
        checkInData.coupons.map((c, i) => `<option value="${i}" ${savedCouponIndex == i ? 'selected' : ''}>${c.text}</option>`).join('');

    let tempPrice = subtotal;
    let appliedCoupon = null;
    const selectedIndex = parseInt(selector.value);

    // 計算優惠券折扣
    if (selectedIndex !== -1 && checkInData.coupons[selectedIndex]) {
        appliedCoupon = checkInData.coupons[selectedIndex];
        if (appliedCoupon.type === 'percent') tempPrice = Math.floor(subtotal * appliedCoupon.value);
        else if (appliedCoupon.type === 'cash') tempPrice = Math.max(0, subtotal - appliedCoupon.value);
    }

    // 計算點數折扣 (強制 100 倍數且不超過持有上限)
    let usePoints = validatePointsInput();
    let pointsDiscount = Math.floor(usePoints / 100);

    // 點數不能折到變負數
    if (pointsDiscount > tempPrice) {
        pointsDiscount = tempPrice;
        usePoints = pointsDiscount * 100;
        pointsInput.value = usePoints;
    }
    
    const finalPrice = Math.max(0, tempPrice - pointsDiscount);

    // 渲染商品清單 (新增：數量加減按鈕)
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">購物車是空的</p>';
    } else {
        container.innerHTML = cart.map((item, index) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid #eee">
                <div style="flex:1">
                    <div style="font-weight:bold">${item.name}</div>
                    <div style="font-size:12px; color:#666">$${item.price} x ${item.quantity}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin-right:15px">
                    <button onclick="updateCartQuantity(${index}, -1)" style="width:24px; height:24px; cursor:pointer; border:1px solid #ddd; background:#fff;">-</button>
                    <span style="font-weight:bold; min-width:20px; text-align:center;">${item.quantity}</span>
                    <button onclick="updateCartQuantity(${index}, 1)" style="width:24px; height:24px; cursor:pointer; border:1px solid #ddd; background:#fff;">+</button>
                </div>
                <div style="font-weight:bold; margin-right:10px">$${item.price * item.quantity}</div>
                <button onclick="removeCartItem(${index})" style="background:#ff4757; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px">刪除</button>
            </div>`).join('');
    }

    // 顯示折扣與總計
    const discInfo = document.getElementById('discountInfo');
    discInfo.innerHTML = (appliedCoupon || pointsDiscount > 0) ? 
        `✨ 優惠券：${appliedCoupon ? appliedCoupon.text : '無'}<br>💰 點數折抵：-$${pointsDiscount}` : '';

    const totalEl = document.getElementById('cartTotal');
    totalEl.innerHTML = (appliedCoupon || pointsDiscount > 0) ? 
        `<del style="color:#999; font-size:14px; margin-right:10px">$${subtotal}</del> $${finalPrice}` : `$${subtotal}`;
};
// 2. 處理數量增減邏輯 (新增)
window.updateCartQuantity = function(index, change) {
    const item = cart[index];
    const newQty = item.quantity + change;
    if (newQty <= 0) {
        removeCartItem(index);
    } else {
        item.quantity = newQty;
        saveCart();
        displayCart();
    }
};

// 3. 處理刪除商品
window.removeCartItem = function(index) {
    cart.splice(index, 1);
    saveCart();
    displayCart();
    showNotification('商品已從購物車移除', 'success');
};

// 4. 點數輸入驗證 (100倍數 & 不超過餘額)
window.validatePointsInput = function() {
    const pointsInput = document.getElementById('usePointsAmount');
    if (!pointsInput) return 0;
    let val = parseInt(pointsInput.value) || 0;
    if (val < 0) val = 0;
    if (val > checkInData.points) {
        showNotification(`輸入點數超過持有上限！您目前僅有 ${checkInData.points} 點`, 'error');
        val = Math.floor(checkInData.points / 100) * 100;
        pointsInput.value = val;
    }
    return Math.floor(val / 100) * 100;
};


// 1. 新增：防呆驗證函式 (這是解決打不開的關鍵)
// 補回：全部折抵按鈕的功能函式
        window.useMaxPoints = function() {
            const pointsInput = document.getElementById('usePointsAmount');
            if (!pointsInput) return;

            // 計算邏輯：取持有點數與當前購物車剩餘金額的最小值，並自動向下取 100 的倍數
            // 這樣按下去就不會發生輸入超過持有點數或超過商品總價的情況
            const maxAvailable = Math.floor(checkInData.points / 100) * 100;
            
            if (maxAvailable <= 0) {
                showNotification('目前點數不足 100 點，無法折抵', 'error');
                pointsInput.value = 0;
            } else {
                pointsInput.value = maxAvailable;
                showNotification(`已自動填入最大可用點數：${maxAvailable} 點`, 'success');
            }

            // 填入後手動觸發 displayCart() 更新總計金額顯示
            displayCart();
        };

window.validatePointsInput = function() {
    const pointsInput = document.getElementById('usePointsAmount');
    if (!pointsInput) return 0;
    
    let val = parseInt(pointsInput.value);
    if (isNaN(val) || val < 0) return 0;

    // 1. 核心修正：檢查輸入是否超過使用者擁有的點數上限
    if (val > checkInData.points) {
        showNotification(`輸入點數超過持有上限！您目前僅有 ${checkInData.points} 點`, 'error');
        // 自動修正為使用者目前能用的最大 100 倍數點數
        val = Math.floor(checkInData.points / 100) * 100;
        pointsInput.value = val; // 將輸入框數值強制修正回上限
    }
    
    // 2. 確保返回結帳邏輯的是 100 的倍數
    const finalValidPoints = Math.floor(val / 100) * 100;
    
    return finalValidPoints;
};

    // 新增：處理移除商品的函式
    window.removeCartItem = function(index) {
        // 從全域變數 cart 陣列中移除該索引的商品
        cart.splice(index, 1);
        
        // 呼叫您原本定義的 saveCart() 來儲存 LocalStorage 並更新右上角數字
        saveCart(); 
        
        // 重新執行 displayCart() 更新彈出視窗內的內容
        displayCart(); 
        
        // 呼叫您原本的 showNotification()
        showNotification('商品已從購物車移除', 'success');
    };

    // ========== 鼠標軌跡效果 ==========
    let trailCount = 0;
    const maxTrails = 15; // 最多同時顯示的軌跡數量

    document.addEventListener('mousemove', function(e) {
        // 限制軌跡數量，避免性能問題
        if (trailCount >= maxTrails) return;

        // 創建軌跡元素
        const trail = document.createElement('div');
        trail.className = 'mouse-trail';
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        
        // 隨機大小變化，讓軌跡更自然
        const size = Math.random() * 10 + 15;
        trail.style.width = size + 'px';
        trail.style.height = size + 'px';
        
        document.body.appendChild(trail);
        trailCount++;

        // 動畫結束後移除元素
        setTimeout(() => {
            trail.remove();
            trailCount--;
        }, 600);
    });

