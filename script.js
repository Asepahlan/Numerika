document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const methodRadios = document.querySelectorAll('input[name="method"]');
    const pointInputsContainer = document.getElementById('point-inputs');
    const addPointBtn = document.getElementById('add-point-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const targetXInput = document.getElementById('target-x');
    const resultsContainer = document.getElementById('results');
    const polynomialEquation = document.getElementById('polynomial-equation');
    const estimatedValue = document.getElementById('estimated-value');
    const chartCanvas = document.getElementById('interpolation-chart');
    
    let chart = null;
    let pointCounter = 1;
    
    // Inisialisasi
    initializePointInputs();
    updateUIForMethod();
    
    // Event listeners
    methodRadios.forEach(radio => {
        radio.addEventListener('change', updateUIForMethod);
    });
    
    addPointBtn.addEventListener('click', addPointInput);
    calculateBtn.addEventListener('click', calculateInterpolation);
    resetBtn.addEventListener('click', resetCalculator);
    
    // Fungsi untuk inisialisasi input titik
    function initializePointInputs() {
        // Untuk kuadratik, buat 3 titik default
        for (let i = 0; i < 3; i++) {
            addPointInput();
        }
    }
    
    // Fungsi untuk menambahkan input titik baru
    function addPointInput() {
        const pointId = pointCounter++;
        const pointRow = document.createElement('div');
        pointRow.className = 'point-input-row';
        
        pointRow.innerHTML = `
            <span class="point-label">P${pointId}</span>
            <input type="number" class="x-input" placeholder="x${pointId}" step="any">
            <input type="number" class="y-input" placeholder="y${pointId}" step="any">
            <button class="remove-btn" title="Hapus titik">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        pointInputsContainer.appendChild(pointRow);
        
        // Tambahkan event listener untuk tombol hapus
        const removeBtn = pointRow.querySelector('.remove-btn');
        removeBtn.addEventListener('click', function() {
            if (canRemovePoint()) {
                pointRow.remove();
                updateRemoveButtons();
            } else {
                showErrorToast('Jumlah titik minimum tidak boleh dihapus');
            }
        });
        
        updateRemoveButtons();
    }
    
    // Fungsi untuk memeriksa apakah titik bisa dihapus
    function canRemovePoint() {
        const pointInputs = document.querySelectorAll('.point-input-row');
        const minPoints = getSelectedMethod() === 'quadratic' ? 3 : 2;
        return pointInputs.length > minPoints;
    }
    
    // Fungsi untuk mengupdate tombol hapus
    function updateRemoveButtons() {
        const pointInputs = document.querySelectorAll('.point-input-row');
        const removeBtns = document.querySelectorAll('.remove-btn');
        const minPoints = getSelectedMethod() === 'quadratic' ? 3 : 2;
        
        removeBtns.forEach(btn => {
            btn.disabled = pointInputs.length <= minPoints;
        });
    }
    
    // Fungsi untuk mengupdate UI berdasarkan metode yang dipilih
    function updateUIForMethod() {
        const method = getSelectedMethod();
        const currentPoints = document.querySelectorAll('.point-input-row').length;
        const minPoints = method === 'quadratic' ? 3 : 2;
        
        // Reset atau tambah titik jika perlu
        if (currentPoints < minPoints) {
            // Tambah titik yang kurang
            for (let i = currentPoints; i < minPoints; i++) {
                addPointInput();
            }
        } else if (method === 'quadratic' && currentPoints > 3) {
            // Hapus titik tambahan untuk kuadratik
            while (document.querySelectorAll('.point-input-row').length > 3) {
                const lastRow = pointInputsContainer.lastChild;
                if (lastRow) lastRow.remove();
            }
        }
        
        // Update tombol tambah titik
        addPointBtn.style.display = method === 'lagrange' ? 'flex' : 'none';
        
        // Update tombol hapus
        updateRemoveButtons();
    }
    
    // Fungsi untuk mendapatkan metode yang dipilih
    function getSelectedMethod() {
        return document.querySelector('input[name="method"]:checked').value;
    }
    
    // Fungsi untuk menghitung interpolasi
    function calculateInterpolation() {
        // Validasi input
        if (!validateInputs()) return;
        
        const method = getSelectedMethod();
        const points = getPointsFromInputs();
        const targetX = parseFloat(targetXInput.value);
        
        // Sembunyikan hasil sebelumnya
        resultsContainer.classList.add('hidden');
        
        try {
            if (method === 'quadratic') {
                calculateQuadraticInterpolation(points, targetX);
            } else {
                calculateLagrangeInterpolation(points, targetX);
            }
            
            // Tampilkan hasil
            resultsContainer.classList.remove('hidden');
            
            // Scroll ke hasil
            setTimeout(() => {
                resultsContainer.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
        } catch (error) {
            showErrorToast('Terjadi kesalahan dalam perhitungan: ' + error.message);
        }
    }
    
    // Fungsi untuk validasi input
    function validateInputs() {
        const points = getPointsFromInputs();
        
        // Cek semua input terisi
        for (const point of points) {
            if (isNaN(point.x) || isNaN(point.y)) {
                showErrorToast('Harap isi semua nilai x dan y!');
                return false;
            }
        }
        
        // Cek nilai x unik
        const xValues = points.map(p => p.x);
        const uniqueXValues = [...new Set(xValues)];
        if (xValues.length !== uniqueXValues.length) {
            showErrorToast('Nilai x harus unik (tidak boleh duplikat)!');
            return false;
        }
        
        // Cek jumlah titik untuk kuadratik
        if (getSelectedMethod() === 'quadratic' && points.length !== 3) {
            showErrorToast('Interpolasi Kuadratik membutuhkan tepat 3 titik data!');
            return false;
        }
        
        // Cek jumlah titik untuk Lagrange
        if (getSelectedMethod() === 'lagrange' && points.length < 2) {
            showErrorToast('Interpolasi Lagrange membutuhkan minimal 2 titik data!');
            return false;
        }
        
        // Cek target x terisi
        if (isNaN(parseFloat(targetXInput.value))) {
            showErrorToast('Harap masukkan nilai x yang ingin diestimasi!');
            return false;
        }
        
        return true;
    }
    
    // Fungsi untuk menampilkan pesan error
    function showErrorToast(message) {
        // Implementasi toast notification sederhana
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }
    
    // Fungsi untuk mendapatkan titik-titik dari input
    function getPointsFromInputs() {
        const pointInputs = document.querySelectorAll('.point-input-row');
        const points = [];
        
        pointInputs.forEach((input, index) => {
            const xInput = input.querySelector('.x-input');
            const yInput = input.querySelector('.y-input');
            
            points.push({
                x: parseFloat(xInput.value),
                y: parseFloat(yInput.value),
                id: index + 1
            });
        });
        
        // Urutkan berdasarkan x
        points.sort((a, b) => a.x - b.x);
        
        return points;
    }
    
    // Fungsi untuk menghitung interpolasi kuadratik
    function calculateQuadraticInterpolation(points, targetX) {
        const [x0, x1, x2] = points.map(p => p.x);
        const [y0, y1, y2] = points.map(p => p.y);
        
        // Hitung koefisien polinomial kuadratik
        const a0 = y0;
        const a1 = (y1 - y0) / (x1 - x0);
        const a2 = ((y2 - y1) / (x2 - x1) - a1) / (x2 - x0);
        
        // Bentuk persamaan polinomial
        const equation = `
            <p>Bentuk umum:</p>
            <p class="math-equation">P(x) = a₀ + a₁(x - x₀) + a₂(x - x₀)(x - x₁)</p>
            <p>Dengan nilai koefisien:</p>
            <ul class="coefficient-list">
                <li>a₀ = ${a0.toFixed(6)}</li>
                <li>a₁ = ${a1.toFixed(6)}</li>
                <li>a₂ = ${a2.toFixed(6)}</li>
            </ul>
            <p>Persamaan hasil interpolasi:</p>
            <p class="math-equation">
                P(x) = ${a0.toFixed(4)} + ${a1.toFixed(4)}(x - ${x0}) + ${a2.toFixed(4)}(x - ${x0})(x - ${x1})
            </p>
        `;
        polynomialEquation.innerHTML = equation;
        
        // Hitung nilai estimasi
        const estimatedY = a0 + a1 * (targetX - x0) + a2 * (targetX - x0) * (targetX - x1);
        estimatedValue.innerHTML = `
            <p>Untuk x = ${targetX}</p>
            <div class="estimated-result">${estimatedY.toFixed(6)}</div>
        `;
        
        // Gambar grafik
        drawChart(points, targetX, estimatedY, (x) => {
            return a0 + a1 * (x - x0) + a2 * (x - x0) * (x - x1);
        });
    }
    
    // Fungsi untuk menghitung interpolasi Lagrange
    function calculateLagrangeInterpolation(points, targetX) {
        // Hitung nilai interpolasi
        const estimatedY = lagrange(points, targetX);
        
        // Dapatkan persamaan polinomial
        polynomialEquation.innerHTML = getLagrangePolynomialHTML(points);
        
        // Tampilkan nilai estimasi
        estimatedValue.innerHTML = `
            <p>Untuk x = ${targetX}</p>
            <div class="estimated-result">${estimatedY.toFixed(6)}</div>
        `;
        
        // Gambar grafik
        drawChart(points, targetX, estimatedY, (x) => lagrange(points, x));
    }
    
    // Fungsi interpolasi Lagrange
    function lagrange(points, targetX) {
        let result = 0;
        const n = points.length;
        
        for (let i = 0; i < n; i++) {
            let term = points[i].y;
            
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    term *= (targetX - points[j].x) / (points[i].x - points[j].x);
                }
            }
            
            result += term;
        }
        
        return result;
    }
    
    // Fungsi untuk mendapatkan representasi HTML persamaan Lagrange
    function getLagrangePolynomialHTML(points) {
        const n = points.length;
        let equationHTML = `
            <p>Bentuk umum interpolasi Lagrange:</p>
            <p class="math-equation">
                P(x) = Σ [yᵢ · Lᵢ(x)] untuk i = 0 sampai ${n-1}
            </p>
            <p>Dimana:</p>
            <p class="math-equation">
                Lᵢ(x) = Π (x - xⱼ)/(xᵢ - xⱼ) untuk j ≠ i
            </p>
            <hr>
            <p>Persamaan lengkap untuk data Anda:</p>
        `;
        
        // Tambahkan persamaan untuk setiap Lᵢ(x)
        for (let i = 0; i < n; i++) {
            equationHTML += `<div class="lagrange-term">`;
            equationHTML += `<p><strong>L${i}(x):</strong></p>`;
            
            let numerator = '';
            let denominator = '';
            
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    if (numerator) numerator += ' × ';
                    numerator += `(x - ${points[j].x.toFixed(2)})`;
                    
                    if (denominator) denominator += ' × ';
                    denominator += `(${points[i].x.toFixed(2)} - ${points[j].x.toFixed(2)})`;
                }
            }
            
            equationHTML += `
                <p class="math-equation">
                    L${i}(x) = ${numerator || '1'} / ${denominator || '1'}
                </p>
            `;
            
            equationHTML += `</div>`;
        }
        
        return equationHTML;
    }
    
    // Fungsi untuk menggambar grafik
    function drawChart(points, targetX, targetY, interpolationFunction) {
        // Siapkan data
        const xValues = points.map(p => p.x);
        const yValues = points.map(p => p.y);
        
        // Cari range untuk grafik
        const minX = Math.min(...xValues, targetX);
        const maxX = Math.max(...xValues, targetX);
        const rangeX = maxX - minX;
        
        // Buat titik-titik untuk kurva
        const step = rangeX / 100;
        const curveX = [];
        const curveY = [];
        
        for (let x = minX - 0.2 * rangeX; x <= maxX + 0.2 * rangeX; x += step) {
            curveX.push(x);
            curveY.push(interpolationFunction(x));
        }
        
        // Hancurkan chart sebelumnya jika ada
        if (chart) {
            chart.destroy();
        }
        
        // Buat chart baru
        const ctx = chartCanvas.getContext('2d');
        chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Titik Data',
                        data: points.map(p => ({x: p.x, y: p.y})),
                        backgroundColor: 'rgba(239, 35, 60, 0.8)',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        borderColor: 'rgba(239, 35, 60, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Kurva Interpolasi',
                        data: curveX.map((x, i) => ({x, y: curveY[i]})),
                        backgroundColor: 'rgba(67, 97, 238, 0.2)',
                        borderColor: 'rgba(67, 97, 238, 1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        type: 'line',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Estimasi',
                        data: [{x: targetX, y: targetY}],
                        backgroundColor: 'rgba(76, 201, 240, 1)',
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        borderColor: 'rgba(76, 201, 240, 0.8)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'center',
                        title: {
                            display: true,
                            text: 'Nilai x',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Nilai y',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        cubicInterpolationMode: 'monotone'
                    }
                }
            }
        });
    }
    
    // Fungsi untuk mereset kalkulator
    function resetCalculator() {
        // Reset input
        const inputs = document.querySelectorAll('.point-input-row input, #target-x');
        inputs.forEach(input => input.value = '');
        
        // Reset metode ke default
        document.getElementById('quadratic').checked = true;
        
        // Reset titik input
        pointInputsContainer.innerHTML = '';
        pointCounter = 1;
        initializePointInputs();
        
        // Sembunyikan hasil
        resultsContainer.classList.add('hidden');
        
        // Hancurkan chart jika ada
        if (chart) {
            chart.destroy();
            chart = null;
        }
    }
});

// Tambahkan style untuk toast notification
const toastStyle = document.createElement('style');
toastStyle.textContent = `
.error-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background-color: var(--danger-color);
    color: white;
    padding: 12px 20px;
    border-radius: var(--border-radius-sm);
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    opacity: 0;
    transition: all 0.3s ease;
}

.error-toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}

.error-toast i {
    font-size: 1.2rem;
}
`;
document.head.appendChild(toastStyle);